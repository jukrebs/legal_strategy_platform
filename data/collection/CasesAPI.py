import requests
import json
from dotenv import load_dotenv
import os
load_dotenv()
MY_TOKEN = os.getenv("COURTLISTENER_API_KEY")

def query_courtlistener_api(api_token=None, max_pages=None):
    """
    Queries the CourtListener API, filters results, and returns a list of cases.
    """
    base_url = 'https://www.courtlistener.com/api/rest/v4/search/'
    params = {
        'q': 'disorderly conduct',
        'type': 'o'
    }
    headers = {}
    if api_token:
        headers['Authorization'] = f'Token {api_token}'
        print("Using API token for authentication.")

    extracted_data = []

    try:
        print("Fetching page 1...")
        response = requests.get(base_url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

        print(f"Status code: {response.status_code}")
        print(f"Total results available: {data.get('count', 'N/A')}")

        results = data.get('results', [])
        page_count = 1

        for result in results:
            judge_name = result.get('judge')
            case_data = {
                'cluster_id': result.get('cluster_id'),
                'absolute_url': result.get('absolute_url'),
                'caseName': result.get('caseName'),
                'court': result.get('court'),
                'dateFiled': result.get('dateFiled'),
                'judge': judge_name.replace('Judge', '').strip() if judge_name else None,
                'syllabus': result.get('syllabus'),
            }
            if case_data['judge'] and case_data['syllabus']:
                extracted_data.append(case_data)

        next_page_url = data.get('next')
        while next_page_url:
            if max_pages is not None and page_count >= max_pages:
                print(f"\n--- Reached page limit of {max_pages}. Stopping. ---")
                break

            page_count += 1
            print(f"Fetching page {page_count}...")

            response = requests.get(next_page_url, headers=headers)
            response.raise_for_status()
            data = response.json()
            results = data.get('results', [])

            for result in results:
                judge_name = result.get('judge')
                case_data = {
                    'absolute_url': result.get('absolute_url'),
                    'caseName': result.get('caseName'),
                    'court': result.get('court'),
                    'dateFiled': result.get('dateFiled'),
                    'judge': judge_name.replace('Judge', '').strip() if judge_name else None,
                    'syllabus': result.get('syllabus'),
                }
                if case_data['judge'] and case_data['syllabus']:
                    extracted_data.append(case_data)

            next_page_url = data.get('next')

        return extracted_data

    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e.response.status_code} - {e.response.reason}")
        print("Response text:", e.response.text[:500])
        return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None


if __name__ == "__main__":
    # --- Configuration ---
    PAGE_LIMIT = 20
    OUTPUT_FILENAME = "Disorderly_conduct_cases.json"
    # -------------------

    cases_to_save = query_courtlistener_api(api_token=MY_TOKEN, max_pages=PAGE_LIMIT)

    if cases_to_save:
        print("\n--- Finished Fetching Pages ---")
        print(f"Found {len(cases_to_save)} cases to save after filtering.")

        # ## Save the entire list of cases to a single JSON file ##
        with open(OUTPUT_FILENAME, 'w', encoding='utf-8') as f:
            json.dump(cases_to_save, f, indent=4, ensure_ascii=False)

        print(f"\nSuccessfully saved all cases to '{OUTPUT_FILENAME}'.")
    elif cases_to_save is not None:
        print("\nNo cases matching the criteria were found.")