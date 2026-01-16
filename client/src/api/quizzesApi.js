import axios from 'axios';
import { supabase } from '../utils/supabase';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI server URL

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

export async function generateQuiz(data) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/quizzes/generate`, {
      topic: data.topic,
      subject: data.subject,
      grade: data.grade,
      question_types: data.question_types,
      difficulty: data.difficulty,
      context: data.context || ""
    }, { headers });
    return response.data;
  } catch (error) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else {
      throw new Error('Failed to generate quiz. Please try again.');
    }
  }
}

export async function saveQuiz(data) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/quizzes/`, data, { headers });
    return response.data;
  } catch (error) {
    console.error("Save Quiz Error:", error);
    throw new Error('Failed to save quiz.');
  }
}


export async function downloadPDF(quizId) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/export-pdf`, {
      headers,
      responseType: 'blob'
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quiz-${quizId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error('Failed to download PDF');
  }
}

