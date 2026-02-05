import json
import re
import requests
from typing import Dict, Any, List
import os
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

    # Fix unescaped backslashes (common in LaTeX)
    # This regex finds a backslash not followed by a valid JSON escape character
    # Valid escapes: " \ / b f n r t u
    text = re.sub(r'\\(?![\\"/bfnrtu])', r'\\\\', text)

    return text

def repair_truncated_json(text: str) -> str:
    """
    Attempt to repair truncated JSON by appending missing closing braces and brackets.
    """
    text = text.strip()
    if not text:
        return text
        
    brace_count = 0
    bracket_count = 0
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
                brace_count += 1
            elif char == '}':
                brace_count -= 1
            elif char == '[':
                bracket_count += 1
            elif char == ']':
                bracket_count -= 1
                
    # If counts are already zero, no repair needed or repair impossible
    if brace_count <= 0 and bracket_count <= 0:
        return text
        
    # Attempt to close open structures
    repaired_text = text
    
    # If we are inside a string, close the quote
    if in_string:
        repaired_text += '"'
        
    # Heuristic closing
    repaired_text += ']' * max(0, bracket_count)
    repaired_text += '}' * max(0, brace_count)
    
    return repaired_text

def parse_ai_json(generated_text: str) -> Dict[str, Any]:
    """
    Parse JSON from AI response using multiple fallback strategies and logging.
    """
    try:
        # 1. Extreme Cleaning: Remove control characters except tab/newline
        cleaned_text = "".join(ch for ch in generated_text if ord(ch) >= 32 or ch in "\n\r\t")
        cleaned_text = cleaned_text.strip()
        
        # 2. Markdown Block Removal
        if "```" in cleaned_text:
            cleaned_text = re.sub(r'```(?:json)?\s*', '', cleaned_text)
            cleaned_text = re.sub(r'\s*```', '', cleaned_text)
        cleaned_text = cleaned_text.strip()

        # 3. Apply Common Fixes (trailing commas, LaTeX backslashes)
        cleaned_text = fix_common_json_issues(cleaned_text)

        # Strategy 1: Direct Parse
        try:
            return json.loads(cleaned_text)
        except json.JSONDecodeError:
            pass

        # Strategy 2: Balanced Braces
        json_str = extract_complete_json(cleaned_text)
        if json_str:
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                pass

        # Strategy 3: Regex Extraction
        json_match = re.search(r'(\{.*\}|\[.*\])', cleaned_text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Strategy 4: Truncation Repair
        repaired_text = repair_truncated_json(cleaned_text)
        if repaired_text != cleaned_text:
            try:
                # Re-apply fixes on repaired text if needed
                repair_fixed = fix_common_json_issues(repaired_text)
                return json.loads(repair_fixed)
            except json.JSONDecodeError:
                pass

        # ALL STRATEGIES FAILED
        debug_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "failed_response.txt"))
        with open(debug_path, "w", encoding="utf-8") as f:
            f.write(generated_text)
        
        print(f"ERROR: All parsing strategies failed. Text saved to {debug_path}")
        raise ValueError("Unable to parse JSON from AI response after trying all strategies")

    except Exception as e:
        if isinstance(e, ValueError): raise e
        print(f"Unexpected error parsing response: {str(e)}")
        raise ValueError(f"Failed to process AI response: {str(e)}")

    except Exception as e:
        if isinstance(e, ValueError): raise e
        print(f"Unexpected error parsing response: {str(e)}")
        raise ValueError(f"Failed to process AI response: {str(e)}")

def summarize_text(text: str, max_length: int = 8000) -> str:
    """
    Summarize long text to fit within API limits.
    """
    if len(text) <= max_length:
        return text

    # Simple summarization: take first part, middle sections, and end
    chunks = text.split('\n\n')
    if len(chunks) <= 3:
        return text[:max_length] + "..."

    # Take beginning, middle, and end sections
    summary_parts = []
    summary_parts.append(chunks[0])  # First section
    summary_parts.append("...[content summarized]...")
    summary_parts.append(chunks[-1])  # Last section

    summary = '\n\n'.join(summary_parts)
    return summary[:max_length] + "..." if len(summary) > max_length else summary

def generate_lesson_plan(text: str, grade: int, subject: str, class_duration_mins: int, refinement_prompt: str = None, context: str = None) -> Dict[str, Any]:
    """
    Generate or refine a lesson plan using Google's Gemini API.

    Args:
        text: Source text or existing lesson plan JSON (can be skeletal if context provided)
        grade: Grade level
        subject: Subject matter
        class_duration_mins: Duration of a single class session in minutes
        refinement_prompt: Optional instructions to tweak an existing plan
        context: Optional retrieved context from vector DB

    Returns:
        Dict containing lesson plan JSON
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")

    # System prompt
    system_prompt = "You are an expert lesson-planning assistant who creates engaging, interactive lesson plans that captivate students. Focus on making lessons dynamic with real-life examples, hands-on activities, and student participation. Avoid dry, theoretical lectures - create exciting learning experiences that students will remember. Return ONLY valid JSON without any markdown formatting or additional text."

    # User message template
    if refinement_prompt:
        context_section = f"\nRELEVANT CONTEXT FROM EXISTING PLAN:\n{context}\n" if context else f"\nEXISTING LESSON PLAN (JSON):\n{text}\n"
        
        user_message = f"""
{context_section}

TEACHER'S REFINEMENT REQUEST:
"{refinement_prompt}"

METADATA:
- Grade: {grade}
- Subject: {subject}
- Class Session Duration: {class_duration_mins} minutes

YOUR TASK:
Modify the Lesson Plan according to the TEACHER'S REFINEMENT REQUEST. 
Maintain the same JSON structure. Improve the content while keeping the teacher's desired changes in mind.
Ensure the total time and session structure still follow the Class Session Duration ({class_duration_mins} mins).
"""
    else:
        # Summarize long text to prevent API limits - leave more room for response
        original_length = len(text)
        text = summarize_text(text, max_length=4000)
        
        user_message = f"""
SOURCE TEXT:
{text}

METADATA:
- Grade: {grade}
- Subject: {subject}
- Class Session Duration: {class_duration_mins} minutes

Create an ENGAGING, INTERACTIVE full lesson plan that will captivate grade {grade} students.

IMPORTANT GUIDELINES:
1. ESTIMATE TOTAL TIME: Estimate how many total minutes are reasonably required to teach this topic effectively based on its complexity.
2. SESSIONS / ALL DAYS: You MUST provide the full plan for ALL days required to cover the topic. 
   - Example: If you estimate 120 minutes and the class duration is 40 minutes, you MUST generate THREE sessions (Day 1, Day 2, and Day 3).
   - DO NOT stop after Day 1. You must provide the complete curriculum for all estimated minutes.
3. SESSION LIMIT: Each session's timeline must not exceed the Class Session Duration ({class_duration_mins} mins).
4. PROPORTIONAL TIMING: Within each session, divide the time proportionally based on the importance and difficulty of sub-topics.
5. SERIAL NUMBERS: Each activity in the timeline MUST have a sequential `itemNumber` starting from 1 for each session.
6. ENGAGEMENT: Use REAL-LIFE examples, HANDS-ON activities, and student participation. Make the teacher script CONVERSATIONAL and ENTHUSIASTIC.

REQUIRED JSON FORMAT:
{{
  "title": "string",
  "estimatedTotalMins": number,
  "learningObjectives": ["string"],
  "sessions": [
    {{
      "sessionNumber": number,
      "topic": "string",
      "timeline": [
        {{
          "itemNumber": number,
          "minute": number, 
          "duration": number,
          "activity": "string", 
          "teacherScript": "string"
        }}
      ],
      "homework": {{
        "instructions": "string", 
        "questions": ["string"], 
        "rubric": ["string"]
      }}
    }}
  ],
  "discussionQuestions": [{{
    "q": "string", 
    "expectedPoints": ["string"]
  }}]
}}
"""

    # Gemini API endpoint - using user's specified model
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"

    # Request payload
    payload = {
        "contents": [{
            "parts": [{
                "text": f"{system_prompt}\n\n{user_message}"
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 8192,
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
            finish_reason = candidate.get("finishReason")
            print(f"DEBUG: Gemini Finish Reason: {finish_reason}")
            
            if finish_reason == "SAFETY":
                raise ValueError("Lesson plan could not be generated due to safety filters. Please try a different topic.")

            if "content" in candidate and "parts" in candidate["content"]:
                generated_text = candidate["content"]["parts"][0]["text"]

                # Use new shared parsing utility
                return parse_ai_json(generated_text)
            else:
                raise ValueError("No content in API response")
        else:
            raise ValueError("No candidates in API response")

    except requests.exceptions.RequestException as e:
        raise ValueError(f"Gemini API request failed: {str(e)}")
    except KeyError as e:
        raise ValueError(f"Unexpected API response structure: {str(e)}")

def generate_lesson_plan_patch(matches: List[Dict[str, Any]], refinement_prompt: str, grade: int, subject: str, class_duration_mins: int) -> Dict[str, Any]:
    """
    Generate targeted updates (patches) for specific sections of a lesson plan.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")

    system_prompt = "You are an expert lesson-planning assistant. Your task is to refine SPECIFIC SECTIONS of a lesson plan based on a teacher's request. Return ONLY valid JSON in the requested format."

    context_str = ""
    valid_matches = [m for m in matches if m.get('path')]
    
    if not valid_matches:
        # If no valid paths found, we can't do atomic refinement
        raise ValueError("No valid sections found for atomic refinement. Please generate a new plan first.")

    for i, match in enumerate(valid_matches):
        context_str += f"SECTION {i+1} (JSON Path: {match['path']}):\n{match['text']}\n\n"

    user_message = f"""
I have a lesson plan that needs refinement. Here are the most relevant sections:

{context_str}

TEACHER'S REFINEMENT REQUEST:
"{refinement_prompt}"

METADATA:
- Grade: {grade}
- Subject: {subject}
- Class Session Duration: {class_duration_mins} minutes

YOUR TASK:
Refine ONLY the sections provided above to satisfy the teacher's request. 
CRITICAL: The changes must be NOTYCEABLE and EFFECTIVE. Do not just return the same text. 
If the teacher asks to "make it more hands-on", rewrite the activity and script to be significantly more interactive.
IMPORTANT: You MUST return the FULL JSON OBJECT for each section being modified. 
Do not omit any fields like 'itemNumber', 'activity', or 'duration'. 
Maintain the same internal structure for each section.
Return a JSON object with a list of patches. 
DO NOT include any introductory text, markdown code blocks, or explanations. 

REQUIRED OUTPUT FORMAT:
{{
  "patches": [
    {{
      "path": "string (the exact JSON Path provided above)",
      "content": {{ ... updated JSON object for this section ... }}
    }}
  ]
}}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_message}"}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 4096}
    }

    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
    response.raise_for_status()
    result = response.json()
    
    if "candidates" in result and len(result["candidates"]) > 0:
        candidate = result["candidates"][0]
        finish_reason = candidate.get("finishReason")
        print(f"DEBUG: Patch finishReason: {finish_reason}")
        
        generated_text = candidate["content"]["parts"][0]["text"]
        print(f"DEBUG: Patch generation raw response: {generated_text[:200]}...")
        # Use new shared parsing utility
        return parse_ai_json(generated_text)
    else:
        raise ValueError("No content in API response")

def apply_patches(original_plan: Dict[str, Any], patches_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Apply a list of patches to a lesson plan JSON.
    """
    import re
    # Deep copy
    new_plan = json.loads(json.dumps(original_plan))
    
    def merge_content(target, source, path=""):
        """Helper to merge dicts or replace other types. Returns (merged, changed)"""
        changed = False
        if isinstance(target, dict) and isinstance(source, dict):
            merged = target.copy()
            for k, v in source.items():
                if k == "isUpdated": continue
                if k in target and target[k] != v:
                    print(f"DEBUG: Field '{k}' changed at {path}")
                    changed = True
                elif k not in target:
                    print(f"DEBUG: New field '{k}' added at {path}")
                    changed = True
                merged[k] = v
            return merged, changed
        
        # For non-dicts, check for change
        changed = (target != source)
        return source, changed

    patches = patches_data.get("patches", [])
    print(f"DEBUG: Found {len(patches)} patches to apply.")
    for patch in patches:
        path = patch.get("path")
        content = patch.get("content")
        print(f"DEBUG: Applying patch to path: {path}")
        
        if not path or content is None:
            continue
            
        try:
            if path == "header":
                if isinstance(content, dict):
                    if "title" in content and content["title"] != new_plan.get("title"):
                        new_plan["title"] = content["title"]
                        # Header doesn't currently support isUpdated in UI but good for consistency
                    if "learningObjectives" in content and content["learningObjectives"] != new_plan.get("learningObjectives"):
                        new_plan["learningObjectives"] = content["learningObjectives"]
                continue
                
            # Parse sessions[i]...
            session_match = re.match(r"sessions\[(\d+)\]", path)
            if session_match:
                s_idx = int(session_match.group(1))
                if s_idx >= len(new_plan.get("sessions", [])): continue
                
                remaining = path[len(session_match.group(0)):].strip(".")
                
                if not remaining:
                    merged, changed = merge_content(new_plan["sessions"][s_idx], content, path)
                    if changed: merged["isUpdated"] = True
                    new_plan["sessions"][s_idx] = merged
                elif remaining.startswith("timeline"):
                    timeline_match = re.match(r"timeline\[(\d+)\]", remaining)
                    if timeline_match:
                        t_idx = int(timeline_match.group(1))
                        if t_idx < len(new_plan["sessions"][s_idx].get("timeline", [])):
                            merged, changed = merge_content(new_plan["sessions"][s_idx]["timeline"][t_idx], content, path)
                            if changed: merged["isUpdated"] = True
                            new_plan["sessions"][s_idx]["timeline"][t_idx] = merged
                elif remaining == "homework":
                    merged, changed = merge_content(new_plan["sessions"][s_idx]["homework"], content, path)
                    if changed: merged["isUpdated"] = True
                    new_plan["sessions"][s_idx]["homework"] = merged
                    
            elif path.startswith("discussionQuestions"):
                dq_match = re.match(r"discussionQuestions\[(\d+)\]", path)
                if dq_match:
                    q_idx = int(dq_match.group(1))
                    if q_idx < len(new_plan.get("discussionQuestions", [])):
                        merged, changed = merge_content(new_plan["discussionQuestions"][q_idx], content, path)
                        if changed: merged["isUpdated"] = True
                        new_plan["discussionQuestions"][q_idx] = merged
        except Exception as e:
            print(f"Error applying patch to {path}: {str(e)}")
            
    return new_plan

def generate_chapter_index(subject: str, grade: int, board: str) -> Dict[str, Any]:
    """
    Generate a comprehensive chapter index for a subject/grade/board combination.
    
    Args:
        subject: Subject name (e.g., "Mathematics", "Science")
        grade: Grade level (1-12)
        board: Education board (e.g., "CBSE", "ICSE", "State Board")
    
    Returns:
        Dict containing:
        {
            "chapters": [
                {
                    "chapterNumber": 1,
                    "chapterName": "Introduction to Algebra",
                    "description": "Basic concepts of algebra",
                    "subtopics": [
                        {
                            "subtopicNumber": 1,
                            "subtopicName": "Variables and Constants",
                            "description": "Understanding variables"
                        }
                    ]
                }
            ]
        }
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not configured")
    
    system_prompt = "You are an expert curriculum designer. Generate a comprehensive chapter index for the given subject, grade, and education board. Return ONLY valid JSON without any markdown formatting or additional text."
    
    user_message = f"""
Generate a complete chapter index for the following curriculum:

SUBJECT: {subject}
GRADE: {grade}
EDUCATION BOARD: {board}

Create a comprehensive list of ALL chapters that should be covered in this subject for this grade level according to the {board} curriculum.

For each chapter, include:
1. Chapter number (sequential, starting from 1)
2. Chapter name (clear and descriptive)
3. Brief description of what the chapter covers
4. List of subtopics within the chapter (typically 3-8 subtopics per chapter)

For each subtopic, include:
1. Subtopic number (sequential within the chapter, starting from 1)
2. Subtopic name (specific and clear)
3. Brief description of what the subtopic covers

IMPORTANT GUIDELINES:
- Be comprehensive - include ALL chapters typically taught in this subject/grade/board
- Subtopics should be granular enough that a teacher can select specific ones to teach
- Follow the official {board} curriculum structure
- Use proper terminology and naming conventions for {board}

REQUIRED JSON FORMAT:
{{
  "chapters": [
    {{
      "chapterNumber": 1,
      "chapterName": "string",
      "description": "string",
      "subtopics": [
        {{
          "subtopicNumber": 1,
          "subtopicName": "string",
          "description": "string"
        }}
      ]
    }}
  ]
}}
"""
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [{
                "text": f"{system_prompt}\n\n{user_message}"
            }]
        }],
        "generationConfig": {
            "temperature": 0.3,  # Lower temperature for more consistent curriculum
            "topK": 40,
            "topP": 0.95,
            "maxOutputTokens": 8192,
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        
        result = response.json()
        
        if "candidates" in result and len(result["candidates"]) > 0:
            candidate = result["candidates"][0]
            finish_reason = candidate.get("finishReason")
            print(f"DEBUG: Chapter Index Generation - Finish Reason: {finish_reason}")
            
            if finish_reason == "SAFETY":
                raise ValueError("Chapter index could not be generated due to safety filters.")
            
            if "content" in candidate and "parts" in candidate["content"]:
                generated_text = candidate["content"]["parts"][0]["text"]
                
                # Use shared parsing utility
                return parse_ai_json(generated_text)
            else:
                raise ValueError("No content in API response")
        else:
            raise ValueError("No candidates in API response")
    
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Gemini API request failed: {str(e)}")
    except KeyError as e:
        raise ValueError(f"Unexpected API response structure: {str(e)}")
