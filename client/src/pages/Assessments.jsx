import { useState, useEffect } from 'react';
import { generateQuiz } from '../api/quizzesApi';
import { getClasses } from '../api/classesApi';
import { getTeacherProfile } from '../api/teachersApi';
import { getOrGenerateChapterIndex, getTeachingProgress } from '../api/chapterIndexApi';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, CheckCircle2, Circle, GraduationCap } from 'lucide-react';

const Assessments = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Chapter & Subtopic Logic
  const [chapterIndex, setChapterIndex] = useState(null);
  const [teachingProgress, setTeachingProgress] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [taughtSubtopics, setTaughtSubtopics] = useState([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState(new Set());
  const [loadingChapters, setLoadingChapters] = useState(false);

  const [formData, setFormData] = useState({
    grade: '',
    subject: '',
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
    const init = async () => {
      setLoadingClasses(true);
      try {
        const classData = await getClasses();
        setClasses(classData);
        if (user) {
          const profile = await getTeacherProfile(user.id);
          setTeacherProfile(profile);
        }
      } catch (err) {
        console.error("Failed to load classes or profile", err);
      } finally {
        setLoadingClasses(false);
      }
    };
    init();
  }, [user]);

  const handleClassChange = async (e) => {
    const classId = e.target.value;
    setSelectedClassId(classId);

    // Reset selections
    setChapterIndex(null);
    setTeachingProgress([]);
    setSelectedChapterId('');
    setTaughtSubtopics([]);
    setSelectedSubtopics(new Set());
    setError(null);

    if (classId) {
      const cls = classes.find(c => c.id.toString() === classId);
      if (cls) {
        setFormData(prev => ({
          ...prev,
          grade: cls.grade.toString(),
          subject: cls.subject || ''
        }));

        // Fetch Chapters & Progress
        setLoadingChapters(true);
        try {
          let profile = teacherProfile;
          if (!profile && user?.id) {
            profile = await getTeacherProfile(user.id);
            setTeacherProfile(profile);
          }

          const board = profile?.board || 'CBSE';
          const indexData = await getOrGenerateChapterIndex(cls.subject, cls.grade, board);
          setChapterIndex(indexData);

          const progressData = await getTeachingProgress(classId);
          setTeachingProgress(progressData.progress || []);

        } catch (err) {
          console.error("Error loading chapters:", err);
          setError("Could not load syllabus for this class.");
        } finally {
          setLoadingChapters(false);
        }
      }
    }
  };

  const handleChapterChange = (e) => {
    const chId = parseInt(e.target.value);
    setSelectedChapterId(chId || '');
    setSelectedSubtopics(new Set()); // Reset selected subtopics on chapter change

    if (chId && chapterIndex && teachingProgress) {
      const chapter = chapterIndex.chapters.find(c => c.id === chId);
      const progress = teachingProgress.find(p => p.chapterId === chId);

      if (chapter && progress) {
        // Filter subtopics that are in the progress list (taught)
        const taught = chapter.subtopics.filter(st => progress.subtopicIds.includes(st.id));
        setTaughtSubtopics(taught);

        // Auto-select all taught subtopics initially for convenience?
        // Or let user select. Let's auto-select all to save clicks.
        const allIds = new Set(taught.map(t => t.id));
        setSelectedSubtopics(allIds);
      } else {
        setTaughtSubtopics([]);
      }
    } else {
      setTaughtSubtopics([]);
    }
  };

  const handleSubtopicToggle = (id) => {
    const newSet = new Set(selectedSubtopics);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSubtopics(newSet);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTypeToggle = (type) => {
    setSelectedTypes(prev => {
      const newState = { ...prev, [type]: !prev[type] };
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
      // Validate selections
      if (!selectedClassId) throw new Error("Please select a class.");
      if (!selectedChapterId) throw new Error("Please select a chapter.");
      if (selectedSubtopics.size === 0) throw new Error("Please select at least one taught subtopic.");

      // Construct smart topic string
      const chapter = chapterIndex.chapters.find(c => c.id === parseInt(selectedChapterId));
      const selectedTopicsList = taughtSubtopics
        .filter(st => selectedSubtopics.has(st.id))
        .map(st => st.subtopicName)
        .join(", ");

      const constructedTopic = `Chapter: ${chapter.chapterName}. Focus closely on these subtopics: ${selectedTopicsList}.`;

      // Validate question types
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
        topic: constructedTopic,
        subject: formData.subject || "General",
        grade: parseInt(formData.grade) || 5,
        difficulty: formData.difficulty,
        question_types: activeTypes,
        context: formData.context
      };

      const result = await generateQuiz(payload);
      setGeneratedQuiz(result);
      setStep('preview');

    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Assessment Builder</h1>
            <p className="text-gray-600 mt-2">Create targeted quizzes based on what you've actually taught.</p>
          </header>

          <div className="max-w-4xl mx-auto">
            {step === 'config' ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Quiz Configuration</h2>
                  <span className="text-sm text-gray-500">Step 1 of 2</span>
                </div>

                <form onSubmit={handleGenerate} className="space-y-8">
                  {/* SELECTION GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: Context Selection */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Class
                        </label>
                        <div className="relative">
                          <select
                            value={selectedClassId}
                            onChange={handleClassChange}
                            className="w-full h-11 pl-3 pr-10 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="">Select a class...</option>
                            {classes.map((cls) => (
                              <option key={cls.id} value={cls.id}>
                                Grade {cls.grade} - {cls.subject}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Chapter
                        </label>
                        <select
                          value={selectedChapterId}
                          onChange={handleChapterChange}
                          disabled={!selectedClassId || loadingChapters}
                          className="w-full h-11 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">
                            {loadingChapters ? "Loading syllabus..." : (selectedClassId ? "Select a chapter..." : "Select class first")}
                          </option>
                          {chapterIndex?.chapters?.map((ch) => (
                            <option key={ch.id} value={ch.id}>
                              {ch.chapterNumber}. {ch.chapterName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <select
                          name="difficulty"
                          value={formData.difficulty}
                          onChange={handleInputChange}
                          className="w-full h-11 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Subtopic Selection */}
                    <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 h-full">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-semibold text-gray-700">
                          Taught Subtopics
                        </label>
                        {taughtSubtopics.length > 0 && (
                          <span className="text-xs text-blue-600 font-medium">
                            {selectedSubtopics.size} selected
                          </span>
                        )}
                      </div>

                      {!selectedClassId ? (
                        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                          Select a class to view topics
                        </div>
                      ) : !selectedChapterId ? (
                        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                          Select a chapter to see taught topics
                        </div>
                      ) : taughtSubtopics.length === 0 ? (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm text-center px-4">
                          <GraduationCap className="w-8 h-8 mb-2 opacity-50" />
                          <p>No subtopics have been marked as taught for this chapter yet.</p>
                          <p className="mt-2 text-xs text-gray-500">Go to Syllabus Tracker to update progress.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                          {taughtSubtopics.map((st) => {
                            const isSelected = selectedSubtopics.has(st.id);
                            return (
                              <div
                                key={st.id}
                                onClick={() => handleSubtopicToggle(st.id)}
                                className={`flex items-start p-3 rounded-md border cursor-pointer transition-all ${isSelected
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                  }`}
                              >
                                <div className={`mt-0.5 mr-3 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-300'}`}>
                                  {isSelected ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                </div>
                                <div>
                                  <p className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                    {st.subtopicName}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{st.description}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Question Types & Counts */}
                  <div className="border-t pt-6">
                    <label className="block text-sm font-medium text-gray-900 mb-4">Question Types & Quantities</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {[
                        { id: 'mcq', label: 'MCQ' },
                        { id: 'short_answer', label: 'Short Ans' },
                        { id: 'true_false', label: 'True/False' },
                        { id: 'fill_blank', label: 'Fill Blank' },
                        { id: 'essay', label: 'Essay' }
                      ].map((type) => (
                        <div
                          key={type.id}
                          className={`p-3 rounded-lg border transition-all ${selectedTypes[type.id] ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 opacity-75'
                            }`}
                        >
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              checked={selectedTypes[type.id]}
                              onChange={() => handleTypeToggle(type.id)}
                              className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">{type.label}</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            disabled={!selectedTypes[type.id]}
                            value={questionCounts[type.id]}
                            onChange={(e) => handleCountChange(type.id, e.target.value)}
                            className="w-full text-sm rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="text-red-700 text-sm bg-red-50 p-4 border border-red-100 rounded-lg flex items-center">
                      <span className="mr-2">⚠️</span> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={generating || (!selectedChapterId)}
                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all"
                  >
                    {generating ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Crafting your quiz...
                      </span>
                    ) : 'Generate Targeted Assessment'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Preview Mode (Reusing same UI but could be enhanced) */}
                <div className="flex justify-between items-center mb-8 print:hidden">
                  <button
                    onClick={() => setStep('config')}
                    className="text-gray-600 hover:text-blue-600 flex items-center text-sm font-medium transition-colors"
                  >
                    ← Back to Settings
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  >
                    🖨️ Print Quiz
                  </button>
                </div>

                <div className="quiz-content">
                  <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100/50">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{generatedQuiz?.questions_data?.quiz_title}</h2>
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                      <span className="bg-white px-3 py-1 rounded-full border border-blue-100">{formData.subject}</span>
                      <span className="bg-white px-3 py-1 rounded-full border border-blue-100">Grade {formData.grade}</span>
                    </div>
                    <p className="text-gray-600 text-lg italic mt-4 border-t border-blue-100 pt-4">"{generatedQuiz?.questions_data?.instructions}"</p>
                  </div>

                  <div className="space-y-10">
                    {generatedQuiz?.questions_data?.questions?.map((q, idx) => (
                      <div key={idx} className="relative pl-12 group">
                        <div className="absolute left-0 top-0 w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
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
                            <div className="mt-8 space-y-4">
                              <div className="h-px bg-gray-200 w-full border-b border-dashed border-gray-300"></div>
                              <div className="h-px bg-gray-200 w-full border-b border-dashed border-gray-300"></div>
                              {q.question_type === 'essay' && <div className="h-px bg-gray-200 w-full border-b border-dashed border-gray-300"></div>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-16 pt-12 border-t-2 border-gray-100 page-break-before">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center mr-3">✓</span>
                      Teacher's Answer Key
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {generatedQuiz?.questions_data?.questions?.map((q, idx) => (
                        <div key={idx} className="flex items-start bg-green-50/50 p-4 rounded-lg border border-green-100">
                          <span className="font-bold text-green-700 mr-4 mt-0.5">{idx + 1}.</span>
                          <div>
                            <span className="text-gray-900 font-medium block mb-1">Answer: {q.correct_answer}</span>
                            <span className="text-xs text-green-700 uppercase tracking-wide font-bold">{q.question_type.replace('_', ' ')}</span>
                          </div>
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
