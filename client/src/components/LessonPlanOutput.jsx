import { useState, useEffect } from 'react';
import TTSButton from './TTSButton';

const LessonPlanOutput = ({ lessonPlan: initialLessonPlan, onRegenerate, loading }) => {
  const [lessonPlan, setLessonPlan] = useState(initialLessonPlan);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [completedItems, setCompletedItems] = useState({}); // { 'session-item': boolean }
  const [aiRefinePrompt, setAiRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedPoint, setSelectedPoint] = useState('');

  // Update local state if initialLessonPlan changes (from LessonPlanner's handleSubmit)
  useEffect(() => {
    setLessonPlan(initialLessonPlan);
  }, [initialLessonPlan]);

  if (!lessonPlan) return null;

  const toggleItemCompletion = (sessionId, itemIndex) => {
    const key = `${sessionId}-${itemIndex}`;
    setCompletedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleQuestion = (index) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{lessonPlan.title}</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
          Save to Dashboard
        </button>
      </div>

      {/* Estimated Total Time */}
      {lessonPlan.estimatedTotalMins && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-blue-800 font-medium">
            Estimated Total Duration: {lessonPlan.estimatedTotalMins} minutes
          </p>
        </div>
      )}

      {/* Learning Objectives */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Learning Objectives</h3>
        <ul className="list-disc list-inside space-y-2">
          {lessonPlan.learningObjectives?.map((objective, index) => (
            <li key={index} className="text-gray-700">{objective}</li>
          ))}
        </ul>
      </section>

      {/* Subtopic Sections (New Structure) or Sessions (Legacy) */}
      {lessonPlan.subtopicSections ? (
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Lesson Content by Subtopic</h3>
          <div className="space-y-8">
            {lessonPlan.subtopicSections.map((section, sIndex) => (
              <div key={sIndex} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                  <h4 className="text-lg font-bold text-blue-700">
                    {section.subtopic}
                  </h4>
                  {section.estimatedMins && (
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {section.estimatedMins} mins
                    </span>
                  )}
                </div>

                {/* Timeline for Subtopic */}
                <div className="space-y-4 mb-6">
                  {section.timeline?.map((item, index) => {
                    const isCompleted = completedItems[`${sIndex}-${index}`];
                    return (
                      <div
                        key={index}
                        className={`relative border-l-4 border-blue-500 pl-4 py-2 bg-white rounded-r-md shadow-sm transition-all duration-200 ${isCompleted ? 'opacity-50' : 'opacity-100'
                          }`}
                      >
                        {item.isUpdated && (
                          <span className="absolute top-2 right-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200 animate-pulse z-10">
                            ✨ Updated by AI
                          </span>
                        )}
                        <div className="flex items-start mb-2">
                          <div className="flex items-center h-5 mt-1">
                            <input
                              type="checkbox"
                              checked={!!isCompleted}
                              onChange={() => toggleItemCompletion(sIndex, index)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center mb-1">
                              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                Point {item.itemNumber || index + 1} | {item.minute} min (+{item.duration}m)
                              </span>
                              <span className={`ml-3 font-semibold ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                {item.activity}
                              </span>
                              <div className="ml-auto">
                                <TTSButton text={`${item.activity}. ${item.teacherScript}`} />
                              </div>
                            </div>
                            <p className={`text-sm whitespace-pre-wrap ${isCompleted ? 'text-gray-400' : 'text-gray-700'}`}>
                              {item.teacherScript}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Homework for Subtopic */}
                {section.homework && (
                  <div className="relative mt-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    {section.homework.isUpdated && (
                      <span className="absolute top-2 right-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200 animate-pulse z-10">
                        ✨ Updated by AI
                      </span>
                    )}
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">📝</span> Homework
                      </div>
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Instructions:</p>
                        <p className="text-sm text-gray-600">{section.homework.instructions}</p>
                      </div>
                      {section.homework.questions?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Questions:</p>
                          <ul className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                            {section.homework.questions.map((q, i) => <li key={i}>{q}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : lessonPlan.sessions ? (
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Lesson Sessions</h3>
          <div className="space-y-8">
            {lessonPlan.sessions.map((session, sIndex) => (
              <div key={sIndex} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                  <h4 className="text-lg font-bold text-blue-700">
                    Day {session.sessionNumber}: {session.topic}
                  </h4>
                </div>

                {/* Timeline for Session */}
                <div className="space-y-4 mb-6">
                  {session.timeline?.map((item, index) => {
                    const isCompleted = completedItems[`${sIndex}-${index}`];
                    return (
                      <div
                        key={index}
                        className={`relative border-l-4 border-blue-500 pl-4 py-2 bg-white rounded-r-md shadow-sm transition-all duration-200 ${isCompleted ? 'opacity-50' : 'opacity-100'
                          }`}
                      >
                        {item.isUpdated && (
                          <span className="absolute top-2 right-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200 animate-pulse z-10">
                            ✨ Updated by AI
                          </span>
                        )}
                        <div className="flex items-start mb-2">
                          <div className="flex items-center h-5 mt-1">
                            <input
                              type="checkbox"
                              checked={!!isCompleted}
                              onChange={() => toggleItemCompletion(sIndex, index)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center mb-1">
                              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                Point {item.itemNumber || index + 1} | {item.minute} min (+{item.duration}m)
                              </span>
                              <span className={`ml-3 font-semibold ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                {item.activity}
                              </span>
                              <div className="ml-auto">
                                <TTSButton text={`${item.activity}. ${item.teacherScript}`} />
                              </div>
                            </div>
                            <p className={`text-sm whitespace-pre-wrap ${isCompleted ? 'text-gray-400' : 'text-gray-700'}`}>
                              {item.teacherScript}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Homework for Session */}
                {session.homework && (
                  <div className="relative mt-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                    {session.homework.isUpdated && (
                      <span className="absolute top-2 right-2 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200 animate-pulse z-10">
                        ✨ Updated by AI
                      </span>
                    )}
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="mr-2">📝</span> Session Homework
                      </div>
                    </h5>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Instructions:</p>
                        <p className="text-sm text-gray-600">{session.homework.instructions}</p>
                      </div>
                      {session.homework.questions?.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Questions:</p>
                          <ul className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                            {session.homework.questions.map((q, i) => <li key={i}>{q}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        /* Original Timeline Fallback (for old lesson plans) */
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Teacher Script Timeline</h3>
          <div className="space-y-4">
            {lessonPlan.timeline?.map((item, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-center mb-2">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Minute {item.minute}
                  </span>
                  <span className="ml-3 text-gray-600 font-medium">{item.activity}</span>
                  <div className="ml-auto">
                    <TTSButton text={`${item.activity}. ${item.teacherScript}`} />
                  </div>
                </div>
                <p className="text-gray-700">{item.teacherScript}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Discussion Questions - Shared across sessions */}
      {lessonPlan.discussionQuestions?.length > 0 && (
        <section className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Discussion Questions</h3>
          <div className="space-y-4">
            {lessonPlan.discussionQuestions.map((dq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <button
                  onClick={() => toggleQuestion(index)}
                  className="relative w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mr-12">
                      <span className="font-semibold text-gray-800">Q{index + 1}: {dq.q}</span>
                    </div>
                  </div>
                  {dq.isUpdated && (
                    <span className="absolute top-2 right-10 bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold border border-purple-200 animate-pulse z-10">
                      ✨ Updated by AI
                    </span>
                  )}
                  <span className="text-gray-400">{expandedQuestion === index ? '▲' : '▼'}</span>
                </button>
                {expandedQuestion === index && (
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Expected Points:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      {dq.expectedPoints?.map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Source Attribution */}
      {lessonPlan.sourceAttribution && (
        <section className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Source Information</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <span className="font-medium">Type:</span> {lessonPlan.sourceAttribution.type}
            </p>
            {lessonPlan.sourceAttribution.url && (
              <p className="text-blue-800 mt-1">
                <span className="font-medium">Source:</span> {lessonPlan.sourceAttribution.url}
              </p>
            )}
            <p className="text-blue-800 mt-1">
              <span className="font-medium">Coverage:</span> {lessonPlan.sourceAttribution.coverageNotes}
            </p>
          </div>
        </section>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4 pt-4 border-t border-gray-200">
        <button
          onClick={onRegenerate}
          disabled={loading}
          className={`px-6 py-2 rounded-md transition-colors ${loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {loading ? 'Regenerating...' : 'Regenerate'}
        </button>
        <button
          onClick={() => {
            const mode = window.location.pathname.includes('lesson-planner') ? 'topic' : 'topic';
            localStorage.removeItem(`lessonPlanner_${mode}`);
            localStorage.removeItem('lessonPlanner_pdf');
            localStorage.removeItem('lessonPlanner_youtube');
            window.location.reload();
          }}
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Clear Results
        </button>
      </div>

      {/* AI Refine Section */}
      <div className="mt-8 p-6 bg-purple-50 rounded-xl border border-purple-100">
        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
          <span className="mr-2">✨</span> Refine with AI
        </h3>
        <p className="text-sm text-purple-700 mb-4">
          Select a specific {lessonPlan.subtopicSections ? 'subtopic' : 'day'} and point to modify, then describe your changes.
        </p>

        {/* Day/Subtopic and Point Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">
              Select {lessonPlan.subtopicSections ? 'Subtopic' : 'Day'}
            </label>
            <select
              value={selectedDay}
              onChange={(e) => {
                setSelectedDay(e.target.value);
                setSelectedPoint(''); // Reset point when day changes
              }}
              className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              disabled={isRefining}
            >
              <option value="">Choose a {lessonPlan.subtopicSections ? 'subtopic' : 'day'}...</option>
              {lessonPlan.subtopicSections?.map((section, index) => (
                <option key={index} value={index.toString()}>
                  {section.subtopic}
                </option>
              ))}
              {lessonPlan.sessions?.map((session, index) => (
                <option key={index} value={index.toString()}>
                  Day {session.sessionNumber}: {session.topic}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-purple-700 mb-2">Select Point</label>
            <select
              value={selectedPoint}
              onChange={(e) => setSelectedPoint(e.target.value)}
              className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              disabled={isRefining || !selectedDay}
            >
              <option value="">Choose a point...</option>
              {selectedDay !== '' && lessonPlan.subtopicSections?.[parseInt(selectedDay)]?.timeline?.map((item, index) => (
                <option key={index} value={index.toString()}>
                  Point {item.itemNumber || index + 1}: {item.activity}
                </option>
              ))}
              {selectedDay !== '' && lessonPlan.sessions?.[parseInt(selectedDay)]?.timeline?.map((item, index) => (
                <option key={index} value={index.toString()}>
                  Point {item.itemNumber || index + 1}: {item.activity}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Change Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-purple-700 mb-2">Describe Your Changes</label>
          <input
            type="text"
            value={aiRefinePrompt}
            onChange={(e) => setAiRefinePrompt(e.target.value)}
            placeholder="e.g., make this more interactive, add examples, simplify the language..."
            className="w-full px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isRefining}
          />
        </div>

        <button
          onClick={async () => {
            if (!aiRefinePrompt.trim()) return;

            const sectionNum = selectedDay !== '' ? parseInt(selectedDay) + 1 : null;
            const pointNum = selectedPoint !== '' ? parseInt(selectedPoint) + 1 : null;

            let refinementPrompt = aiRefinePrompt;

            // Support both subtopicSections and sessions
            const sections = lessonPlan.subtopicSections || lessonPlan.sessions;
            const sectionType = lessonPlan.subtopicSections ? 'Subtopic' : 'Day';

            if (sectionNum && pointNum && sections) {
              const selectedSection = sections[parseInt(selectedDay)];
              const selectedTimelineItem = selectedSection?.timeline?.[parseInt(selectedPoint)];
              const pointActivity = selectedTimelineItem?.activity || 'Unknown Activity';
              const sectionName = selectedSection?.subtopic || selectedSection?.topic || '';

              refinementPrompt = `Modify only the content and activities for ${sectionType} ${sectionNum} ("${sectionName}"), Point ${pointNum} ("${pointActivity}"). Do not change point numbers, timing, or duration displays. ${aiRefinePrompt}`;
            } else if (sectionNum && sections) {
              const selectedSection = sections[parseInt(selectedDay)];
              const sectionName = selectedSection?.subtopic || selectedSection?.topic || '';
              refinementPrompt = `Modify only the content and activities for ${sectionType} ${sectionNum} ("${sectionName}"). Do not change point numbers, timing, or duration displays. ${aiRefinePrompt}`;
            } else {
              refinementPrompt = `Modify only the content and activities. Do not change point numbers, timing, or duration displays. ${aiRefinePrompt}`;
            }

            setIsRefining(true);
            try {
              const { generateLessonPlan } = await import('../api/lessonPlansApi');

              // Calculate duration from either structure
              let duration = 40;
              if (lessonPlan.subtopicSections?.[0]?.timeline) {
                duration = lessonPlan.subtopicSections[0].timeline.reduce((acc, curr) => acc + curr.duration, 0);
              } else if (lessonPlan.sessions?.[0]?.timeline) {
                duration = lessonPlan.sessions[0].timeline.reduce((acc, curr) => acc + curr.duration, 0);
              }

              const result = await generateLessonPlan({
                mode: 'tweak',
                topic: lessonPlan.title,
                existingPlan: lessonPlan,
                lessonPlanId: lessonPlan.id,
                refinementPrompt: refinementPrompt,
                subject: lessonPlan.subject,
                grade: lessonPlan.grade,
                classDurationMins: duration
              });
              setLessonPlan(result);
              setAiRefinePrompt('');
              setSelectedDay('');
              setSelectedPoint('');
            } catch (err) {
              console.error("Refinement failed:", err);
              alert("Failed to refine: " + err.message);
            } finally {
              setIsRefining(false);
            }
          }}
          disabled={isRefining || !aiRefinePrompt.trim()}
          className={`w-full px-6 py-2 rounded-lg text-white transition-colors ${isRefining || !aiRefinePrompt.trim() ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            }`}
        >
          {isRefining ? 'Refining...' : 'Apply Change'}
        </button>
      </div>
    </div>
  );
};

export default LessonPlanOutput;
