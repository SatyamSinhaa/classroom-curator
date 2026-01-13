import os
import json
import requests
from typing import List, Dict, Any, Optional
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY not set in .env")

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

def get_embeddings(text: str) -> List[float]:
    """
    Get embeddings for the given text using Gemini API.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={GEMINI_API_KEY}"
    
    payload = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{"text": text}]
        }
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    result = response.json()
    embedding = result["embedding"]["values"]
    
    # Pad to 1024 dimensions if necessary (Gemini returns 768 by default)
    # Adding zeros to the end preserves cosine similarity and dot product
    if len(embedding) == 768:
        # Pad with 256 zeros
        embedding.extend([0.0] * 256)
    
    return embedding

def chunk_lesson_plan(lesson_plan_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Break down a lesson plan into meaningful chunks for vector storage.
    """
    chunks = []
    
    # 1. Title and Objectives
    header_text = f"Title: {lesson_plan_data.get('title', '')}\n"
    header_text += "Learning Objectives:\n" + "\n".join(lesson_plan_data.get("learningObjectives", []))
    chunks.append({
        "id": "header",
        "text": header_text,
        "metadata": {"type": "header", "path": "header"}
    })
    
    # 2. Sessions
    for s_idx, session in enumerate(lesson_plan_data.get("sessions", [])):
        session_num = session.get("sessionNumber")
        session_topic = session.get("topic")
        
        # Timeline items
        for i, item in enumerate(session.get("timeline", [])):
            item_num = item.get('itemNumber', i + 1)
            item_text = f"Day {session_num}, Point {item_num}: {session_topic}\n"
            item_text += f"Activity: {item.get('activity')}\n"
            item_text += f"Duration: {item.get('duration')} mins\n"
            item_text += f"Teacher Script: {item.get('teacherScript')}"
            
            chunks.append({
                "id": f"session_{session_num}_item_{item_num}",
                "text": item_text,
                "metadata": {
                    "type": "timeline",
                    "sessionNumber": session_num,
                    "itemNumber": item_num,
                    "path": f"sessions[{s_idx}].timeline[{i}]"
                }
            })
            
        # Homework
        if session.get("homework"):
            hw = session.get("homework")
            hw_text = f"Session {session_num} Homework:\n"
            hw_text += f"Instructions: {hw.get('instructions')}\n"
            hw_text += "Questions:\n" + "\n".join(hw.get("questions", []))
            
            chunks.append({
                "id": f"session_{session_num}_homework",
                "text": hw_text,
                "metadata": {
                    "type": "homework", 
                    "sessionNumber": session_num,
                    "path": f"sessions[{s_idx}].homework"
                }
            })
            
    # 3. Discussion Questions
    for i, dq in enumerate(lesson_plan_data.get("discussionQuestions", [])):
        dq_text = f"Discussion Question: {dq.get('q')}\n"
        dq_text += "Expected Points:\n" + "\n".join(dq.get("expectedPoints", []))
        
        chunks.append({
            "id": f"discussion_question_{i}",
            "text": dq_text,
            "metadata": {
                "type": "discussion_question", 
                "index": i,
                "path": f"discussionQuestions[{i}]"
            }
        })
        
    return chunks

def upsert_lesson_plan(lesson_plan_id: int, lesson_plan_data: Dict[str, Any]):
    """
    Chunk and upsert lesson plan to Pinecone.
    """
    chunks = chunk_lesson_plan(lesson_plan_data)
    vectors = []
    
    for chunk in chunks:
        embedding = get_embeddings(chunk["text"])
        
        # Metadata must be simple key-value pairs
        metadata = chunk["metadata"]
        metadata["text"] = chunk["text"] # Store text for retrieval
        metadata["lesson_plan_id"] = lesson_plan_id
        
        vectors.append({
            "id": f"lp_{lesson_plan_id}_{chunk['id']}",
            "values": embedding,
            "metadata": metadata
        })
        
    # Upsert in batches of 100
    for i in range(0, len(vectors), 100):
        index.upsert(vectors=vectors[i:i+100])

def query_lesson_plan(lesson_plan_id: int, query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Query Pinecone for relevant context sections.
    """
    embedding = get_embeddings(query_text)
    
    query_response = index.query(
        vector=embedding,
        top_k=top_k,
        filter={"lesson_plan_id": {"$eq": lesson_plan_id}},
        include_metadata=True
    )
    
    matches = []
    for match in query_response["matches"]:
        if "text" in match["metadata"]:
            matches.append({
                "text": match["metadata"]["text"],
                "path": match["metadata"].get("path"),
                "type": match["metadata"].get("type"),
                "score": match["score"]
            })
            
    return matches
