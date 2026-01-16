import React, { useState, useEffect } from 'react';

export default function QuizForm({ onSubmit, loading, topics = [] }) {
  const [form, setForm] = useState({
    topic: '',
    subject: 'Math',
    grade: 5,
    difficulty: 'medium',
    context: ''
  });

  const [questionCounts, setQuestionCounts] = useState({
    mcq: 5,
    short_answer: 0,
    true_false: 0,
    fill_blank: 0,
    essay: 0
  });

  const [selectedTypes, setSelectedTypes] = useState({
    mcq: true,
    short_answer: false,
    true_false: false,
    fill_blank: false,
    essay: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'grade') {
      const parsed = parseInt(value);
      setForm(prev => ({ ...prev, [name]: isNaN(parsed) ? 5 : parsed }));
    } else if (name === 'topic') {
      // Check for auto-fill match
      const matchedTopic = topics.find(t => t.topic === value);
      if (matchedTopic) {
        setForm(prev => ({
          ...prev,
          topic: value,
          subject: matchedTopic.subject || prev.subject,
          grade: matchedTopic.grade ? parseInt(matchedTopic.grade) : prev.grade
        }));
      } else {
        setForm(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleCountChange = (type, value) => {
    const val = parseInt(value);
    setQuestionCounts(prev => ({ ...prev, [type]: isNaN(val) ? 0 : val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Construct question_types payload
    const activeTypes = {};
    let totalQuestions = 0;

    Object.keys(selectedTypes).forEach(type => {
      if (selectedTypes[type] && questionCounts[type] > 0) {
        activeTypes[type] = questionCounts[type];
        totalQuestions += questionCounts[type];
      }
    });

    if (totalQuestions === 0) {
      alert("Please select at least one question type with count > 0");
      return;
    }

    if (!form.topic) {
      alert("Please select or enter a topic.");
      return;
    }

    const payload = {
      ...form,
      question_types: activeTypes
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="quiz-form">
      <div className="form-group">
        <label>Topic * {topics.length > 0 && <span style={{ fontSize: '0.8em', color: '#666' }}>({topics.length} saved)</span>}</label>
        <input
          type="text"
          name="topic"
          list="topics-list"
          placeholder="e.g., Gravity, Photosynthesis (or select saved)"
          value={form.topic}
          onChange={handleChange}
          required
        />
        <datalist id="topics-list">
          {topics.map((t, idx) => (
            <option key={idx} value={t.topic} />
          ))}
        </datalist>
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
        <label>Question Types & Counts</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            { id: 'mcq', label: 'Multiple Choice' },
            { id: 'short_answer', label: 'Short Answer' },
            { id: 'true_false', label: 'True/False' },
            { id: 'fill_blank', label: 'Fill Blank' },
            { id: 'essay', label: 'Essay' }
          ].map(type => (
            <div key={type.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', border: '1px solid #eee', borderRadius: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={selectedTypes[type.id]}
                  onChange={() => handleTypeToggle(type.id)}
                  style={{ marginRight: '8px' }}
                />
                {type.label}
              </label>
              {selectedTypes[type.id] && (
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={questionCounts[type.id]}
                  onChange={(e) => handleCountChange(type.id, e.target.value)}
                  style={{ width: '60px', padding: '4px', marginLeft: '8px' }}
                />
              )}
            </div>
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