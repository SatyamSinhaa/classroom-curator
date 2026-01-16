import React from 'react';

export default function QuizPreview({ quiz }) {
  return (
    <div className="quiz-preview">
      <h2>{quiz.questions_data.quiz_title || "Generated Quiz"}</h2>
      <p>{quiz.questions_data.instructions}</p>

      <div className="questions">
        {quiz.questions_data.questions.map((q, idx) => (
          <div key={idx} className="question-card">
            <p className="question-text">
              <strong>Q{q.id}. {q.question_text}</strong>
            </p>

            {q.question_type === 'mcq' && q.options && (
              <div className="options">
                {q.options.map((opt, i) => (
                  <p key={i} className="option">
                    {opt.label}) {opt.text}
                  </p>
                ))}
              </div>
            )}

            {q.question_type === 'true_false' && (
              <div className="options">
                <p className="option">True</p>
                <p className="option">False</p>
              </div>
            )}

            {['short_answer', 'fill_blank', 'essay'].includes(q.question_type) && (
              <p className="answer-lines" style={{ borderBottom: '1px dashed #ccc', marginTop: '20px', color: '#999' }}>[Student Answer Space]</p>
            )}

            <p className="explanation"><em>✓ {q.explanation}</em></p>
          </div>
        ))}
      </div>
    </div>
  );
}