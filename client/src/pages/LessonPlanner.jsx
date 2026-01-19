import { useState, useEffect } from 'react';
import { generateLessonPlan } from '../api/lessonPlansApi';
import { getClasses, createClass } from '../api/classesApi';
import LessonPlanOutput from '../components/LessonPlanOutput';
import HistorySidebar from '../components/HistorySidebar';

const LessonPlanner = () => {
  const [mode, setMode] = useState('topic');
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [newClassData, setNewClassData] = useState({ subject: '', grade: '' });

  const [formData, setFormData] = useState({
    topic: '',
    youtubeUrl: '',
    pdfFile: null,
    grade: '',
    subject: '',
    durationMins: ''
  });
  const [lessonPlan, setLessonPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load classes on mount
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(data);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  };

  const handleCreateClass = async () => {
    if (!newClassData.subject || !newClassData.grade) return;
    try {
      setLoading(true);
      const created = await createClass({
        subject: newClassData.subject,
        grade: parseInt(newClassData.grade)
      });
      setClasses([...classes, created]);
      setSelectedClassId(created.id);
      setIsCreatingClass(false);
      setNewClassData({ subject: '', grade: '' });
      // Auto-fill grade and subject
      setFormData(prev => ({
        ...prev,
        grade: created.grade,
        subject: created.subject
      }));
    } catch (err) {
      setError("Failed to create class: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (e) => {
    const val = e.target.value;
    if (val === 'new') {
      setIsCreatingClass(true);
      setSelectedClassId('');
    } else {
      setIsCreatingClass(false);
      setSelectedClassId(val);
      if (val) {
        const cls = classes.find(c => c.id.toString() === val);
        if (cls) {
          setFormData(prev => ({
            ...prev,
            grade: cls.grade,
            subject: cls.subject || ''
          }));
        }
      }
    }
  };

  // Load lesson plan from localStorage on component mount and when mode changes
  useEffect(() => {
    const savedLessonPlan = localStorage.getItem(`lessonPlanner_${mode}`);
    if (savedLessonPlan) {
      try {
        const parsedLessonPlan = JSON.parse(savedLessonPlan);
        setLessonPlan(parsedLessonPlan);
      } catch (error) {
        console.error('Error parsing saved lesson plan:', error);
        localStorage.removeItem(`lessonPlanner_${mode}`);
        setLessonPlan(null);
      }
    } else {
      setLessonPlan(null);
    }
  }, [mode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      pdfFile: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLessonPlan(null);

    try {
      const data = {
        mode,
        classDurationMins: parseInt(formData.durationMins),
        classId: selectedClassId ? parseInt(selectedClassId) : null
      };

      // Only include grade and subject for topic mode
      if (mode === 'topic') {
        data.grade = parseInt(formData.grade);
        data.subject = formData.subject;
        data.topic = formData.topic;
      } else if (mode === 'youtube') {
        data.youtubeUrl = formData.youtubeUrl;
      } else if (mode === 'pdf') {
        data.pdfFile = formData.pdfFile;
      }

      const result = await generateLessonPlan(data);
      setLessonPlan(result);

      // Save to localStorage for persistence (mode-specific)
      try {
        localStorage.setItem(`lessonPlanner_${mode}`, JSON.stringify(result));
      } catch (error) {
        console.error('Error saving lesson plan to localStorage:', error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const durationValid = formData.durationMins;

    if (mode === 'topic') {
      return durationValid && formData.grade && formData.subject && formData.topic;
    }
    if (mode === 'youtube') {
      return durationValid && formData.youtubeUrl;
    }
    if (mode === 'pdf') {
      return durationValid && formData.pdfFile;
    }
    return false;
  };

  const handleLoadLessonPlan = (lessonPlanData) => {
    setLessonPlan(lessonPlanData);
    // Optionally populate form fields with the loaded lesson plan data
    if (lessonPlanData.grade) {
      setFormData(prev => ({
        ...prev,
        grade: lessonPlanData.grade.toString(),
        subject: lessonPlanData.subject || '',
        durationMins: lessonPlanData.durationMins ? lessonPlanData.durationMins.toString() : ''
      }));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Lesson Planner</h1>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              {/* Class Selection */}
              <div className="mb-6 border-b border-gray-200 pb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <select
                  value={isCreatingClass ? 'new' : selectedClassId}
                  onChange={handleClassSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                >
                  <option value="">General (No specific class)</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Grade {cls.grade} - {cls.subject}
                    </option>
                  ))}
                  <option value="new">+ Create New Class...</option>
                </select>

                {isCreatingClass && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Create New Class</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Grade"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newClassData.grade}
                        onChange={(e) => setNewClassData({ ...newClassData, grade: e.target.value })}
                      />
                      <input
                        type="text"
                        placeholder="Subject (e.g. Science)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newClassData.subject}
                        onChange={(e) => setNewClassData({ ...newClassData, subject: e.target.value })}
                      />
                    </div>
                    <div className="mt-4 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingClass(false);
                          setSelectedClassId('');
                        }}
                        className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateClass}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Create & Select
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Source Type
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'topic', label: 'Topic Description' },
                    { value: 'pdf', label: 'Upload PDF' },
                    { value: 'youtube', label: 'YouTube Video' }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Conditional Input Fields */}
                {mode === 'topic' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic Description
                    </label>
                    <textarea
                      name="topic"
                      value={formData.topic}
                      onChange={handleInputChange}
                      placeholder="Describe the lesson topic in detail..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                {mode === 'pdf' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PDF File
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {formData.pdfFile && (
                      <p className="mt-1 text-sm text-gray-600">
                        Selected: {formData.pdfFile.name}
                      </p>
                    )}
                  </div>
                )}

                {mode === 'youtube' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      name="youtubeUrl"
                      value={formData.youtubeUrl}
                      onChange={handleInputChange}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                {/* Metadata Fields - Only show Grade and Subject for Topic mode */}
                {mode === 'topic' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade Level
                      </label>
                      <input
                        type="number"
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        min="1"
                        max="12"
                        placeholder="e.g., 5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="e.g., Mathematics"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Duration Field - Always required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Period Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="durationMins"
                    value={formData.durationMins}
                    onChange={handleInputChange}
                    min="15"
                    max="180"
                    placeholder="e.g., 30"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid() || loading}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${isFormValid() && !loading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {loading ? 'Generating Lesson Plan...' : 'Generate Lesson Plan'}
                </button>
              </form>
            </div>

            {/* Lesson Plan Output */}
            {lessonPlan && (
              <LessonPlanOutput
                lessonPlan={lessonPlan}
                onRegenerate={handleSubmit}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      <HistorySidebar mode={mode} onLoadLessonPlan={handleLoadLessonPlan} />
    </div>
  );
};

export default LessonPlanner;
