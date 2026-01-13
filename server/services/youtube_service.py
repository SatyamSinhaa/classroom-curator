import re
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable

def extract_video_id(url: str) -> str:
    """
    Extract video ID from YouTube URL.

    Args:
        url: YouTube URL

    Returns:
        str: Video ID

    Raises:
        ValueError: If URL is invalid or video ID cannot be extracted
    """
    # Regex patterns for YouTube URLs
    patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?youtu\.be/([a-zA-Z0-9_-]{11})'
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    raise ValueError("Invalid YouTube URL format")

def get_transcript(youtube_url: str) -> str:
    """
    Get transcript from YouTube video.

    Args:
        youtube_url: YouTube video URL

    Returns:
        str: Concatenated transcript text without timestamps

    Raises:
        ValueError: If transcript is unavailable or video is invalid
    """
    try:
        # Extract video ID
        video_id = extract_video_id(youtube_url)

        # Get transcript using the correct API methods
        yt_api = YouTubeTranscriptApi()
        transcript_list = yt_api.list(video_id)

        # Try to get manually created transcript first (better quality)
        try:
            # TranscriptList is iterable but doesn't support len()
            transcript_items = list(transcript_list)  # Convert to list
            print(f"Available transcripts: {len(transcript_items)}")
            for t in transcript_items:
                print(f"  - Language: {t.language_code}, Generated: {t.is_generated}")

            transcript_info = None

            # First priority: Manual English transcript
            for t in transcript_items:
                if t.language_code == 'en' and not t.is_generated:
                    transcript_info = t
                    print(f"Found manual English transcript: {t}")
                    break

            # Second priority: Auto-generated English transcript
            if not transcript_info:
                for t in transcript_items:
                    if t.language_code == 'en' and t.is_generated:
                        transcript_info = t
                        print(f"Found auto-generated English transcript: {t}")
                        break

            # Third priority: Any English transcript (regardless of generation type)
            if not transcript_info:
                for t in transcript_items:
                    if t.language_code == 'en':
                        transcript_info = t
                        print(f"Found English transcript (any type): {t}")
                        break

            # Fourth priority: Any available transcript (if no English at all)
            if not transcript_info and transcript_items:
                transcript_info = transcript_items[0]  # Take first available
                print(f"No English transcript found, using {transcript_info.language_code} transcript: {transcript_info}")

            if transcript_info:
                if transcript_info.language_code != 'en':
                    print(f"⚠️  WARNING: Using non-English transcript ({transcript_info.language_code}). Translation may be needed for best results.")

                print(f"Fetching transcript content from: {transcript_info}")
                # fetch() returns a list of transcript entries
                transcript_entries = transcript_info.fetch()
                print(f"Successfully fetched {len(transcript_entries)} transcript entries")
            else:
                print("No transcripts found at all")
                raise ValueError("No transcripts available for this video")

        except Exception as e:
            print(f"Transcript fetching error: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            raise ValueError("Failed to fetch transcript")

        # Use TextFormatter to properly extract text from transcript entries
        formatter = TextFormatter()
        full_transcript = formatter.format_transcript(transcript_entries).strip()

        print(f"Extracted transcript text (first 200 chars): {full_transcript[:200]}...")

        if not full_transcript:
            raise ValueError("Transcript is empty")

        return full_transcript

    except TranscriptsDisabled:
        raise ValueError("Transcript not available for this video. Try 'Topic' mode or upload a PDF.")
    except NoTranscriptFound:
        raise ValueError("No transcript found for this video. Try 'Topic' mode or upload a PDF.")
    except VideoUnavailable:
        raise ValueError("Video is unavailable or private.")
    except Exception as e:
        if "Invalid YouTube URL" in str(e):
            raise e
        else:
            raise ValueError(f"Failed to retrieve transcript: {str(e)}")
