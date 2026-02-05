import axios from 'axios';
import { supabase } from '../utils/supabase';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI server URL

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

export async function generateLessonPlan(data) {
  try {
    const headers = await getAuthHeaders();

    if (data.mode === 'pdf') {
      const formData = new FormData();
      formData.append('file', data.pdfFile);
      formData.append('grade', data.grade);
      formData.append('subject', data.subject);
      formData.append('classDurationMins', data.classDurationMins);

      const response = await axios.post(`${API_BASE_URL}/lesson-plans/generate-from-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...headers }
      });
      return response.data;
    } else {
      const payload = {
        mode: data.mode,
        topic: data.topic,
        youtubeUrl: data.youtubeUrl,
        chapterName: data.chapterName,
        subtopicNames: data.subtopicNames,
        chapterId: data.chapterId,
        subtopicIds: data.subtopicIds,
        grade: data.grade,
        subject: data.subject,
        board: data.board,
        classDurationMins: data.classDurationMins,
        existingPlan: data.existingPlan,
        refinementPrompt: data.refinementPrompt,
        lessonPlanId: data.lessonPlanId,
        classId: data.classId
      };

      const response = await axios.post(`${API_BASE_URL}/lesson-plans/generate`, payload, { headers });
      return response.data;
    }
  } catch (error) {
    console.error("API Error (generateLessonPlan):", error);
    if (error.response && error.response.data && error.response.data.detail) {
      throw new Error(error.response.data.detail);
    } else {
      throw new Error('Failed to generate lesson plan. Please try again.');
    }
  }
}

export async function getLessonPlan(lessonPlanId) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/lesson-plans/${lessonPlanId}`, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.detail) {
      throw new Error(error.response.data.detail);
    } else {
      throw new Error('Failed to retrieve lesson plan.');
    }
  }
}

export async function getLessonPlanHistory(sourceType, classId = null, chapterId = null, limit = 10) {
  try {
    const headers = await getAuthHeaders();
    let url = `${API_BASE_URL}/lesson-plans/history/${sourceType}?limit=${limit}`;
    if (classId) {
      url += `&class_id=${classId}`;
    }
    if (chapterId) {
      url += `&chapter_id=${chapterId}`;
    }
    console.log("getLessonPlanHistory URL:", url);
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.detail) {
      throw new Error(error.response.data.detail);
    } else {
      throw new Error('Failed to retrieve lesson plan history.');
    }
  }
}


export async function getTeacherTopics(classId = null) {
  try {
    const headers = await getAuthHeaders();
    let url = `${API_BASE_URL}/lesson-plans/topics`;
    if (classId) {
      url += `?class_id=${classId}`;
    }
    const response = await axios.get(url, { headers });
    return response.data.topics;
  } catch (error) {
    console.error('Failed to fetch topics:', error);
    return [];
  }
}

