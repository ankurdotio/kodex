import { getAccessToken, httpClient } from '../../../shared/service/httpClient'

export const chatService = {
  listConversations() {
    return httpClient.get('/chat/conversations')
  },
  getConversation(conversationId) {
    return httpClient.get(`/chat/conversations/${conversationId}`)
  },
  async sendMessageStream(message, conversationId, { onStart, onChunk, signal } = {}) {
    const token = getAccessToken()
    const response = await fetch('/api/v1/chat/conversation', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, ...(conversationId ? { conversationId } : {}) }),
      signal,
    })

    if (!response.ok || !response.body) {
      let errorMessage = 'Unable to send message'
      try {
        const data = await response.json()
        errorMessage = data?.message || errorMessage
      } catch {
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    const serverConversationId = response.headers.get('X-Conversation-Id')
    const title = decodeURIComponent(response.headers.get('X-Conversation-Title') || 'New chat')
    onStart?.({ conversationId: serverConversationId, title })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let content = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''

      for (const event of events) {
        const line = event.trim()
        if (!line.startsWith('data:')) continue
        const text = JSON.parse(line.slice(5).trim())
        content += text
        onChunk?.(text)
      }
    }

    return { conversationId: serverConversationId, title, content }
  },
}
