import os
from pinecone import Pinecone
from dotenv import load_dotenv
import requests

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def get_padded_embedding(text):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
    payload = {"model": "models/text-embedding-004", "content": {"parts": [{"text": text}]}}
    resp = requests.post(url, json=payload)
    resp.raise_for_status()
    emb = resp.json()["embedding"]["values"]
    if len(emb) == 768:
        emb.extend([0.0] * (1024 - 768))
    return emb

def diagnose():
    print(f"--- Diagnosing with Padding ---")
    print(f"Index: {PINECONE_INDEX_NAME}")
    
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(PINECONE_INDEX_NAME)
        
        emb = get_padded_embedding("test padding")
        print(f"Padded Dimension: {len(emb)}")
        
        print("\n--- Testing Upsert ---")
        test_id = "test_padded_id"
        index.upsert(vectors=[{"id": test_id, "values": emb, "metadata": {"test": True, "text": "test padding"}}])
        print(f"[SUCCESS] Upserted padded vector.")
        
        print("\n--- Testing Query ---")
        res = index.query(vector=emb, top_k=1, include_metadata=True)
        if len(res["matches"]) > 0:
            print(f"[SUCCESS] Found match: {res['matches'][0]['id']}")
        
        # Cleanup
        index.delete(ids=[test_id])
        print(f"[SUCCESS] Deleted test vector.")

    except Exception as e:
        print(f"\n[ERROR] {str(e)}")

if __name__ == "__main__":
    diagnose()
