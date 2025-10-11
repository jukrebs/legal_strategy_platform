import json
import requests
import time
from urllib.parse import quote

INPUT_FILENAME = "reckless_driving_cases.json"
OUTPUT_FILENAME = "judges_with_dockets_and_syllabus.json"

def get_judge_id(name_first, name_last):
    """Fetch judge ID from CourtListener People API"""
    url = f"https://www.courtlistener.com/api/rest/v4/people/?name_first={quote(name_first)}&name_last={quote(name_last)}"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data["results"]:
            return data["results"][0]["id"]
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Error fetching judge_id for {name_first} {name_last}: {e}")
    return None

def get_dockets_by_judge(judge_name, max_pages=5):
    """Fetch up to `max_pages` of dockets for a given judge name and extract key fields only."""
    base_url = "https://www.courtlistener.com/api/rest/v4/search/"
    encoded_name = quote(judge_name, safe='')  
    url = f"{base_url}?judge={encoded_name}"
    simplified_dockets = []
    seen_urls = set()
    page = 0

    try:
        while url and url not in seen_urls and page < max_pages:
            page += 1
            seen_urls.add(url)
            print(f"  Fetching page {page}: {url}")

            response = requests.get(url, timeout=15)
            response.raise_for_status()
            data = response.json()

            for docket in data.get("results", []):
                simplified_dockets.append({
                    "caseName": docket.get("caseName"),
                    "cluster_id": docket.get("cluster_id"),
                    "court": docket.get("court"),
                    "opinions": docket.get("opinions", []),
                    "syllabus": docket.get("syllabus", "")
                })

            url = data.get("next")  # pagination
            time.sleep(0.5)

        if page == max_pages:
            print(f"  ⚠️ Reached page limit ({max_pages}). Stopping pagination.")
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Error fetching dockets for {judge_name}: {e}")

    return simplified_dockets


def extract_unique_judges(input_file):
    """Extract unique judges from the JSON input"""
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    judges = set()
    for case in data:
        if "judge" in case and case["judge"]:
            judges.add(case["judge"].strip())

    return sorted(judges)

def main():
    judges = extract_unique_judges(INPUT_FILENAME)
    results = []

    for i, judge in enumerate(judges, 1):
        print(f"\n[{i}/{len(judges)}] Processing judge: {judge}")
        parts = judge.split()
        if len(parts) < 2:
            print(f"  ⚠️ Skipping invalid judge name: {judge}")
            continue

        name_first, name_last = parts[0], parts[-1]
        judge_id = get_judge_id(name_first, name_last)
        dockets = get_dockets_by_judge(judge)

        results.append({
            "judge_name": judge,
            "judge_id": judge_id,
            "docket_count": len(dockets),
            "dockets": dockets,
        })

        with open(OUTPUT_FILENAME, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)

    print(f"\n✅ Done! Results saved to {OUTPUT_FILENAME}")

if __name__ == "__main__":
    main()
