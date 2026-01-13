import os
from pinecone import Pinecone
from dotenv import load_dotenv
import requests

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def diagnose():
    print(f"--- Diagnosing Pinecone Configuration ---")
    print(f"Index Name: {PINECONE_INDEX_NAME}")
    print(f"API Key (start): {PINECONE_API_KEY[:10]}...")
    
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(PINECONE_INDEX_NAME)
        
        # Check index description
        desc = pc.describe_index(PINECONE_INDEX_NAME)
        print(f"Index Cloud: {desc.cloud}")
        print(f"Index Region: {desc.region}")
        print(f"Index Dimension: {desc.dimension}")
        print(f"Index Metric: {desc.metric}")
        
        # Check Gemini Embedding Dimension
        print(f"\n--- Checking Gemini Embeddings ---")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
        payload = {"model": "models/text-embedding-004", "content": {"parts": [{"text": "test"}]}}
        resp = requests.post(url, json=payload)
        resp.raise_for_status()
        emb = resp.json()["embedding"]["values"]
        print(f"Gemini Embedding Dimension: {len(emb)}")
        
        if len(emb) != desc.dimension:
            print(f"\n[CRITICAL ERROR] Dimension mismatch! Gemini: {len(emb)}, Pinecone: {desc.dimension}")
        else:
            print("\n[SUCCESS] Dimensions match.")
            
        print("\n--- Testing Simple Upsert ---")
        test_id = "test_diag_id"
        index.upsert(vectors=[{"id": test_id, "values": emb, "metadata": {"test": True}}])
        print(f"[SUCCESS] Upserted test vector.")
        
        # Clean up
        index.delete(ids=[test_id])
        print(f"[SUCCESS] Deleted test vector.")

    except Exception as e:
        print(f"\n[ERROR] Diagnosis failed: {str(e)}")

if __name__ == "__main__":
    diagnose()
