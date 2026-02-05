import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ChapterIndexView = ({ chapters, teachingProgress, onGenerate, loading, onChapterSelect, readOnly = false }) => {
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [selectedSubtopics, setSelectedSubtopics] = useState(new Set());

    // Helper to check if a subtopic has been taught
    const isSubtopicTaught = (chapterId, subtopicId) => {
        const chapterProgress = teachingProgress.find(p => p.chapterId === chapterId);
        return chapterProgress && chapterProgress.subtopicIds.includes(subtopicId);
    };

    // Handle chapter selection
    const handleChapterClick = (chapter) => {
        setSelectedChapter(chapter);
        setSelectedSubtopics(new Set());
        if (onChapterSelect) {
            onChapterSelect(chapter.id);
        }
    };

    // Handle back button
    const handleBack = () => {
        setSelectedChapter(null);
        setSelectedSubtopics(new Set());
        if (onChapterSelect) {
            onChapterSelect(null);
        }
    };

    // Handle subtopic selection
    const handleSubtopicToggle = (subtopicId) => {
        const newSelected = new Set(selectedSubtopics);
        if (newSelected.has(subtopicId)) {
            newSelected.delete(subtopicId);
        } else {
            newSelected.add(subtopicId);
        }
        setSelectedSubtopics(newSelected);
    };

    // Handle generate button
    const handleGenerate = () => {
        console.log("ChapterIndexView: Handle Generate Clicked");
        console.log("Selected Chapter:", selectedChapter);
        console.log("Selected Subtopics (Size):", selectedSubtopics.size);

        if (!selectedChapter || selectedSubtopics.size === 0) {
            console.warn("Generation aborted: No chapter or subtopics selected");
            return;
        }

        const selectedSubtopicData = selectedChapter.subtopics.filter(st =>
            selectedSubtopics.has(st.id)
        );

        console.log("Calling onGenerate with:", {
            chapter: selectedChapter,
            subtopics: selectedSubtopicData,
            subtopicIds: Array.from(selectedSubtopics)
        });

        onGenerate({
            chapter: selectedChapter,
            subtopics: selectedSubtopicData,
            subtopicIds: Array.from(selectedSubtopics)
        });
    };

    // Render Single Selected Chapter View
    if (selectedChapter) {
        // ... (progress calc)

        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                {/* Header ... */}

                {/* Progress Bar ... */}

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {readOnly ? "Topic Status" : "Select Subtopics to Teach"}
                    </h3>
                    <div className="grid gap-3">
                        {selectedChapter.subtopics.map((subtopic) => {
                            const isTaught = isSubtopicTaught(selectedChapter.id, subtopic.id);
                            const isChecked = selectedSubtopics.has(subtopic.id);

                            return (
                                <label
                                    key={subtopic.id}
                                    className={`flex items-start p-4 rounded-lg border-2 transition-all ${readOnly
                                        ? 'border-gray-100 bg-gray-50'
                                        : (isChecked ? 'border-blue-500 bg-blue-50 cursor-pointer' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 cursor-pointer')
                                        }`}
                                >
                                    {!readOnly && (
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleSubtopicToggle(subtopic.id)}
                                            className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                        />
                                    )}
                                    <div className={`${!readOnly ? 'ml-3' : ''} flex-1`}>
                                        <div className="flex items-center justify-between">
                                            <span className={`font-medium ${isChecked && !readOnly ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {subtopic.subtopicNumber}. {subtopic.subtopicName}
                                            </span>
                                            {isTaught && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    ✓ Taught
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{subtopic.description}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Back
                    </button>
                    {!readOnly && (
                        <button
                            onClick={handleGenerate}
                            disabled={selectedSubtopics.size === 0 || loading}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white shadow-sm transition-colors ${selectedSubtopics.size > 0 && !loading
                                ? 'bg-blue-600 hover:bg-blue-700'
                                : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            {loading
                                ? 'Generating Lesson Plan...'
                                : `Generate Lesson Plan (${selectedSubtopics.size} Selected)`}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Render Chapter List View (Unchanged essentially, but good to double check props)
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
            {/* ... grid ... (same as before) */}
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {chapters.map((chapter) => {
                    // ... same progress calc
                    const taughtSubtopics = chapter.subtopics.filter(st =>
                        isSubtopicTaught(chapter.id, st.id)
                    ).length;
                    const totalSubtopics = chapter.subtopics.length;
                    const progressPercent = totalSubtopics > 0
                        ? Math.round((taughtSubtopics / totalSubtopics) * 100)
                        : 0;

                    return (
                        <div
                            key={chapter.id}
                            onClick={() => handleChapterClick(chapter)}
                            className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer"
                        >
                            {/* ... same card content ... */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                                        Chapter {chapter.chapterNumber}
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900 mt-1 group-hover:text-blue-700 transition-colors">
                                        {chapter.chapterName}
                                    </h3>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {chapter.description}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="bg-green-500 h-1.5 rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                <span className="whitespace-nowrap font-medium text-xs">
                                    {Math.round(progressPercent)}% Done
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

ChapterIndexView.propTypes = {
    chapters: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        chapterNumber: PropTypes.number.isRequired,
        chapterName: PropTypes.string.isRequired,
        description: PropTypes.string,
        subtopics: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.number.isRequired,
            subtopicNumber: PropTypes.number.isRequired,
            subtopicName: PropTypes.string.isRequired,
            description: PropTypes.string,
        })).isRequired,
    })).isRequired,
    teachingProgress: PropTypes.arrayOf(PropTypes.shape({
        chapterId: PropTypes.number.isRequired,
        subtopicIds: PropTypes.arrayOf(PropTypes.number).isRequired,
        lastTaught: PropTypes.string,
    })).isRequired,
    onGenerate: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    onChapterSelect: PropTypes.func,
    readOnly: PropTypes.bool
};

export default ChapterIndexView;

