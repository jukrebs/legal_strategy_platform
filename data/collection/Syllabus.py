import json


def create_syllabi_list_from_file(file_path):
    """
    Reads a JSON file containing judge and docket information and creates a
    dictionary mapping each judge to a list of their case syllabi.

    Args:
    file_path (str): The path to the input JSON file.

    Returns:
    dict: A dictionary where keys are judge names and values are lists
    of syllabi strings.
    """
    syllabi_by_judge = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for judge_record in data:
            judge_name = judge_record.get("judge_name")
            dockets = judge_record.get("dockets", [])

            if not judge_name or not dockets:
                continue

            # Using a list comprehension for a compact way to gather syllabi
            syllabi_list = [
                docket.get("syllabus")
                for docket in dockets
                if docket.get("syllabus")
            ]

            if syllabi_list:
                syllabi_by_judge[judge_name] = syllabi_list

    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
        return None
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from the file '{file_path}'.")
        return None

    return syllabi_by_judge


# --- Example Usage ---
if __name__ == '__main__':
    # Define the input file path
    input_file = 'judges_with_dockets_and_syllabus.json'

    # Generate the dictionary
    judge_syllabi_data = create_syllabi_list_from_file(input_file)

    # If data was processed successfully, write it to an output file
    if judge_syllabi_data:
        # Define the path for the output file
        output_file = 'syllabi_by_judge.json'

        try:
            # Open the output file in write mode
            with open(output_file, 'w', encoding='utf-8') as f:
                # Use json.dump() to write the dictionary to the file
                json.dump(judge_syllabi_data, f, indent=4)

            # Print a success message to the console
            print(f"Successfully wrote the output to '{output_file}'")

        except IOError as e:
            print(f"Error writing to file '{output_file}': {e}")