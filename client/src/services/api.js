import axios from 'axios';
import API_CONFIG from '../config/apiEndpoints';

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// Health Checks
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const checkDbHealth = async () => {
  const response = await api.get('/db/health');
  return response.data;
};

// Auth API Calls
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

// Documents API Calls with search and filters
export const uploadDocuments = async (formData, onUploadProgress) => {
  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

export const getDocuments = async (params = {}) => {
  const response = await api.get('/documents', { params });
  return response.data;
};

export const getDocumentById = async (id) => {
  const response = await api.get(`/documents/${id}`);
  return response.data;
};

export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

// Chat API Calls
export const createChat = async (chatData) => {
  const response = await api.post('/chats', chatData);
  return response.data;
};

export const getChats = async () => {
  const response = await api.get('/chats');
  return response.data;
};

export const getChatById = async (id) => {
  const response = await api.get(`/chats/${id}`);
  return response.data;
};

export const updateChatTitle = async (id, title) => {
  const response = await api.patch(`/chats/${id}`, { title });
  return response.data;
};

export const sendChatMessage = async (chatId, messageData) => {
  const response = await api.post(`/chats/${chatId}/messages`, messageData);
  return response.data;
};

/**
 * Stream RAG chat completion token by token over SSE
 */
export const sendChatMessageStream = async (chatId, messageData, { onCitations, onToken, onDone, onError }) => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/chats/${chatId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'Failed to send streaming request');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing chunk

      for (const block of lines) {
        if (!block.trim()) continue;
        const eventMatch = block.match(/^event:\s*(.+)$/m);
        const dataMatch = block.match(/^data:\s*(.+)$/m);

        const event = eventMatch ? eventMatch[1].trim() : 'message';
        let data = {};
        if (dataMatch) {
          try {
            data = JSON.parse(dataMatch[1].trim());
          } catch (e) {
            data = {};
          }
        }

        if (event === 'citations' && onCitations) {
          onCitations(data);
        } else if (event === 'token' && onToken) {
          onToken(data.token);
        } else if (event === 'done' && onDone) {
          onDone(data);
        } else if (event === 'error' && onError) {
          onError(data.message);
        }
      }
    }
  } catch (err) {
    if (onError) onError(err.message);
    else throw err;
  }
};

export const deleteChat = async (id) => {
  const response = await api.delete(`/chats/${id}`);
  return response.data;
};

// AI Features API Calls
export const generateAiFeature = async (featureData) => {
  const response = await api.post('/ai/generate', featureData);
  return response.data;
};

// Dashboard API Calls
export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export default api;
