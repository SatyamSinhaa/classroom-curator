import json
import re
import requests
from typing import List, Dict, Any
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def extract_complete_json(text: str) -> str:
    """
    Extract the first complete JSON object from text using balanced brace counting.
    """
    brace_count = 0
    start_idx = -1
    in_string = False
    escape_next = False

    for i, char in enumerate(text):
        if escape_next:
            escape_next = False
            continue

        if char == '\\' and in_string:
            escape_next = True
            continue

        if char == '"' and not escape_next:
            in_string = not in_string
            continue

        if not in_string:
            if char == '{':
                if brace_count == 0:
                    start_idx = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and start_idx != -1:
                    return text[start_idx:i+1]

    return None

def fix_common_json_issues(text: str) -> str:
    """
    Fix common JSON formatting issues.
    """
    # Remove trailing commas before closing braces/brackets
    text = re.sub(r',\s*}', '}', text)
    text = re.sub(r',\s*]', ']', text)
    return text

class QuizGenerator:
    def __init__(self):
        self.api_key = GEMINI_API_KEY

    def generate_quiz(
        self,
        topic: str,
        subject: str,
        grade: int,
        num_questions: int,  # Total count
        question_types: Dict[str, int],  # e.g., {"mcq": 5, "short_answer": 3}
        difficulty: str,
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Generate quiz questions using Google Gemini API.
        Returns JSON structured questions.
        """

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not configured")

        # Build the prompt
        prompt = self._build_prompt(
            topic, subject, grade, num_questions,
            question_types, difficulty, context
        )

        # Gemini API endpoint
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={self.api_key}"

        # Request payload
        payload = {
            "contents": [{
                "parts": [{
                    "text": prompt
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 8192, # Increased for larger quizzes
            }
        }

        try:
            # Make API request
            response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
            response.raise_for_status()

            # Parse response
            result = response.json()

            # Extract generated text
            if "candidates" in result and len(result["candidates"]) > 0:
                candidate = result["candidates"][0]
                if "content" in candidate and "parts" in candidate["content"]:
                    generated_text = candidate["content"]["parts"][0]["text"]

                    # Clean the response (remove markdown code blocks if present)
                    cleaned_text = generated_text.strip()
                    if cleaned_text.startswith("```json"):
                        cleaned_text = cleaned_text[7:]
                    if cleaned_text.endswith("```"):
                        cleaned_text = cleaned_text[:-3]
                    cleaned_text = cleaned_text.strip()

                    # Parse JSON response
                    try:
                        quiz_data = json.loads(cleaned_text)
                        return quiz_data
                    except json.JSONDecodeError:
                        # Try to extract JSON
                        json_str = extract_complete_json(cleaned_text)
                        if json_str:
                            try:
                                quiz_data = json.loads(json_str)
                                return quiz_data
                            except json.JSONDecodeError:
                                pass

                        # Try to fix issues
                        fixed_text = fix_common_json_issues(cleaned_text)
                        try:
                            quiz_data = json.loads(fixed_text)
                            return quiz_data
                        except json.JSONDecodeError:
                            raise ValueError("Unable to parse JSON from AI response after trying all strategies")

                else:
                    raise ValueError("No content in API response")
            else:
                raise ValueError("No candidates in API response")

        except requests.exceptions.RequestException as e:
            raise ValueError(f"Gemini API request failed: {str(e)}")

    def _build_prompt(self, topic, subject, grade, num_questions,
                      question_types: Dict[str, int], difficulty, context):
        """
        Build the LLM prompt for quiz generation.
        """

        type_desc = {
            "mcq": "Multiple Choice (A/B/C/D)",
            "short_answer": "Short Answer (1-3 sentences)",
            "true_false": "True/False",
            "fill_blank": "Fill in the Blank",
            "essay": "Short Essay"
        }

        # Build requirements string from dictionary
        types_req_str = ""
        for q_type, count in question_types.items():
            if count > 0:
                types_req_str += f"- {count} {type_desc.get(q_type, q_type)} questions\n"

        prompt = f"""
Generate a {difficulty.upper()} difficulty quiz for Grade {grade} {subject} students.

BASIC REQUIREMENTS:
- Topic: {topic}
- Total Questions: {num_questions}
- Difficulty: {difficulty.upper()}
- Grade Level: {grade}
{f'- Context: {context}' if context else ''}

QUESTION DISTRIBUTION:
{types_req_str}

RESPONSE FORMAT (STRICT JSON):
{{
  "quiz_title": "Topic Name Quiz",
  "instructions": "Clear instructions for students",
  "questions": [
    {{
      "id": 1,
      "question_text": "...",
      "question_type": "mcq | short_answer | true_false | etc",
      "difficulty": "{difficulty}",
      "options": [  // REQUIRED ONLY FOR MCQ
        {{"label": "A", "text": "..."}},
        {{"label": "B", "text": "..."}},
        ...
      ],
      "correct_answer": "A (for MCQ) or text answer",
      "explanation": "Why this answer is correct"
    }},
    ...
  ],
  "answer_key": [
    {{"question_id": 1, "answer": "A"}}
  ]
}}

CONSTRAINTS:
- For {grade} grade: Use age-appropriate vocabulary and concepts.
- For {difficulty} difficulty: Adjust complexity accordingly.
- Ensure answers are scientifically/educationally accurate.
- For Short Answer: Provide sample answer and key points.
- All JSON must be valid and parseable.

Return ONLY valid JSON without any markdown formatting or additional text.
"""
        return prompt