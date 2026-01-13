import React, { useState } from 'react';

export default function QuizForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    topic: '',
    subject: 'Math',
    grade: 5,
    num_questions: 10,
    question_type: 'mcq',
    difficulty: 'medium',
    context: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'num_questions' || name === 'grade') {
      const parsed = parseInt(value);
      setForm(prev => ({ ...prev, [name]: isNaN(parsed) ? (name === 'num_questions' ? 10 : 5) : parsed }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="quiz-form">
      <div className="form-group">
        <label>Topic *</label>
        <input
          type="text"
          name="topic"
          placeholder="e.g., Gravity, Photosynthesis"
          value={form.topic}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Subject</label>
          <select name="subject" value={form.subject} onChange={handleChange}>
            <option>Math</option>
            <option>Science</option>
            <option>History</option>
            <option>English</option>
            <option>Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Grade Level</label>
          <input
            type="number"
            name="grade"
            value={form.grade}
            onChange={handleChange}
            min="1" max="12"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Number of Questions</label>
          <input
            type="number"
            name="num_questions"
            value={form.num_questions}
            onChange={handleChange}
            min="1" max="50"
          />
        </div>

        <div className="form-group">
          <label>Difficulty</label>
          <select name="difficulty" value={form.difficulty} onChange={handleChange}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Question Type</label>
        <div className="radio-group">
          {['mcq', 'short_answer', 'true_false', 'fill_blank', 'essay'].map(type => (
            <label key={type}>
              <input
                type="radio"
                name="question_type"
                value={type}
                checked={form.question_type === type}
                onChange={handleChange}
              />
              {type === 'mcq' ? 'Multiple Choice' : type === 'short_answer' ? 'Short Answer' : type === 'true_false' ? 'True/False' : type === 'fill_blank' ? 'Fill Blank' : 'Essay'}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Context (Optional)</label>
        <textarea
          name="context"
          placeholder="e.g., Based on lesson on Newton's Laws..."
          value={form.context}
          onChange={handleChange}
          rows="3"
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Generating Quiz...' : 'Generate Quiz'}
      </button>
    </form>
  );
}