import requests
import json

url = "https://juliuspor.app.n8n.cloud/webhook/bfda8a16-0260-4297-ab36-a707e54323c2"
payload = {
    "lawyer_prompt": """
    You are a lawyer representing the opposing party in a lawsuit. You need to argue your case and provide a legal defense.
    Your defendant has thrown a glass bottle at the plaintiff, the plaintiff is suing for $1000000.
   """,
   
    "judge_prompt": """
     Call the lawyers and get their input, then make a verdict.
    The defendant has thrown a glass bottle at the plaintiff, the plaintiff is suing for $1000000.
    """,
   
    "opponent_prompt": """
    You are the state attorney representing the plaintiff in a lawsuit. You need to argue your case and provide a legal offensive.
    The defendant has thrown a glass bottle at the plaintiff, the plaintiff is suing for $1000000.
    """,
   
    "session_id": "123",
}

# Capture the response
response = requests.post(url, json=payload)

# Print the response details
print("Status Code:", response.status_code)
print("Response JSON (Pretty):")
print(json.dumps(response.json(), indent=2))
