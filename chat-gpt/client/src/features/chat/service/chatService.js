import { httpClient } from '../../../shared/service/httpClient'

export const chatService = {
  // Placeholder for future chat APIs.
  listSessions() {
    return httpClient.get('/chat/sessions')
  },
  getMessages(conversationId) {
    return httpClient.get(`/chat/conversation/${conversationId}/messages`)
  },
  createSession(message) {
    return httpClient.post('/chat/session/create', { message })
  },
  deleteSession(conversationId) {
    return httpClient.delete(`/chat/conversation/${conversationId}`)
  },
}
