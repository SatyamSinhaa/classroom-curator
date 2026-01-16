import requests

# Test the topics endpoint
url = "http://localhost:8000/lesson-plans/topics"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nTopics found: {len(data.get('topics', []))}")
        print(f"Topics: {data.get('topics', [])}")
    else:
        print(f"\nError: {response.status_code}")
        
except Exception as e:
    print(f"Error: {str(e)}")
