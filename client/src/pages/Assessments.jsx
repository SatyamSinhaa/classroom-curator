import { useState, useEffect } from 'react';
import { getTeacherTopics } from '../api/lessonPlansApi';
import { generateQuiz } from '../api/quizzesApi';
import { getClasses } from '../api/classesApi';

const Assessments = () => {
  const [topics, setTopics] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);

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

  const [step, setStep] = useState('config'); // 'config' | 'preview'
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await getClasses();
      setClasses(data);
    } catch (err) {
      console.error("Failed to load classes", err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchTopics = async (classId = null) => {
    setLoadingTopics(true);
    console.log("Fetching topics...");
    try {
      const uniqueTopics = await getTeacherTopics(classId);
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

  const handleClassChange = (e) => {
    const classId = e.target.value;
    setSelectedClassId(classId);
    setTopics([]);
    setFormData(prev => ({ ...prev, topic: '', customTopic: '' }));

    if (classId) {
      const cls = classes.find(c => c.id.toString() === classId);
      if (cls) {
        setFormData(prev => ({
          ...prev,
          grade: cls.grade.toString(),
          subject: cls.subject || ''
        }));
      }
      fetchTopics(classId);
    } else {
      setTopics([]);
    }
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev => {
      const newState = { ...prev, [type]: !prev[type] };
      // When turning on a question type, set count to 1 if it's 0
      if (newState[type] && questionCounts[type] <= 0) {
        setQuestionCounts(prevCounts => ({
          ...prevCounts,
          [type]: 1
        }));
      }
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
        topic: formData.topic,
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
      setStep('preview');

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

          <div className="max-w-3xl mx-auto">
            {step === 'config' ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Quiz Configuration</h2>
                  <span className="text-sm text-gray-500">Step 1 of 2</span>
                </div>

                <form onSubmit={handleGenerate} className="space-y-6">
                  {/* Class Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Class
                    </label>
                    <select
                      value={selectedClassId}
                      onChange={handleClassChange}
                      className="w-full h-12 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">Select a class...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          Grade {cls.grade} - {cls.subject}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topic Selection with Datalist */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topic {topics.length > 0 && <span className="text-xs text-gray-500">({topics.length} from this class)</span>}
                    </label>
                    {loadingTopics ? (
                      <div className="text-sm text-gray-500 flex items-center py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Loading topics...
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          name="topic"
                          list="topics-list"
                          value={formData.topic}
                          onChange={handleInputChange}
                          placeholder={selectedClassId ? "Search or enter topic..." : "Choose a class first"}
                          disabled={!selectedClassId}
                          className="w-full h-12 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                        <datalist id="topics-list">
                          {topics.map((t, idx) => (
                            <option key={idx} value={t.topic} />
                          ))}
                        </datalist>
                      </>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                        Grade Level
                      </label>
                      <input
                        type="number"
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        className="w-full h-12 rounded-lg border-gray-200 bg-white/50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="w-full h-12 rounded-lg border-gray-200 bg-white/50 focus:bg-white shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
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
                      className="w-full h-12 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  {/* Question Types & Counts */}
                  <div className="border-t pt-4 mt-6">
                    <label className="block text-sm font-medium text-gray-900 mb-4">Question Types & Quantities</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: 'mcq', label: 'Multiple Choice' },
                        { id: 'short_answer', label: 'Short Answer' },
                        { id: 'true_false', label: 'True/False' },
                        { id: 'fill_blank', label: 'Fill in Blank' },
                        { id: 'essay', label: 'Essay' }
                      ].map((type) => (
                        <div key={type.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTypes[type.id]}
                              onChange={() => handleTypeToggle(type.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700">{type.label}</span>
                          </div>
                          {selectedTypes[type.id] && (
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={questionCounts[type.id]}
                              onChange={(e) => handleCountChange(type.id, e.target.value)}
                              className="w-14 h-8 text-sm rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-center"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-600 text-sm bg-red-50 p-4 border border-red-100 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={generating}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition-colors"
                  >
                    {generating ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Crafting your quiz...
                      </span>
                    ) : 'Generate Assessment'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8 print:hidden">
                  <button
                    onClick={() => setStep('config')}
                    className="text-gray-600 hover:text-blue-600 flex items-center text-sm font-medium transition-colors"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Settings
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Quiz
                    </button>
                  </div>
                </div>

                <div className="quiz-content">
                  <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100/50">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{generatedQuiz?.questions_data?.quiz_title}</h2>
                    <p className="text-gray-600 text-lg italic mt-4">"{generatedQuiz?.questions_data?.instructions}"</p>
                    <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-blue-100">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-1">Subject</span>
                        <span className="text-gray-700 font-semibold">{formData.subject}</span>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-1">Grade</span>
                        <span className="text-gray-700 font-semibold">{formData.grade}</span>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-1">Difficulty</span>
                        <span className="text-gray-700 font-semibold capitalize">{formData.difficulty}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {generatedQuiz?.questions_data?.questions?.map((q, idx) => (
                      <div key={idx} className="relative pl-12">
                        <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-xl font-semibold text-gray-800 leading-relaxed mb-4">{q.question_text}</p>

                          {q.question_type === 'mcq' && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                  <span className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 bg-white text-xs font-bold text-gray-500 mr-3">
                                    {opt.label}
                                  </span>
                                  <span className="text-gray-700">{opt.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {['short_answer', 'essay', 'fill_blank'].includes(q.question_type) && (
                            <div className="mt-4 space-y-3">
                              <div className="h-px bg-gray-200 w-full mb-3"></div>
                              <div className="h-px bg-gray-200 w-full mb-3"></div>
                              {q.question_type === 'essay' && <div className="h-px bg-gray-200 w-full"></div>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Answer Key Section */}
                  <div className="mt-16 pt-12 border-t-2 border-gray-100 page-break-before">
                    <div className="flex items-center mb-6">
                      <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Teacher's Answer Key</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                      {generatedQuiz?.questions_data?.questions?.map((q, idx) => (
                        <div key={idx} className="flex items-start bg-green-50/30 p-3 rounded-lg border border-green-100/50">
                          <span className="font-bold text-green-700 mr-3">{idx + 1}.</span>
                          <span className="text-gray-800 font-medium">{q.correct_answer}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessments;
