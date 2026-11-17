import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getHealth = async () => {
  const response = await api.get('/api/health');
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/api/auth/me');
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
};

export const getExams = async () => {
  const response = await api.get('/api/exams');
  return response.data;
};

export const getExam = async (examId) => {
  const response = await api.get(`/api/exams/${examId}`);
  return response.data;
};

export const createExam = async (examData) => {
  const response = await api.post('/api/exams', examData);
  return response.data;
};

export const createSubmission = async (examId, data) => {
  const response = await api.post(`/api/exams/${examId}/submissions`, data);
  return response.data;
};

export const getExamSubmissions = async (examId) => {
  const response = await api.get(`/api/exams/${examId}/submissions`);
  return response.data;
};

export const getSubmission = async (submissionId) => {
  const response = await api.get(`/api/submissions/${submissionId}`);
  return response.data;
};

export const uploadAnswerImage = async (submissionId, questionId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(
    `/api/submissions/${submissionId}/answers/${questionId}/image`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    }
  );
  return response.data;
};

export const rerunOcr = async (answerId) => {
  const response = await api.post(`/api/answers/${answerId}/ocr`);
  return response.data;
};

export const approveVerifiedText = async (answerId, text) => {
  const response = await api.put(`/api/answers/${answerId}/verified-text`, { text });
  return response.data;
};

export const rejectAnswer = async (answerId) => {
  const response = await api.post(`/api/answers/${answerId}/reject`);
  return response.data;
};

export const evaluateAnswer = async (answerId) => {
  const response = await api.post(`/api/answers/${answerId}/evaluate`);
  return response.data;
};

export const overrideMarks = async (answerId, marks) => {
  const response = await api.put(`/api/answers/${answerId}/marks`, { marks });
  return response.data;
};

export const getExamResults = async (examId) => {
  const response = await api.get(`/api/exams/${examId}/results`);
  return response.data;
};

export default api;
