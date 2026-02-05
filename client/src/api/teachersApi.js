import axios from 'axios';
import { supabase } from '../utils/supabase';

const API_BASE_URL = 'http://localhost:8000';

// Helper to get auth headers
const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

// Get teacher profile by user ID
export const getTeacherProfile = async (userId) => {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/teachers/profile/${userId}`, {
        headers: headers,
    });
    return response.data;
};

// Create or update teacher profile
export const updateTeacherProfile = async (profileData) => {
    const headers = await getAuthHeaders();
    const response = await axios.post(`${API_BASE_URL}/teachers/profile`, profileData, {
        headers: headers,
    });
    return response.data;
};
