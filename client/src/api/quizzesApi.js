import axios from 'axios';
import { supabase } from '../utils/supabase';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI server URL

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

export async function generateQuiz(data) {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${API_BASE_URL}/quizzes/generate`, data, { headers });
  return response.data;
}

export async function saveQuiz(data) {
  const headers = await getAuthHeaders();
  const response = await axios.post(`${API_BASE_URL}/quizzes`, data, { headers });
  return response.data;
}

export async function downloadPDF(quizId) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}/export-pdf`, {
      headers,
      responseType: 'blob'
    });

    // Create a blob download link
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quiz-${quizId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF download failed:', error);
    throw error;
  }
}

export async function getQuiz(quizId) {
  const headers = await getAuthHeaders();
  const response = await axios.get(`${API_BASE_URL}/quizzes/${quizId}`, { headers });
  return response.data;
}
