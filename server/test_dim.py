import os
import requests
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def test_dimensions():
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
    
    print("Testing text-embedding-004 with output_dimensionality=1024...")
    payload = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{"text": "test"}]
        },
        "output_dimensionality": 1024
    }
    
    try:
        resp = requests.post(url, json=payload)
        if resp.status_code == 200:
            emb = resp.json()["embedding"]["values"]
            print(f"Success! Dimension: {len(emb)}")
        else:
            print(f"Failed: {resp.status_code} - {resp.text}")
            
    except Exception as e:
        print(f"Error: {str(e)}")

    print("\nTesting text-embedding-004 with default...")
    payload_default = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{"text": "test"}]
        }
    }
    try:
        resp = requests.post(url, json=payload_default)
        if resp.status_code == 200:
            emb = resp.json()["embedding"]["values"]
            print(f"Success! Default Dimension: {len(emb)}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_dimensions()
