import axios from 'axios';
import { supabase } from '../utils/supabase';

const API_BASE_URL = 'http://localhost:8000';

// Helper to get auth headers
const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

// Get or generate chapter index for a subject/grade/board
export const getOrGenerateChapterIndex = async (subject, grade, board) => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/chapter-index/`, {
        params: { subject, grade, board },
        headers: headers,
    });
    return response.data;
};

// Get teaching progress for a class
export const getTeachingProgress = async (classId) => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/chapter-index/teaching-progress`, {
        params: { class_id: classId },
        headers: headers,
    });
    return response.data;
};

// Record teaching progress
export const recordTeachingProgress = async (chapterId, subtopicIds, classId, lessonPlanId = null) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(
        `${API_BASE_URL}/chapter-index/teaching-progress`,
        {
            chapterId,
            subtopicIds,
            classId,
            lessonPlanId,
        },
        {
            headers: headers,
        }
    );
    return response.data;
};
