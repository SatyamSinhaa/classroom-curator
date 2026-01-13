import React from 'react';

export default function QuizPreview({ quiz }) {
  return (
    <div className="quiz-preview">
      <h2>{quiz.quiz_title}</h2>
      <p>{quiz.instructions}</p>

      <div className="questions">
        {quiz.questions_data.questions.map((q, idx) => (
          <div key={idx} className="question-card">
            <p className="question-text">
              <strong>Q{q.id}. {q.question_text}</strong>
            </p>

            {q.question_type === 'mcq' && (
              <div className="options">
                {q.options.map((opt, i) => (
                  <p key={i} className="option">
                    {opt.label}) {opt.text}
                  </p>
                ))}
              </div>
            )}

            {q.question_type === 'short_answer' && (
              <p className="answer-lines">[Student answer space]</p>
            )}

            <p className="explanation"><em>✓ {q.explanation}</em></p>
          </div>
        ))}
      </div>
    </div>
  );
}