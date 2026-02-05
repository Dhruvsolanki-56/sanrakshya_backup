import { apiClient } from './apiClient';

export const chatbotService = {
  askQuestion: (childId, question) => apiClient.post(`/chatbot/child/${childId}`, { question }),
};
