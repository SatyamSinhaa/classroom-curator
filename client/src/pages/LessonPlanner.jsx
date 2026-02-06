import { useState, useEffect } from 'react';
import { generateLessonPlan } from '../api/lessonPlansApi';
import { getClasses } from '../api/classesApi';
import { getOrGenerateChapterIndex, getTeachingProgress } from '../api/chapterIndexApi';
import { getTeacherProfile } from '../api/teachersApi';
import LessonPlanOutput from '../components/LessonPlanOutput';
import HistorySidebar from '../components/HistorySidebar';
import ChapterIndexView from '../components/ChapterIndexView';

import { useAuth } from '../contexts/AuthContext';

const LessonPlanner = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);

  // Chapter index state
  const [chapterIndex, setChapterIndex] = useState(null);
  const [teachingProgress, setTeachingProgress] = useState([]);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [indexError, setIndexError] = useState('');

  const [lessonPlan, setLessonPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teacherProfile, setTeacherProfile] = useState(null);


  // Load classes and teacher profile on mount
  useEffect(() => {
    fetchClasses();
    if (user) {
      fetchTeacherProfile();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(data);
    } catch (err) {
      console.error("Failed to load classes", err);
    }
  };

  const fetchTeacherProfile = async () => {
    try {
      if (user?.id) {
        const profile = await getTeacherProfile(user.id);
        setTeacherProfile(profile);
      }
    } catch (err) {
      console.error("Failed to load teacher profile", err);
    }
  };

  const [selectedChapterId, setSelectedChapterId] = useState(null);

  const handleClassSelect = async (e) => {
    const val = e.target.value;
    console.log("Selected class ID:", val);
    setSelectedClassId(val);
    setChapterIndex(null);
    setTeachingProgress([]);
    setIndexError('');
    setLessonPlan(null);
    setSelectedChapterId(null);

    if (val) {
      const cls = classes.find(c => c.id.toString() === val);
      console.log("Found class:", cls);
      setSelectedClass(cls);

      if (cls) {
        // Build profile if missing (fallback)
        let currentProfile = teacherProfile;
        if (!currentProfile) {
          console.warn("Teacher profile not loaded, attempting to fetch...");
          if (user?.id) {
            try {
              currentProfile = await getTeacherProfile(user.id);
              setTeacherProfile(currentProfile);
              console.log("Fetched teacher profile:", currentProfile);
            } catch (err) {
              console.error("Failed to fetch teacher profile on selection:", err);
            }
          } else {
            console.error("Cannot fetch profile: User not logged in");
          }
        }

        if (currentProfile) {
          // Fetch chapter index for this class
          await loadChapterIndex(cls, currentProfile);
        } else {
          console.error("Cannot load chapter index: Teacher profile missing");
          setIndexError("Could not load teacher profile. Please try refreshing the page.");
        }
      }
    } else {
      setSelectedClass(null);
    }
  };

  const handleChapterSelect = (chapterId) => {
    console.log("LessonPlanner: Selected Chapter ID:", chapterId);
    setSelectedChapterId(chapterId);
  };

  const loadChapterIndex = async (cls, profile = teacherProfile) => {
    try {
      setLoadingIndex(true);
      setIndexError('');

      if (!profile) {
        throw new Error("Teacher profile not available");
      }

      // Get subject and board from teacher profile
      const subject = cls.subject;
      const grade = cls.grade;
      const board = profile.board || 'CBSE'; // Default to CBSE if not set

      console.log(`Loading chapter index for ${subject}, Grade ${grade}, ${board}`);

      // Fetch or generate chapter index
      const indexData = await getOrGenerateChapterIndex(subject, grade, board);
      setChapterIndex(indexData);

      // Fetch teaching progress
      const progressData = await getTeachingProgress(cls.id);
      setTeachingProgress(progressData.progress || []);

      if (!indexData.fromCache) {
        console.log('New chapter index generated and stored in database');
      } else {
        console.log('Loaded existing chapter index from database');
      }
    } catch (err) {
      console.error("Failed to load chapter index", err);
      setIndexError(err.message || 'Failed to load chapter index');
    } finally {
      setLoadingIndex(false);
    }
  };

  const handleGenerateFromChapter = async ({ chapter, subtopics, subtopicIds }) => {
    setLoading(true);
    setError('');
    setLessonPlan(null);

    try {
      if (!chapter) {
        throw new Error("Invalid chapter data selected.");
      }

      const cName = chapter.chapterName || chapter.chapter_name || chapter.name || chapter.title;

      if (!cName) {
        throw new Error("Invalid chapter name.");
      }

      const data = {
        mode: 'chapter',
        chapterName: cName,
        subtopicNames: subtopics.map(st => st.subtopicName),
        chapterId: chapter.id,
        subtopicIds: subtopicIds,
        grade: selectedClass.grade,
        subject: selectedClass.subject,
        board: teacherProfile?.board || 'CBSE',
        classId: parseInt(selectedClassId)
      };

      const result = await generateLessonPlan(data);

      // Enrich lesson plan with metadata for refinement
      const enrichedLessonPlan = {
        ...result,
        subject: result.subject || selectedClass.subject,
        grade: result.grade || selectedClass.grade,
        board: result.board || teacherProfile?.board || 'CBSE'
      };

      setLessonPlan(enrichedLessonPlan);

      // Refresh teaching progress
      const progressData = await getTeachingProgress(parseInt(selectedClassId));
      setTeachingProgress(progressData.progress || []);
    } catch (err) {
      console.error("Lesson plan generation failed:", err);
      // alert("Generation Failed: " + err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadLessonPlan = (lessonPlanData) => {
    // Enrich historical lesson plan with current context metadata if missing
    const enrichedLessonPlan = {
      ...lessonPlanData,
      subject: lessonPlanData.subject || selectedClass?.subject,
      grade: lessonPlanData.grade || selectedClass?.grade,
      board: lessonPlanData.board || teacherProfile?.board || 'CBSE'
    };

    setLessonPlan(enrichedLessonPlan);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Lesson Planner</h1>

            {/* ... (Class Selection) */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              {/* Class Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={handleClassSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class to begin...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Grade {cls.grade} - {cls.subject}
                    </option>
                  ))}
                </select>

                {selectedClass && teacherProfile && (
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Subject: <span className="font-medium">{selectedClass.subject}</span></p>
                    <p>Board: <span className="font-medium">{teacherProfile.board || 'Not set'}</span></p>
                  </div>
                )}
              </div>

              {/* Loading State */}
              {loadingIndex && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading chapter index...</p>
                  <p className="text-sm text-gray-500">This may take a moment if generating for the first time</p>
                </div>
              )}

              {/* Error State */}
              {indexError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-800">{indexError}</p>
                </div>
              )}
            </div>

            {/* Chapter Index View */}
            {chapterIndex && !loadingIndex && (
              <ChapterIndexView
                chapters={chapterIndex.chapters}
                teachingProgress={teachingProgress}
                onGenerate={handleGenerateFromChapter}
                loading={loading}
                onChapterSelect={handleChapterSelect}
              />
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Lesson Plan Output */}
            {lessonPlan && (
              <div className="mt-6">
                <LessonPlanOutput
                  lessonPlan={lessonPlan}
                  onRegenerate={() => {
                    // Could implement regeneration logic here
                  }}
                  loading={loading}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      <HistorySidebar
        mode="lesson"
        classId={selectedClassId}
        chapterId={selectedChapterId}
        onLoadLessonPlan={handleLoadLessonPlan}
      />
    </div>
  );
};

export default LessonPlanner;
