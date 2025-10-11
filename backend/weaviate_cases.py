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
        openai_api_key = os.environ.get("OPENAI_APIKEY")

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

    return CollectionOptions(
        name=cfg.get("name", DEFAULT_COLLECTION_NAME),
        vectorizer=cfg.get("vectorizer", "text2vec-weaviate"),
        embedding_model=cfg.get("embedding_model"),
        force_recreate=bool(cfg.get("force_recreate", False)),
        skip_create=bool(cfg.get("skip_create", False)),
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
        client = weaviate.connect_to_weaviate_cloud(
            cluster_url=connection.url,
            auth_credentials=auth_credentials,
            headers=base_headers or None,
        )
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
    client = weaviate.Client(  # type: ignore[call-arg]
        connection.url,
        timeout_config=(connection.timeout, connection.timeout),
        additional_headers=base_headers or None,
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
            {
                "name": "case_id",
                "dataType": ["text"],
                "description": "Original case identifier.",
            },
            {
                "name": "title",
                "dataType": ["text"],
                "description": "Case caption or title.",
            },
            {
                "name": "body",
                "dataType": ["text"],
                "description": "Case narrative or opinion text.",
            },
            {
                "name": "metadata",
                "dataType": ["text"],
                "description": "Additional metadata in JSON format.",
            },
        ],
    }

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


def build_search_namespace(config: Dict[str, Any], default_collection: str) -> Tuple[str, SimpleNamespace]:
    """Create a namespace of search options sourced from config."""
    search_cfg = config.get("search")
    if search_cfg is None:
        raise SystemExit("Search operation requested but 'search' section is missing in config.")
    if not isinstance(search_cfg, dict):
        raise SystemExit("'search' section must be a mapping.")

    collection_name = search_cfg.get("collection", default_collection)

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
    )


def iter_prepared_objects(args: argparse.Namespace) -> Iterator[Tuple[str, Dict[str, Any]]]:
    """Yield (case_id, properties) tuples ready for ingestion."""
    metadata_fields = args.metadata_fields or []
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
        if title_value:
            properties["title"] = title_value

        metadata_json = format_metadata(metadata)
        if metadata_json:
            properties["metadata"] = metadata_json

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

        preview_cap = args.preview if args.preview is not None else 3
        total_objects = 0

        if args.dry_run:
            for idx, (case_id, properties) in enumerate(iter_prepared_objects(args), start=1):
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
            for case_id, properties in iter_prepared_objects(args):
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


    try:
        client.close()
    except AttributeError:  # Legacy client does not implement close()
        pass


def resolve_query_text(args: argparse.Namespace) -> str:
    """Resolve the text query used for similarity search."""
    if args.query:
        query_text = args.query.strip()
        if query_text:
            return query_text

    if args.query_file:
        path = Path(args.query_file)
        if not path.exists():
            raise SystemExit(f"Query file '{path}' does not exist.")
        content = path.read_text(encoding="utf-8").strip()
        if not content:
            raise SystemExit(f"Query file '{path}' is empty.")
        return content

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

        query_text = resolve_query_text(args)
        logging.info("Running similarity search (k=%s).", args.top_k)

        metadata_query = None
        if args.include_distance and MetadataQuery is not None:
            metadata_query = MetadataQuery(distance=True, certainty=True)  # type: ignore[call-arg]

        response = collection.query.near_text(
            query=query_text,
            limit=args.top_k,
            return_properties=["case_id", "title", "body", "metadata"],
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
            snippet = textwrap.shorten(body, width=args.snippet_width, placeholder="…") if body else ""
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
            if snippet:
                print(f"   snippet={snippet}")

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

    for op in operations:
        logging.info("Starting operation '%s'.", op)
        if op == "create-collection":
            ensure_collection(connection, collection_opts)
        elif op == "ingest":
            ingest_args = build_ingest_namespace(config)
            ingest_cases(connection, collection_opts, ingest_args)
        elif op == "search":
            collection_name, search_args = build_search_namespace(config, collection_opts.name)
            search_cases(connection, collection_name, search_args)
        else:
            raise SystemExit(f"Unsupported operation '{op}'. Allowed values: create-collection, ingest, search.")


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    main()
