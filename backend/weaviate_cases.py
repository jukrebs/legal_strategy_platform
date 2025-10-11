#!/usr/bin/env python3
"""
Weaviate ingestion and similarity search tooling for court-case datasets.

This module provides a command-line interface that can:
  * Create a Weaviate collection configured with an embeddings module.
  * Ingest a JSON/JSONL dataset of court cases into that collection.
  * Run similarity searches using free text or the body of an existing case record.

It targets the Weaviate Python client 4.x API (`client.collections.*`).  The script expects
an existing Weaviate instance (local or cloud).  Authenticate via `WEAVIATE_URL` and
`WEAVIATE_API_KEY` environment variables or the corresponding CLI flags.
"""

from __future__ import annotations

import argparse
import inspect
import json
import logging
import os
import sys
import textwrap
import uuid
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Dict, Iterable, Iterator, List, Optional, Tuple

import requests
import yaml

try:
    import weaviate
except ImportError as exc:  # pragma: no cover - dependency handled via environment.yml
    raise SystemExit(
        "The 'weaviate-client' package is required to run this script. "
        "Install it in your environment (see environment.yml)."
    ) from exc

try:  # New-style auth helper (Weaviate client v4)
    from weaviate.classes.init import Auth  # type: ignore
except ImportError:  # pragma: no cover - fallback for older client versions
    Auth = None  # type: ignore

try:
    from weaviate.classes.query import MetadataQuery  # type: ignore
except ImportError:  # pragma: no cover - metadata retrieval optional
    MetadataQuery = None  # type: ignore

DEFAULT_COLLECTION_NAME = "CourtCase"
SUPPORTED_VECTOR_MODULES = {"text2vec-weaviate", "text2vec-openai", "text2vec-cohere"}
REQUEST_TIMEOUT = 30


@dataclass
class ConnectionOptions:
    url: str
    api_key: Optional[str]
    openai_api_key: Optional[str]
    timeout: int


@dataclass
class CollectionOptions:
    name: str
    vectorizer: str
    embedding_model: Optional[str]
    force_recreate: bool
    skip_create: bool
    extra_properties: List[Dict[str, str]]


def build_connection_options(config: Dict[str, Any]) -> ConnectionOptions:
    """Construct connection options from configuration, falling back to environment variables."""
    cfg = config.get("weaviate", {})
    if not isinstance(cfg, dict):
        raise SystemExit("'weaviate' section in config must be a mapping.")

    url = cfg.get("url") or os.environ.get("WEAVIATE_URL")
    if not url:
        raise SystemExit("Weaviate URL missing. Set it in config under weaviate.url or via WEAVIATE_URL.")

    api_key = cfg.get("api_key")
    if api_key in ("", None):
        api_key = os.environ.get("WEAVIATE_API_KEY")

    openai_api_key = cfg.get("openai_api_key")
    if openai_api_key in ("", None):
        # Accept both common env var names
        openai_api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_APIKEY")

    timeout = cfg.get("timeout", REQUEST_TIMEOUT)

    return ConnectionOptions(
        url=normalize_url(str(url)),
        api_key=api_key,
        openai_api_key=openai_api_key,
        timeout=int(timeout),
    )


def build_collection_options(config: Dict[str, Any]) -> CollectionOptions:
    """Construct collection options from configuration."""
    cfg = config.get("collection", {})
    if not isinstance(cfg, dict):
        raise SystemExit("'collection' section in config must be a mapping.")

    raw_extra_properties = cfg.get("extra_properties", [])
    extra_properties: List[Dict[str, str]] = []
    if isinstance(raw_extra_properties, list):
        for entry in raw_extra_properties:
            if isinstance(entry, str):
                extra_properties.append({"name": entry, "description": ""})
            elif isinstance(entry, dict) and "name" in entry:
                extra_properties.append(
                    {
                        "name": str(entry["name"]),
                        "description": str(entry.get("description", "")),
                    }
                )
            else:
                raise SystemExit(
                    "Each item in collection.extra_properties must be either a string or a mapping with a 'name'."
                )
    elif raw_extra_properties:
        raise SystemExit("collection.extra_properties must be a list when provided.")

    return CollectionOptions(
        name=cfg.get("name", DEFAULT_COLLECTION_NAME),
        vectorizer=cfg.get("vectorizer", "text2vec-weaviate"),
        embedding_model=cfg.get("embedding_model"),
        force_recreate=bool(cfg.get("force_recreate", False)),
        skip_create=bool(cfg.get("skip_create", False)),
        extra_properties=extra_properties,
    )


def configure_logging(verbose: bool) -> None:
    """Configure logging level."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=level, format="%(levelname)s %(message)s")


def expand_env(value: Any) -> Any:
    """Recursively expand environment variables in configuration values."""
    if isinstance(value, str):
        return os.path.expandvars(value)
    if isinstance(value, list):
        return [expand_env(item) for item in value]
    if isinstance(value, dict):
        return {key: expand_env(val) for key, val in value.items()}
    return value


def load_config_file(path: Path) -> Dict[str, Any]:
    """Load YAML configuration from disk."""
    if not path.exists():
        raise SystemExit(f"Configuration file '{path}' not found.")
    try:
        with path.open("r", encoding="utf-8") as handle:
            data = yaml.safe_load(handle) or {}
    except yaml.YAMLError as exc:
        raise SystemExit(f"Failed to parse YAML config '{path}': {exc}") from exc
    if not isinstance(data, dict):
        raise SystemExit("Configuration root must be a mapping (YAML dictionary).")
    return expand_env(data)


def build_http_headers(connection: ConnectionOptions) -> Dict[str, str]:
    """Create base HTTP headers for REST interactions."""
    headers: Dict[str, str] = {"Content-Type": "application/json"}
    if connection.api_key:
        headers["Authorization"] = f"Bearer {connection.api_key}"
    if connection.openai_api_key:
        headers["X-OpenAI-Api-Key"] = connection.openai_api_key
    return headers


def normalize_url(url: str) -> str:
    """Ensure the base URL has no trailing slash."""
    if url.endswith("/"):
        return url.rstrip("/")
    return url


def connect_weaviate_client(connection: ConnectionOptions) -> Any:
    """
    Instantiate a Weaviate client using whichever client API is available.

    Prefers the v4 `connect_to_weaviate_cloud` helper. Falls back to legacy Client.
    """
    base_headers = {}
    if connection.openai_api_key:
        base_headers["X-OpenAI-Api-Key"] = connection.openai_api_key

    # Prefer new connector API when available.
    if hasattr(weaviate, "connect_to_weaviate_cloud") and Auth is not None:
        auth_credentials = Auth.api_key(connection.api_key) if connection.api_key else None
        logging.debug("Connecting to Weaviate using connect_to_weaviate_cloud helper.")
        connect_kwargs = {
            "cluster_url": connection.url,
            "auth_credentials": auth_credentials,
        }
        if base_headers:
            connect_kwargs["headers"] = base_headers
            if "grpc_headers" in inspect.signature(weaviate.connect_to_weaviate_cloud).parameters:
                connect_kwargs["grpc_headers"] = base_headers
        client = weaviate.connect_to_weaviate_cloud(**connect_kwargs)
        return client

    # Legacy (3.x) fallback.
    logging.debug("Falling back to the legacy weaviate.Client initialisation.")
    auth_kwargs: Dict[str, Any] = {}
    if connection.api_key:
        try:
            auth_kwargs["auth_client_secret"] = weaviate.AuthApiKey(connection.api_key)  # type: ignore[attr-defined]
        except AttributeError as exc:  # pragma: no cover - very old client
            raise SystemExit(
                "The installed weaviate-client version does not support API key authentication. "
                "Upgrade to >=3.24 or use the environment.yml provided in this project."
            ) from exc
    client_kwargs = {
        "timeout_config": (connection.timeout, connection.timeout),
        "additional_headers": base_headers or None,
    }
    if base_headers and "grpc_headers" in inspect.signature(weaviate.Client).parameters:
        client_kwargs["grpc_headers"] = base_headers
    client = weaviate.Client(  # type: ignore[call-arg,arg-type]
        connection.url,
        **client_kwargs,
        **auth_kwargs,
    )
    return client


def get_collection_schema(
    connection: ConnectionOptions,
    collection_name: str,
) -> Optional[Dict[str, Any]]:
    """Return the collection schema if it exists, otherwise None."""
    base_url = normalize_url(connection.url)
    headers = build_http_headers(connection)
    response = requests.get(
        f"{base_url}/v1/schema/{collection_name}",
        headers=headers,
        timeout=connection.timeout,
    )
    if response.status_code == 404:
        return None
    if response.ok:
        return response.json()
    logging.debug("Schema lookup failed (%s): %s", response.status_code, response.text)
    response.raise_for_status()
    return None


def delete_collection(
    connection: ConnectionOptions,
    collection_name: str,
) -> None:
    """Delete a collection (and all data) if it exists."""
    base_url = normalize_url(connection.url)
    headers = build_http_headers(connection)
    response = requests.delete(
        f"{base_url}/v1/schema/{collection_name}",
        headers=headers,
        timeout=connection.timeout,
    )
    if response.status_code in (200, 204, 202, 404):
        logging.info("Deleted collection '%s' (status %s).", collection_name, response.status_code)
        return
    logging.error("Failed to delete collection '%s': %s", collection_name, response.text)
    response.raise_for_status()


def create_collection(
    connection: ConnectionOptions,
    collection: CollectionOptions,
) -> None:
    """Create the target collection with sensible defaults."""
    def property_schema(name: str, description: str, include_in_vector: bool) -> Dict[str, Any]:
        prop: Dict[str, Any] = {
            "name": name,
            "dataType": ["text"],
            "description": description,
        }
        if not include_in_vector:
            prop["moduleConfig"] = {collection.vectorizer: {"skip": True}}
        return prop

    base_url = normalize_url(connection.url)
    headers = build_http_headers(connection)

    if collection.vectorizer not in SUPPORTED_VECTOR_MODULES:
        raise SystemExit(
            f"Unsupported vectorizer '{collection.vectorizer}'. "
            f"Supported values: {', '.join(sorted(SUPPORTED_VECTOR_MODULES))}."
        )

    module_config: Dict[str, Dict[str, Any]] = {collection.vectorizer: {}}
    if collection.embedding_model:
        module_config[collection.vectorizer]["model"] = collection.embedding_model

    schema_definition = {
        "class": collection.name,
        "description": "Court case dataset for similarity search.",
        "vectorizer": collection.vectorizer,
        "moduleConfig": module_config,
        "properties": [
            property_schema("case_id", "Original case identifier.", include_in_vector=False),
            property_schema("title", "Case caption or title.", include_in_vector=False),
            property_schema("body", "Case narrative or opinion text.", include_in_vector=True),
            property_schema("metadata", "Additional metadata in JSON format.", include_in_vector=False),
            property_schema(
                "source_file",
                "Name of the source JSON file the record originated from.",
                include_in_vector=False,
            ),
        ],
    }

    existing_property_names = {prop["name"] for prop in schema_definition["properties"]}
    for extra_property in collection.extra_properties:
        prop_name = extra_property.get("name")
        if not prop_name or prop_name in existing_property_names:
            continue
        description = extra_property.get("description") or f"Additional field '{prop_name}'."
        schema_definition["properties"].append(
            property_schema(prop_name, description, include_in_vector=False)
        )
        existing_property_names.add(prop_name)

    response = requests.post(
        f"{base_url}/v1/schema",
        headers=headers,
        json=schema_definition,
        timeout=connection.timeout,
    )

    if response.status_code in (200, 201):
        logging.info("Created collection '%s' with vectorizer '%s'.", collection.name, collection.vectorizer)
        return

    if response.status_code == 422 and "already used" in response.text:
        logging.info("Collection '%s' already exists.", collection.name)
        return

    if response.status_code == 400 and "already exists" in response.text.lower():
        logging.info("Collection '%s' already exists.", collection.name)
        return

    logging.error("Collection creation failed (%s): %s", response.status_code, response.text)
    response.raise_for_status()


def ensure_collection(
    connection: ConnectionOptions,
    collection: CollectionOptions,
) -> None:
    """
    Ensure the target collection exists (optionally recreating it).

    Raises SystemExit if the collection is missing and creation is skipped.
    """
    existing = get_collection_schema(connection, collection.name)
    if existing:
        if collection.force_recreate:
            logging.info("Recreating collection '%s' as requested.", collection.name)
            delete_collection(connection, collection.name)
            create_collection(connection, collection)
        else:
            logging.info("Collection '%s' already exists. Skipping creation.", collection.name)
        return

    if collection.skip_create:
        raise SystemExit(
            f"Collection '{collection.name}' does not exist. "
            "Remove --skip-create or create it manually before ingesting data."
        )

    create_collection(connection, collection)


def detect_input_format(path: Path, explicit_format: str, data_key: Optional[str]) -> str:
    """Infer input format when --input-format=auto."""
    if explicit_format != "auto":
        return explicit_format
    with path.open("r", encoding="utf-8") as handle:
        snippet = handle.read(2048).lstrip()
    if not snippet:
        raise SystemExit(f"Input file '{path}' is empty.")
    first_char = snippet[0]
    if first_char == "[":
        return "json"
    if first_char == "{" and data_key:
        return "json"
    # Assume JSON Lines otherwise
    return "jsonl"


def iter_dataset_records(
    path: Path,
    input_format: str,
    data_key: Optional[str],
) -> Iterator[Dict[str, Any]]:
    """Yield records from the dataset."""
    detected_format = detect_input_format(path, input_format, data_key)
    if detected_format == "json":
        with path.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        if isinstance(payload, list):
            for idx, item in enumerate(payload, start=1):
                if not isinstance(item, dict):
                    raise SystemExit(f"Entry #{idx} in '{path}' is not an object.")
                yield item
            return
        if isinstance(payload, dict):
            if not data_key:
                raise SystemExit(
                    f"Top-level JSON object found in '{path}'. "
                    "Specify --data-key to select the array containing cases."
                )
            try:
                records = payload[data_key]
            except KeyError as exc:
                raise SystemExit(f"Key '{data_key}' not found in '{path}'.") from exc
            if not isinstance(records, list):
                raise SystemExit(f"The value mapped by '{data_key}' must be a list.")
            for idx, item in enumerate(records, start=1):
                if not isinstance(item, dict):
                    raise SystemExit(f"Entry #{idx} under '{data_key}' is not an object.")
                yield item
            return
        raise SystemExit(f"Unsupported JSON structure in '{path}'.")

    # JSON Lines mode
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            stripped = line.strip()
            if not stripped:
                continue
            try:
                item = json.loads(stripped)
            except json.JSONDecodeError as exc:
                raise SystemExit(
                    f"Invalid JSON on line {line_number} of '{path}': {exc}"
                ) from exc
            if not isinstance(item, dict):
                raise SystemExit(f"Line {line_number} of '{path}' is not a JSON object.")
            yield item


def extract_case_fields(
    record: Dict[str, Any],
    *,
    id_field: Optional[str],
    text_field: str,
    title_field: Optional[str],
    metadata_fields: Iterable[str],
) -> Tuple[str, str, Optional[str], Dict[str, Any]]:
    """Extract the relevant fields for ingestion."""
    if text_field not in record or record[text_field] in (None, ""):
        raise ValueError(f"Record missing required text field '{text_field}'.")

    raw_id = str(record[id_field]) if id_field and record.get(id_field) is not None else str(uuid.uuid4())

    text_value = str(record[text_field]).strip()
    if not text_value:
        raise ValueError("Case text is empty after stripping whitespace.")

    title_value: Optional[str] = None
    if title_field:
        raw_title = record.get(title_field)
        if raw_title not in (None, ""):
            title_value = str(raw_title).strip()

    metadata: Dict[str, Any] = {}
    for field in metadata_fields:
        if field in record and record[field] not in (None, ""):
            metadata[field] = record[field]

    return raw_id, text_value, title_value, metadata


def format_metadata(metadata: Dict[str, Any]) -> str:
    """Serialize metadata dict to a JSON string."""
    if not metadata:
        return ""
    return json.dumps(metadata, ensure_ascii=False)


def derive_query_via_reasoning(
    document_text: str,
    *,
    connection: ConnectionOptions,
    model: Optional[str],
    effort: Optional[str],
    api_base: Optional[str],
) -> str:
    """Call the OpenAI Responses API to produce a single natural-language query."""
    import os
    from openai import OpenAI  # type: ignore[import]

    api_key = (
        connection.openai_api_key
        or os.environ.get("OPENAI_API_KEY")
        or os.environ.get("OPENAI_APIKEY")
    )

    base_url = (api_base or os.environ.get("OPENAI_API_BASE") or "https://api.openai.com/v1").rstrip("/")
    model_name = (model or "gpt-5").strip().replace(" ", "-").lower()
    effort_level = (effort or "high").strip().lower()

    trimmed = (document_text or "").strip()
    if len(trimmed) > 15000:
        trimmed = trimmed[:15000]

    prompt = (
        "Produce a natural-language query for semantic retrieval of similar court cases based on the input. "
        "Output ONLY the query text, no quotes, labels, or commentary.\n\n"
        f"Document:\n{trimmed}"
    )

    client = OpenAI(api_key=api_key, base_url=base_url, max_retries=0)
    result = client.responses.create(
        model=model_name,
        input=prompt,
        reasoning={"effort": effort_level},
        max_output_tokens=4000,
        text={"verbosity": "low"},
    )

    return (result.output_text or "").strip()




def build_ingest_namespace(config: Dict[str, Any]) -> SimpleNamespace:
    """Create a namespace of ingestion options sourced from config."""
    ingest_cfg = config.get("ingest")
    if ingest_cfg is None:
        raise SystemExit("Ingest operation requested but 'ingest' section is missing in config.")
    if not isinstance(ingest_cfg, dict):
        raise SystemExit("'ingest' section must be a mapping.")

    if not ingest_cfg.get("input"):
        raise SystemExit("'ingest.input' is required in the configuration.")

    metadata_fields = ingest_cfg.get("metadata_fields") or []
    if metadata_fields and not isinstance(metadata_fields, list):
        raise SystemExit("'ingest.metadata_fields' must be a list if provided.")

    return SimpleNamespace(
        input=Path(ingest_cfg["input"]),
        input_format=ingest_cfg.get("input_format", "auto"),
        data_key=ingest_cfg.get("data_key"),
        id_field=ingest_cfg.get("id_field", "id"),
        text_field=ingest_cfg.get("text_field", "text"),
        title_field=ingest_cfg.get("title_field"),
        metadata_fields=metadata_fields,
        limit=ingest_cfg.get("limit"),
        dry_run=bool(ingest_cfg.get("dry_run", False)),
        preview=ingest_cfg.get("preview", 3),
        log_every=ingest_cfg.get("log_every", 50),
    )


def build_search_namespace(
    config: Dict[str, Any],
    default_collection: str,
    extra_property_names: Iterable[str],
) -> Tuple[str, SimpleNamespace]:
    """Create a namespace of search options sourced from config."""
    search_cfg = config.get("search")
    if search_cfg is None:
        raise SystemExit("Search operation requested but 'search' section is missing in config.")
    if not isinstance(search_cfg, dict):
        raise SystemExit("'search' section must be a mapping.")

    collection_name = search_cfg.get("collection", default_collection)

    extra_names_list = [name for name in extra_property_names if name]

    return collection_name, SimpleNamespace(
        query=search_cfg.get("query"),
        query_file=search_cfg.get("query_file"),
        case_json=search_cfg.get("case_json"),
        text_field=search_cfg.get("text_field", "text"),
        title_field=search_cfg.get("title_field"),
        top_k=search_cfg.get("top_k", 5),
        include_distance=bool(search_cfg.get("include_distance", False)),
        snippet_width=search_cfg.get("snippet_width", 180),
        show_metadata=bool(search_cfg.get("show_metadata", False)),
        extra_property_names=extra_names_list,
        reasoning_model=search_cfg.get("reasoning_model"),
        reasoning_effort=search_cfg.get("reasoning_effort", "low"),
        reasoning_api_base=search_cfg.get("reasoning_api_base"),
    )


def iter_prepared_objects(
    args: argparse.Namespace, extra_property_names: Iterable[str]
) -> Iterator[Tuple[str, Dict[str, Any]]]:
    """Yield (case_id, properties) tuples ready for ingestion."""
    extra_property_set = {name for name in extra_property_names if name}
    metadata_fields = [field for field in (args.metadata_fields or []) if field not in extra_property_set]
    records = iter_dataset_records(args.input, args.input_format, args.data_key)

    processed = 0
    for index, record in enumerate(records, start=1):
        if args.limit is not None and processed >= args.limit:
            break
        try:
            case_id, text_value, title_value, metadata = extract_case_fields(
                record,
                id_field=args.id_field,
                text_field=args.text_field,
                title_field=args.title_field,
                metadata_fields=metadata_fields,
            )
        except ValueError as exc:
            logging.warning("Skipping record #%s: %s", index, exc)
            continue

        properties: Dict[str, Any] = {
            "case_id": case_id,
            "body": text_value,
        }
        properties["source_file"] = args.input.name
        if title_value:
            properties["title"] = title_value

        metadata_json = format_metadata(metadata)
        if metadata_json:
            properties["metadata"] = metadata_json

        for field_name in extra_property_set:
            if field_name in record and record[field_name] not in (None, ""):
                properties[field_name] = str(record[field_name]).strip()

        yield case_id, properties
        processed += 1


def ingest_cases(
    connection: ConnectionOptions,
    collection_options: CollectionOptions,
    args: argparse.Namespace,
) -> None:
    """Ingest dataset records into Weaviate."""
    ensure_collection(connection, collection_options)

    client = connect_weaviate_client(connection)
    try:
        try:
            collection = client.collections.get(collection_options.name)
        except Exception as exc:  # pragma: no cover - defensive, depends on client version
            raise SystemExit(f"Failed to access collection '{collection_options.name}': {exc}") from exc

        extra_property_names = [
            prop.get("name")
            for prop in collection_options.extra_properties
            if isinstance(prop, dict) and prop.get("name")
        ]
        preview_cap = args.preview if args.preview is not None else 3
        total_objects = 0

        if args.dry_run:
            for idx, (case_id, properties) in enumerate(
                iter_prepared_objects(args, extra_property_names), start=1
            ):
                total_objects += 1
                if idx <= preview_cap:
                    logging.info(
                        "Dry-run sample #%s | case_id=%s | excerpt=%s",
                        idx,
                        case_id,
                        textwrap.shorten(properties.get("body", ""), width=120, placeholder="…"),
                    )
            logging.info("Dry run complete. %s objects would be ingested.", total_objects)
            return

        log_every = args.log_every
        with collection.batch.dynamic() as batch:
            for case_id, properties in iter_prepared_objects(args, extra_property_names):
                batch.add_object(properties=properties)
                total_objects += 1
                if total_objects == 1 or total_objects % log_every == 0:
                    logging.info("Queued %s objects. Latest case_id=%s", total_objects, case_id)

        failed_objects = collection.batch.failed_objects
        if failed_objects:
            logging.error("Ingestion completed with %s failed objects.", len(failed_objects))
            logging.debug("First failed object: %s", failed_objects[0])
        else:
            logging.info("Ingestion completed successfully. %s objects imported.", total_objects)
    finally:
        try:
            client.close()
        except AttributeError:  # Legacy client does not implement close()
            pass


def resolve_query_text(args: argparse.Namespace, connection: ConnectionOptions) -> str:
    """Resolve the text query used for similarity search."""
    if args.query:
        query_text = args.query.strip()
        if query_text:
            return query_text

    if args.query_file:
        path = Path(args.query_file)
        if not path.exists():
            raise SystemExit(f"Query file '{path}' does not exist.")
        if path.suffix.lower() == ".pdf":
            try:
                from pypdf import PdfReader  # type: ignore[import]
            except ImportError:
                try:
                    from PyPDF2 import PdfReader  # type: ignore[import]
                except ImportError as exc:  # pragma: no cover - optional dependency
                    raise SystemExit(
                        "PDF query support requires the 'pypdf' or 'PyPDF2' package. "
                        "Install it (e.g. pip install pypdf)."
                    ) from exc

            try:
                reader = PdfReader(str(path))
            except Exception as exc:  # pragma: no cover - depends on PDF structure
                raise SystemExit(f"Failed to open PDF query file '{path}': {exc}") from exc

            extracted_pages: List[str] = []
            for page_index, page in enumerate(getattr(reader, "pages", []), start=1):
                try:
                    page_text = page.extract_text() or ""
                except Exception as exc:  # pragma: no cover - extraction varies by PDF
                    logging.warning("Skipping page %s in '%s': %s", page_index, path, exc)
                    continue
                cleaned = page_text.strip()
                if cleaned:
                    extracted_pages.append(cleaned)

            content = "\n\n".join(extracted_pages).strip()
            if not content:
                raise SystemExit(f"PDF query file '{path}' contained no extractable text.")
        else:
            content = path.read_text(encoding="utf-8").strip()
        if not content:
            raise SystemExit(f"Query file '{path}' is empty.")
        return derive_query_via_reasoning(
            content,
            connection=connection,
            model=args.reasoning_model,
            effort=args.reasoning_effort,
            api_base=args.reasoning_api_base,
        )

    if args.case_json:
        path = Path(args.case_json)
        if not path.exists():
            raise SystemExit(f"Case JSON file '{path}' does not exist.")
        try:
            record = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise SystemExit(f"Failed to parse JSON from '{path}': {exc}") from exc
        if not isinstance(record, dict):
            raise SystemExit(f"Case JSON '{path}' must contain a JSON object.")
        if args.text_field not in record or not record[args.text_field]:
            raise SystemExit(
                f"Case JSON '{path}' does not contain the required text field '{args.text_field}'."
            )
        text_value = str(record[args.text_field]).strip()
        if args.title_field and record.get(args.title_field):
            text_value = f"{record[args.title_field]}.\n\n{text_value}"
        return text_value

    raise SystemExit("A query source is required. Provide --query, --query-file, or --case-json.")


def search_cases(connection: ConnectionOptions, collection_name: str, args: argparse.Namespace) -> None:
    """Perform similarity search against the stored embeddings."""
    client = connect_weaviate_client(connection)
    try:
        try:
            collection = client.collections.get(collection_name)
        except Exception as exc:  # pragma: no cover - depends on client version
            raise SystemExit(f"Failed to access collection '{collection_name}': {exc}") from exc

        query_text = resolve_query_text(args, connection)
        logging.info("Search query text: %s", query_text)
        logging.info("Running similarity search (k=%s).", args.top_k)

        metadata_query = None
        if args.include_distance and MetadataQuery is not None:
            metadata_query = MetadataQuery(distance=True, certainty=True)  # type: ignore[call-arg]

        extra_property_names = getattr(args, "extra_property_names", [])
        return_properties = ["case_id", "title", "body", "metadata", "source_file"]
        for name in extra_property_names:
            if name and name not in return_properties:
                return_properties.append(name)

        response = collection.query.near_text(
            query=query_text,
            limit=args.top_k,
            return_properties=return_properties,
            return_metadata=metadata_query,
        )

        if not response.objects:
            logging.warning("No results returned.")
            return

        for rank, obj in enumerate(response.objects, start=1):
            properties = obj.properties or {}
            metadata = getattr(obj, "metadata", None)

            case_id = properties.get("case_id") or obj.uuid
            title = properties.get("title")
            body = properties.get("body", "")
            distance = getattr(metadata, "distance", None) if metadata else None
            certainty = getattr(metadata, "certainty", None) if metadata else None

            print(f"{rank}. case_id={case_id}")
            if distance is not None:
                print(f"   distance={distance:.4f}", end="")
                if certainty is not None:
                    print(f" | certainty={certainty:.4f}")
                else:
                    print()
            elif certainty is not None:
                print(f"   certainty={certainty:.4f}")

            if title:
                print(f"   title={title}")
            if body:
                print(f"   body={body}")
            source_file = properties.get("source_file")
            if source_file:
                print(f"   source_file={source_file}")

            for field_name in extra_property_names:
                field_value = properties.get(field_name)
                if field_value:
                    print(f"   {field_name}={field_value}")

            if args.show_metadata and properties.get("metadata"):
                try:
                    metadata_obj = json.loads(properties["metadata"])
                except json.JSONDecodeError:
                    metadata_obj = properties["metadata"]
                print(f"   metadata={metadata_obj}")
            print()
    finally:
        try:
            client.close()
        except AttributeError:  # Legacy client
            pass


def build_parser() -> argparse.ArgumentParser:
    """Build the configuration-first CLI parser."""
    parser = argparse.ArgumentParser(
        description="Manage a Weaviate-backed embedding index for court cases via YAML config.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("config.yaml"),
        help="Path to the YAML configuration file.",
    )
    parser.add_argument(
        "--operation",
        choices=("create-collection", "ingest", "search"),
        help="Override the operation defined in the config.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Force verbose logging (overrides config setting).",
    )
    return parser


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    """Parse CLI arguments and validate essentials."""
    parser = build_parser()
    return parser.parse_args(argv)


def main(argv: Optional[List[str]] = None) -> None:
    """Entry point."""
    args = parse_args(argv)
    config = load_config_file(args.config)

    verbose_flag = args.verbose or bool(config.get("verbose", False))
    configure_logging(verbose_flag)

    if args.operation:
        operations = [args.operation]
    else:
        operations_config = config.get("operations")
        if operations_config is None:
            single_operation = config.get("operation")
            operations_config = [single_operation] if single_operation else []
        if isinstance(operations_config, str):
            operations = [operations_config]
        elif isinstance(operations_config, list):
            operations = [op for op in operations_config if op]
        else:
            raise SystemExit("'operations' must be a list or string.")

    if not operations:
        raise SystemExit(
            "No operation specified. Add 'operation' or 'operations' to the config, or pass --operation."
        )

    connection = build_connection_options(config)
    collection_opts = build_collection_options(config)
    extra_property_names = [
        prop.get("name")
        for prop in collection_opts.extra_properties
        if isinstance(prop, dict) and prop.get("name")
    ]

    for op in operations:
        logging.info("Starting operation '%s'.", op)
        if op == "create-collection":
            ensure_collection(connection, collection_opts)
        elif op == "ingest":
            ingest_args = build_ingest_namespace(config)
            ingest_cases(connection, collection_opts, ingest_args)
        elif op == "search":
            collection_name, search_args = build_search_namespace(
                config, collection_opts.name, extra_property_names
            )
            search_cases(connection, collection_name, search_args)
        else:
            raise SystemExit(f"Unsupported operation '{op}'. Allowed values: create-collection, ingest, search.")


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    main()
