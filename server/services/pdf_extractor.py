import io
from PyPDF2 import PdfReader

def extract_text(pdf_bytes: bytes) -> str:
    """
    Extract text from PDF bytes using PyPDF2.

    Args:
        pdf_bytes: Raw PDF file bytes

    Returns:
        str: Concatenated text from all pages

    Raises:
        ValueError: If PDF appears to be scanned (text length < 100 chars)
    """
    try:
        # Create PDF reader from bytes
        pdf_file = io.BytesIO(pdf_bytes)
        pdf_reader = PdfReader(pdf_file)

        # Extract text from all pages
        text_parts = []
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text.strip():  # Only add non-empty text
                text_parts.append(page_text)

        # Concatenate all text
        full_text = "\n".join(text_parts).strip()

        # Check if text is too short (likely scanned PDF)
        if len(full_text) < 100:
            raise ValueError("PDF may be scanned; OCR required")

        return full_text

    except Exception as e:
        if "PDF may be scanned" in str(e):
            raise ValueError("PDF appears to be scanned. OCR feature coming soon.")
        else:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")