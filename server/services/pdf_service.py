from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib import colors
from io import BytesIO
from datetime import datetime
from typing import Dict, Any

class QuizPDFGenerator:
    def __init__(self):
        self.width, self.height = letter
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Define custom paragraph styles for quiz."""
        self.styles.add(ParagraphStyle(
            name="QuizTitle",
            parent=self.styles["Heading1"],
            fontSize=18,
            textColor=colors.HexColor("#1E3A5F"),
            spaceAfter=12,
            alignment=1  # Center
        ))

        self.styles.add(ParagraphStyle(
            name="QuestionText",
            parent=self.styles["Normal"],
            fontSize=11,
            spaceAfter=10,
            textColor=colors.black
        ))

    def generate_pdf(self, quiz_data: Dict[str, Any]) -> bytes:
        """
        Generate PDF from quiz JSON data.
        Returns PDF as bytes.
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch)

        story = []

        # Header
        story.append(Paragraph(quiz_data["quiz_title"], self.styles["QuizTitle"]))
        story.append(Paragraph(f"Grade: {quiz_data.get('grade', 'N/A')} | Subject: {quiz_data.get('subject', 'N/A')}", self.styles["Normal"]))
        story.append(Spacer(1, 0.2*inch))

        # Instructions
        story.append(Paragraph("<b>Instructions:</b>", self.styles["Heading3"]))
        story.append(Paragraph(quiz_data["instructions"], self.styles["Normal"]))
        story.append(Spacer(1, 0.3*inch))

        # Questions
        for idx, q in enumerate(quiz_data["questions"], 1):
            story.append(self._render_question(q, idx))
            story.append(Spacer(1, 0.15*inch))

        # Page break before answer key
        story.append(PageBreak())

        # Answer Key
        story.append(Paragraph("ANSWER KEY", self.styles["Heading2"]))
        story.append(Spacer(1, 0.2*inch))

        answer_table_data = [["Question", "Answer", "Explanation"]]
        for q in quiz_data["questions"]:
            answer_table_data.append([
                f"Q{q['id']}",
                q.get("correct_answer", q.get("answer", "N/A")),
                q.get("explanation", "")[:100] + "..." if q.get("explanation") else ""
            ])

        answer_table = Table(answer_table_data, colWidths=[1*inch, 1*inch, 3.5*inch])
        answer_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A5F")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
            ("GRID", (0, 0), (-1, -1), 1, colors.grey),
        ]))
        story.append(answer_table)

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    def _render_question(self, question: Dict[str, Any], q_number: int) -> Paragraph:
        """Render a single question with its options."""

        q_type = question.get("question_type", "mcq")

        # Question stem
        html = f"""
        <b>Q{q_number}. {question['question_text']}</b><br/>
        """

        if q_type == "mcq":
            # MCQ options
            for opt in question.get("options", []):
                html += f"&nbsp;&nbsp;&nbsp;&nbsp;{opt['label']}) {opt['text']}<br/>"

        elif q_type == "short_answer":
            html += "<i>[Answer space for student response]</i><br/>"

        elif q_type == "true_false":
            html += "&nbsp;&nbsp;&nbsp;&nbsp;A) True&nbsp;&nbsp;&nbsp;&nbsp;B) False<br/>"

        elif q_type == "fill_blank":
            # For fill in the blank, the question text should contain underscores or similar
            html += "<i>[Fill in the blank]</i><br/>"

        elif q_type == "essay":
            html += "<i>[Essay response space - write your answer below]</i><br/>"
            # Add some space for essay answers
            html += "<br/><br/><br/>"

        html += "<br/>"
        return Paragraph(html, self.styles["QuestionText"])