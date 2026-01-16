import { useState, useEffect } from 'react';
import { getTeacherTopics } from '../api/lessonPlansApi';
import { generateQuiz } from '../api/quizzesApi';

const Assessments = () => {
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [formData, setFormData] = useState({
    topic: '',
    customTopic: '',
    subject: '',
    grade: '',
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

  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoadingTopics(true);
    console.log("Fetching topics...");
    try {
      const uniqueTopics = await getTeacherTopics();
      console.log("Topics received:", uniqueTopics);
      setTopics(uniqueTopics);
    } catch (err) {
      console.error("Failed to load topics", err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev => {
      const newState = { ...prev, [type]: !prev[type] };
      // If turning off, reset count? Or keep it? Let's keep it but it won't be sent if unchecked
      return newState;
    });
  };

  const handleCountChange = (type, value) => {
    setQuestionCounts(prev => ({
      ...prev,
      [type]: parseInt(value) || 0
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError(null);
    setGeneratedQuiz(null);

    try {
      // Construct question_types dict
      const activeTypes = {};
      let totalQuestions = 0;

      Object.keys(selectedTypes).forEach(type => {
        if (selectedTypes[type] && questionCounts[type] > 0) {
          activeTypes[type] = questionCounts[type];
          totalQuestions += questionCounts[type];
        }
      });

      if (totalQuestions === 0) {
        throw new Error("Please select at least one question type with a count greater than 0.");
      }

      const payload = {
        topic: formData.topic === 'other' ? formData.customTopic : formData.topic,
        subject: formData.subject || "General",
        grade: parseInt(formData.grade) || 5,
        difficulty: formData.difficulty,
        question_types: activeTypes,
        context: formData.context
      };

      if (!payload.topic) {
        throw new Error("Please select or enter a topic.");
      }

      const result = await generateQuiz(payload);
      setGeneratedQuiz(result);

    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedQuiz) return;

    // Simple client-side PDF for now, or use the backend export endpoint
    // For this implementation, I'll use basic jsPDF or formatted window print
    // But since backend has export-pdf, let's try to use that if we saved it.
    // However, the current flow is Generate -> View. Saving happens implicitly or manually?
    // The backend `generate` endpoint doesn't save to DB. 
    // Implementing a simple client-side print for now.

    window.print();
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Assessment Builder</h1>
            <p className="text-gray-600 mt-2">Create custom quizzes and tests from your lesson topics.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Configuration Form */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quiz Settings</h2>

                <form onSubmit={handleGenerate} className="space-y-4">

                  {/* Topic Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topic {topics.length > 0 && <span className="text-xs text-gray-500">({topics.length} available)</span>}
                    </label>
                    {loadingTopics ? (
                      <div className="text-sm text-gray-500">Loading topics...</div>
                    ) : (
                      <>
                        <select
                          name="topic"
                          value={formData.topic}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Select a topic...</option>
                          {topics.map((t, idx) => (
                            <option key={idx} value={t}>{t}</option>
                          ))}
                          <option value="other">Other (Custom)</option>
                        </select>
                        {topics.length === 0 && (
                          <p className="mt-1 text-xs text-amber-600">
                            ⚠️ No topics found. Create lesson plans first or select "Other" to enter a custom topic.
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  {formData.topic === 'other' && (
                    <div>
                      <input
                        type="text"
                        name="customTopic"
                        value={formData.customTopic}
                        onChange={handleInputChange}
                        placeholder="Enter custom topic..."
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                      <input
                        type="number"
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Science"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      name="difficulty"
                      value={formData.difficulty}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  {/* Question Types & Counts */}
                  <div className="border-t pt-4 mt-4">
                    <label className="block text-sm font-medium text-gray-900 mb-3">Question Types</label>
                    <div className="space-y-3">
                      {[
                        { id: 'mcq', label: 'Multiple Choice' },
                        { id: 'short_answer', label: 'Short Answer' },
                        { id: 'true_false', label: 'True/False' },
                        { id: 'fill_blank', label: 'Fill in Blank' },
                        { id: 'essay', label: 'Essay' }
                      ].map((type) => (
                        <div key={type.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTypes[type.id]}
                              onChange={() => handleTypeToggle(type.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                          </div>
                          {selectedTypes[type.id] && (
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={questionCounts[type.id]}
                              onChange={(e) => handleCountChange(type.id, e.target.value)}
                              className="w-16 h-8 text-sm rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                  >
                    {generating ? 'Generating Quiz...' : 'Generate New Quiz'}
                  </button>

                </form>
              </div>
            </div>

            {/* Right Column: Quiz Preview */}
            <div className="lg:col-span-2">
              {generatedQuiz ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-none">
                  <div className="flex justify-between items-start mb-6 print:hidden">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{generatedQuiz.questions_data.quiz_title}</h2>
                      <p className="text-gray-500 mt-1">{generatedQuiz.questions_data.instructions}</p>
                    </div>
                    <button
                      onClick={downloadPDF}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Print / Save PDF
                    </button>
                  </div>

                  <div className="space-y-8">
                    {generatedQuiz.questions_data?.questions?.map((q, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg print:bg-white print:p-0">
                        <div className="flex items-start">
                          <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold mt-0.5 print:bg-white print:text-black">
                            {idx + 1}
                          </span>
                          <div className="ml-4 flex-1">
                            <p className="text-base font-medium text-gray-900">{q.question_text}</p>

                            {/* Options for MCQ */}
                            {q.question_type === 'mcq' && q.options && (
                              <div className="mt-3 space-y-2">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center">
                                    <span className="h-5 w-5 flex items-center justify-center rounded-full border border-gray-300 text-xs font-medium text-gray-500 mr-3">
                                      {opt.label}
                                    </span>
                                    <span className="text-gray-700">{opt.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Lines for other types (visual only) */}
                            {['short_answer', 'essay', 'fill_blank'].includes(q.question_type) && (
                              <div className="mt-4 border-b border-gray-300 border-dashed h-6 w-full opacity-50"></div>
                            )}

                            {/* Answer Key (Hidden by default, could add toggle) */}
                            <div className="mt-4 pt-4 border-t border-gray-100 hidden print:hidden group-hover:block">
                              <p className="text-xs text-green-600 font-medium">Answer: {q.correct_answer}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-gray-200 print:block hidden">
                    <h3 className="font-bold mb-4">Answer Key</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {generatedQuiz.questions_data?.questions?.map((q, idx) => (
                        <div key={idx}>
                          <span className="font-medium">{idx + 1}.</span> {q.correct_answer}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[400px] border-2 border-dashed border-gray-300 rounded-xl">
                  <svg className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Select a topic and configure settings to generate a quiz.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessments;
