#!/usr/bin/env python3

"""
Diagnose YouTube Transcript API issues
"""

import youtube_transcript_api
from youtube_transcript_api import YouTubeTranscriptApi

print(f"Library Location: {youtube_transcript_api.__file__}")
print(f"Available Attributes: {dir(YouTubeTranscriptApi)}")

# Try different method calls to see what works
print("\nTesting method calls:")

try:
    # Test static method
    result = hasattr(YouTubeTranscriptApi, 'get_transcript')
    print(f"get_transcript method exists: {result}")
except Exception as e:
    print(f"Error checking get_transcript: {e}")

try:
    # Test list_transcripts
    result = hasattr(YouTubeTranscriptApi, 'list_transcripts')
    print(f"list_transcripts method exists: {result}")
except Exception as e:
    print(f"Error checking list_transcripts: {e}")

try:
    # Test instantiation
    yt = YouTubeTranscriptApi()
    print(f"Instantiation works: {type(yt)}")
    print(f"Instance methods: {[m for m in dir(yt) if not m.startswith('_')]}")
except Exception as e:
    print(f"Error instantiating: {e}")

# Check version
try:
    import pkg_resources
    version = pkg_resources.get_distribution('youtube-transcript-api').version
    print(f"\nLibrary version: {version}")
except Exception as e:
    print(f"Could not get version: {e}")

print("\nDiagnosis complete.")