import { useState, useEffect } from 'react';
import { getClasses } from '../api/classesApi';
import { getTeacherProfile } from '../api/teachersApi';
import { getOrGenerateChapterIndex, getTeachingProgress } from '../api/chapterIndexApi';
import { useAuth } from '../contexts/AuthContext';
import {
    BookOpen,
    CheckCircle2,
    Circle,
    ChevronDown,
    ChevronUp,
    PieChart,
    BarChart3,
    Award,
    Clock
} from 'lucide-react';

const SyllabusTracker = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedClass, setSelectedClass] = useState(null);
    const [chapterIndex, setChapterIndex] = useState(null);
    const [teachingProgress, setTeachingProgress] = useState([]);
    const [loadingIndex, setLoadingIndex] = useState(false);
    const [error, setError] = useState('');
    const [teacherProfile, setTeacherProfile] = useState(null);

    // UI States
    const [expandedChapters, setExpandedChapters] = useState(new Set());

    // Initial load
    useEffect(() => {
        const init = async () => {
            try {
                const classData = await getClasses();
                setClasses(classData);
                if (user) {
                    const profile = await getTeacherProfile(user.id);
                    setTeacherProfile(profile);
                }
            } catch (err) {
                console.error("Initialization failed:", err);
                setError("Failed to load classes or profile.");
            }
        };
        init();
    }, [user]);

    // Handle class selection
    const handleClassSelect = async (e) => {
        const val = e.target.value;
        setSelectedClassId(val);
        setChapterIndex(null);
        setTeachingProgress([]);
        setError('');
        setExpandedChapters(new Set());

        if (!val) {
            setSelectedClass(null);
            return;
        }

        const cls = classes.find(c => c.id.toString() === val);
        setSelectedClass(cls);

        try {
            setLoadingIndex(true);

            let profile = teacherProfile;
            if (!profile && user?.id) {
                profile = await getTeacherProfile(user.id);
                setTeacherProfile(profile);
            }

            if (!profile || !cls) {
                throw new Error("Missing profile or class data");
            }

            const subject = cls.subject;
            const grade = cls.grade;
            const board = profile.board || 'CBSE';

            const indexData = await getOrGenerateChapterIndex(subject, grade, board);
            setChapterIndex(indexData);

            const progressData = await getTeachingProgress(cls.id);
            setTeachingProgress(progressData.progress || []);

        } catch (err) {
            console.error("Failed to load syllabus specific data:", err);
            setError("Failed to load syllabus content.");
        } finally {
            setLoadingIndex(false);
        }
    };

    const toggleChapter = (chapterId) => {
        const newExpanded = new Set(expandedChapters);
        if (newExpanded.has(chapterId)) {
            newExpanded.delete(chapterId);
        } else {
            newExpanded.add(chapterId);
        }
        setExpandedChapters(newExpanded);
    };

    const isSubtopicTaught = (chapterId, subtopicId) => {
        const chapterProgress = teachingProgress.find(p => p.chapterId === chapterId);
        return chapterProgress && chapterProgress.subtopicIds.includes(subtopicId);
    };

    const getStats = () => {
        if (!chapterIndex || !teachingProgress) return null;

        let totalSubtopics = 0;
        let taughtSubtopics = 0;
        let totalChapters = chapterIndex.chapters.length;
        let completedChapters = 0;

        chapterIndex.chapters.forEach(ch => {
            const chSubtopics = ch.subtopics.length;
            totalSubtopics += chSubtopics;

            const chProgress = teachingProgress.find(p => p.chapterId === ch.id);
            let chTaught = 0;
            if (chProgress) {
                chTaught = ch.subtopics.filter(st => chProgress.subtopicIds.includes(st.id)).length;
                taughtSubtopics += chTaught;
            }

            if (chSubtopics > 0 && chTaught === chSubtopics) {
                completedChapters++;
            }
        });

        const percentage = totalSubtopics > 0 ? Math.round((taughtSubtopics / totalSubtopics) * 100) : 0;

        return { totalSubtopics, taughtSubtopics, percentage, totalChapters, completedChapters };
    };

    const stats = getStats();

    return (
        <div className="flex h-screen bg-gray-50 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Syllabus Tracker</h1>
                            <p className="text-gray-500 mt-1">Monitor your teaching progress and curriculum coverage</p>
                        </div>

                        {/* Class Selector */}
                        <div className="w-72">
                            <select
                                value={selectedClassId}
                                onChange={handleClassSelect}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700 font-medium transition-shadow cursor-pointer"
                            >
                                <option value="">Select Class...</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        Grade {cls.grade} • {cls.subject}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loadingIndex && (
                        <div className="flex flex-col justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            <p className="mt-4 text-gray-500 font-medium">Loading detailed syllabus...</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r mb-8">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {!selectedClassId && !loadingIndex && (
                        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
                            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                                <BookOpen className="h-16 w-16" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No Class Selected</h3>
                            <p className="mt-1 text-gray-500">Please select a class from the dropdown to view its syllabus tracker.</p>
                        </div>
                    )}

                    {chapterIndex && !loadingIndex && stats && (
                        <div className="animate-fade-in-up">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Overall Progress</p>
                                        <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.percentage}%</p>
                                    </div>
                                    <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                        <PieChart size={24} />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Chapters Done</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completedChapters} <span className="text-lg text-gray-400 font-normal">/ {stats.totalChapters}</span></p>
                                    </div>
                                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
                                        <Award size={24} />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Topics Covered</p>
                                        <p className="text-3xl font-bold text-gray-900 mt-1">{stats.taughtSubtopics} <span className="text-lg text-gray-400 font-normal">/ {stats.totalSubtopics}</span></p>
                                    </div>
                                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-600">
                                        <BarChart3 size={24} />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Estimated Pacing</p>
                                        <p className="text-lg font-bold text-green-600 mt-2">On Track</p>
                                    </div>
                                    <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                        <Clock size={24} />
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Chapter List */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 ml-1">Curriculum Breakdown</h2>
                                {chapterIndex.chapters.map((chapter) => {
                                    const expanded = expandedChapters.has(chapter.id);

                                    // Calculate chapter specific progress
                                    const totalChapterTopics = chapter.subtopics.length;
                                    const chapterProgress = teachingProgress.find(p => p.chapterId === chapter.id);
                                    const taughtChapterTopics = chapterProgress
                                        ? chapter.subtopics.filter(st => chapterProgress.subtopicIds.includes(st.id)).length
                                        : 0;
                                    const chapterPercent = totalChapterTopics > 0
                                        ? Math.round((taughtChapterTopics / totalChapterTopics) * 100)
                                        : 0;

                                    return (
                                        <div key={chapter.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                                            <div
                                                onClick={() => toggleChapter(chapter.id)}
                                                className="p-5 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold">
                                                        {chapter.chapterNumber}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">{chapter.chapterName}</h3>
                                                        <p className="text-sm text-gray-500">{chapter.description}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col items-end w-32 hidden sm:flex">
                                                        <div className="flex items-center justify-between w-full text-xs font-semibold mb-1">
                                                            <span className={chapterPercent === 100 ? "text-green-600" : "text-indigo-600"}>{chapterPercent}% Done</span>
                                                        </div>
                                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={`h-2 rounded-full transition-all duration-500 ${chapterPercent === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                                                                style={{ width: `${chapterPercent}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>

                                                    {expanded ? (
                                                        <ChevronUp className="text-gray-400" size={20} />
                                                    ) : (
                                                        <ChevronDown className="text-gray-400" size={20} />
                                                    )}
                                                </div>
                                            </div>

                                            {expanded && (
                                                <div className="border-t border-gray-100 bg-gray-50/50 p-6 animate-fade-in">
                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        {chapter.subtopics.map((subtopic) => {
                                                            const isTaught = isSubtopicTaught(chapter.id, subtopic.id);
                                                            return (
                                                                <div
                                                                    key={subtopic.id}
                                                                    className={`flex items-start p-3 rounded-lg border transition-colors ${isTaught
                                                                            ? 'bg-green-50 border-green-200'
                                                                            : 'bg-white border-gray-200'
                                                                        }`}
                                                                >
                                                                    <div className="mt-0.5">
                                                                        {isTaught ? (
                                                                            <CheckCircle2 className="text-green-600" size={18} />
                                                                        ) : (
                                                                            <Circle className="text-gray-300" size={18} />
                                                                        )}
                                                                    </div>
                                                                    <div className="ml-3">
                                                                        <p className={`text-sm font-medium ${isTaught ? 'text-green-900' : 'text-gray-700'}`}>
                                                                            {subtopic.subtopicNumber}. {subtopic.subtopicName}
                                                                        </p>
                                                                        <p className="text-xs text-gray-500 mt-1">{subtopic.description}</p>
                                                                        {isTaught && (
                                                                            <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium bg-white text-green-700 border border-green-200 shadow-sm">
                                                                                Completed
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SyllabusTracker;
