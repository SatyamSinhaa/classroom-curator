import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const yearPlansApi = {
  // Calculate year plan preview without saving
  calculate: async (planData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/year-plans/calculate`, planData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to calculate year plan');
    }
  },

  // Create and save year plan
  create: async (planData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/year-plans/`, planData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to create year plan');
    }
  },

  // Get year plan by ID
  get: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/year-plans/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch year plan');
    }
  }
};