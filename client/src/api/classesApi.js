import axios from 'axios';
import { supabase } from '../utils/supabase';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI server URL

// Helper function to get auth headers
const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
};

export async function getClasses() {
    try {
        const headers = await getAuthHeaders();
        const response = await axios.get(`${API_BASE_URL}/classes/`, { headers });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.detail) {
            throw new Error(error.response.data.detail);
        } else {
            throw new Error('Failed to fetch classes.');
        }
    }
}

export async function createClass(classData) {
    try {
        const headers = await getAuthHeaders();
        const response = await axios.post(`${API_BASE_URL}/classes/`, classData, { headers });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data && error.response.data.detail) {
            throw new Error(error.response.data.detail);
        } else {
            throw new Error('Failed to create class.');
        }
    }
}

export async function deleteClass(classId) {
    try {
        const headers = await getAuthHeaders();
        await axios.delete(`${API_BASE_URL}/classes/${classId}`, { headers });
    } catch (error) {
        if (error.response && error.response.data && error.response.data.detail) {
            throw new Error(error.response.data.detail);
        } else {
            throw new Error('Failed to delete class.');
        }
    }
}
