import React, { useState, useEffect } from 'react';
import QuizForm from '../components/quiz/QuizForm';
import QuizPreview from '../components/quiz/QuizPreview';
import { generateQuiz, saveQuiz, downloadPDF } from '../api/quizzesApi';
import { getTeacherTopics } from '../api/lessonPlansApi';

export default function QuizGenerator() {
  const [step, setStep] = useState('form'); // 'form' | 'preview' | 'saved'
  const [formData, setFormData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizId, setQuizId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const uniqueTopics = await getTeacherTopics();
      setTopics(uniqueTopics);
    } catch (err) {
      console.error("Failed to load topics", err);
    }
  };

  const handleGenerateQuiz = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await generateQuiz(data);
      setFormData(data);
      setQuizData(response);
      setStep('preview');
    } catch (err) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async () => {
    setLoading(true);
    try {
      const saveData = {
        ...formData,
        questions_data: quizData.questions_data,
        answer_key: quizData.answer_key
      };
      console.log('Saving quiz with data:', saveData);
      const response = await saveQuiz(saveData);
      setQuizId(response.id);
      setStep('saved');
    } catch (err) {
      console.error('Save quiz error:', err);
      setError(`Failed to save quiz: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await downloadPDF(quizId);
    } catch (err) {
      setError('Failed to download PDF');
    }
  };

  return (
    <div className="quiz-generator">
      <h1>Quiz Generator</h1>

      {error && <div className="error-message">{error}</div>}

      {step === 'form' && (
        <QuizForm onSubmit={handleGenerateQuiz} loading={loading} topics={topics} />
      )}

      {step === 'preview' && (
        <>
          <QuizPreview quiz={quizData} />
          <div className="actions">
            <button onClick={() => setStep('form')} className="btn-secondary">
              ← Back
            </button>
            <button onClick={handleSaveQuiz} className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save & Download'}
            </button>
          </div>
        </>
      )}

      {step === 'saved' && (
        <>
          <div className="success-message">
            ✓ Quiz saved successfully!
          </div>
          <div className="actions">
            <button onClick={() => setStep('form')} className="btn-primary">
              Create Another Quiz
            </button>
            <button onClick={handleDownloadPDF} className="btn-secondary">
              📥 Download PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
