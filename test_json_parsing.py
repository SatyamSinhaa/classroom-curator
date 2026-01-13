
import sys
import os
import json

# Add server directory to path
sys.path.append(os.path.join(os.getcwd(), "server"))

from services import llm_service

def test_parse_ai_json():
    # Test cases that might fail with the current implementation
    test_cases = [
        {
            "name": "Markdown block with extra text",
            "text": "Certainly! Here is the response:\n```json\n{\"id\": 1, \"title\": \"Test\"}\n```\nHope this helps!",
            "expected_success": True
        },
        {
            "name": "Unescaped newline in string",
            "text": '{"title": "Test Plan", "teacherScript": "Hello class.\nToday we will learn about AI."}',
            "expected_success": False  # current json.loads fails on literal newlines
        },
        {
            "name": "Escaped quotes that are actually unescaped",
            "text": '{"title": "The "Best" Lesson", "content": "Something"}',
            "expected_success": False
        },
        {
            "name": "JSON starting with list (patches might use this)",
            "text": "Here are the patches:\n[{\"path\": \"header\", \"content\": {}}]",
            "expected_success": True 
        },
        {
            "name": "Nested JSON in conversational text",
            "text": "The AI response was: { \"outer\": { \"inner\": [1, 2, 3] } } and some more text.",
            "expected_success": True
        }
    ]

    for case in test_cases:
        print(f"\n--- Testing: {case['name']} ---")
        try:
            # First try standard parse
            result = llm_service.parse_ai_json(case['text'])
            print(f"✅ Standard Parse Success")
        except Exception as e:
            print(f"❌ Standard Parse Failed: {str(e)}")
            
        try:
            # Experiment with strict=False
            data = json.loads(case['text'], strict=False)
            print(f"✅ json.loads(strict=False) Success")
        except Exception as e:
            print(f"❌ json.loads(strict=False) Failed: {str(e)}")

if __name__ == "__main__":
    test_parse_ai_json()
