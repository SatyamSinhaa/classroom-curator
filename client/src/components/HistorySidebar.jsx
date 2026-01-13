import { useState, useEffect } from 'react';
import { getLessonPlanHistory, getLessonPlan } from '../api/lessonPlansApi';

const HistorySidebar = ({ mode, onLoadLessonPlan }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [mode]);

  const fetchHistory = async () => {
    if (!mode) return;

    setLoading(true);
    setError('');
    try {
      const data = await getLessonPlanHistory(mode);
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLesson = async (lessonId) => {
    try {
      const lessonPlan = await getLessonPlan(lessonId);
      onLoadLessonPlan(lessonPlan);
    } catch (err) {
      setError('Failed to load lesson plan: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getModeLabel = (mode) => {
    switch (mode) {
      case 'topic': return 'Topic Description';
      case 'pdf': return 'PDF Upload';
      case 'youtube': return 'YouTube Video';
      default: return mode;
    }
  };

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold text-gray-900">
          History - {getModeLabel(mode)}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Recent lesson plans from this source
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading history...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No lesson plans found for this source type.</p>
            <p className="text-gray-400 text-xs mt-1">Generate your first lesson plan to see it here.</p>
          </div>
        )}

        {!loading && history.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg border border-gray-200 p-3 mb-3 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleLoadLesson(item.id)}
          >
            <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
              {item.title}
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Subject:</span> {item.subject}</p>
              <p><span className="font-medium">Grade:</span> {item.grade}</p>
              <p><span className="font-medium">Created:</span> {formatDate(item.created_at)}</p>
            </div>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={fetchHistory}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Refresh History
          </button>
        </div>
      )}
    </div>
  );
};

export default HistorySidebar;
