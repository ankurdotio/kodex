import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { chatService } from '../service/chatService'

function getErrorMessage(error, fallback = 'Unable to load conversations') {
  return error?.response?.data?.message || error?.message || fallback
}

export const fetchConversations = createAsyncThunk(
  'chatSession/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await chatService.listConversations()
      return data.conversations
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
  {
    condition: (_, { getState }) => getState().chatSession.listStatus !== 'loading',
  },
)

export const fetchConversation = createAsyncThunk(
  'chatSession/fetchConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      const { data } = await chatService.getConversation(conversationId)
      return data.conversation
    } catch (error) {
      return rejectWithValue(getErrorMessage(error))
    }
  },
  {
    condition: (conversationId, { getState }) => {
      const { sessions, detailStatus } = getState().chatSession
      const conversation = sessions.find((item) => item.id === conversationId)
      return conversation?.messages === undefined && detailStatus[ conversationId ] !== 'loading'
    },
  },
)

export const sendChatMessage = createAsyncThunk(
  'chatSession/sendChatMessage',
  async ({ message, conversationId, localSessionId }, { dispatch, rejectWithValue }) => {
    const userMessage = {
      id: crypto.randomUUID(),
      author: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    }
    const aiMessageId = crypto.randomUUID()

    try {
      await chatService.sendMessageStream(message, conversationId, {
        onStart: ({ conversationId: serverConversationId, title }) => {
          if (!serverConversationId) {
            throw new Error('Conversation ID is missing from the response')
          }
          dispatch(
            streamStarted({
              conversationId: serverConversationId,
              localSessionId,
              title,
              userMessage,
              aiMessage: {
                id: aiMessageId,
                author: 'ai',
                content: '',
                createdAt: new Date().toISOString(),
              },
            }),
          )
        },
        onChunk: (text) => {
          dispatch(streamChunkAppended({ aiMessageId, text }))
        },
      })
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Unable to send message'))
    }
  },
  {
    condition: (_, { getState }) => getState().chatSession.sendStatus !== 'loading',
  },
)

const initialState = {
  activeSessionId: null,
  sessions: [],
  listStatus: 'idle',
  detailStatus: {},
  sendStatus: 'idle',
  error: null,
}

const sessionSlice = createSlice({
  name: 'chatSession',
  initialState,
  reducers: {
    setSessions(state, action) {
      state.sessions = action.payload
    },
    createLocalSession(state, action) {
      state.sessions.unshift(action.payload)
      state.activeSessionId = action.payload.id
    },
    setActiveSession(state, action) {
      state.activeSessionId = action.payload
    },
    streamStarted(state, action) {
      const { conversationId, localSessionId, title, userMessage, aiMessage } = action.payload
      const serverIndex = state.sessions.findIndex((item) => item.id === conversationId)
      const localIndex = localSessionId
        ? state.sessions.findIndex((item) => item.id === localSessionId)
        : -1

      if (serverIndex >= 0) {
        state.sessions[ serverIndex ].messages = [
          ...(state.sessions[ serverIndex ].messages || []),
          userMessage,
          aiMessage,
        ]
        state.sessions[ serverIndex ].updatedAt = aiMessage.createdAt
      } else {
        const conversation = {
          id: conversationId,
          title,
          createdAt: userMessage.createdAt,
          updatedAt: aiMessage.createdAt,
          messages: [ userMessage, aiMessage ],
        }
        if (localIndex >= 0) {
          state.sessions[ localIndex ] = conversation
        } else {
          state.sessions.unshift(conversation)
        }
      }

      state.activeSessionId = conversationId
      state.detailStatus[ conversationId ] = 'succeeded'
    },
    streamChunkAppended(state, action) {
      const { aiMessageId, text } = action.payload
      const session = state.sessions.find((item) => item.id === state.activeSessionId)
      const aiMessage = session?.messages?.find((item) => item.id === aiMessageId)
      if (aiMessage) {
        aiMessage.content += text
      }
    },
    clearSessions() {
      return { ...initialState }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.listStatus = 'loading'
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.listStatus = 'succeeded'
        const localSessions = state.sessions.filter((item) => item.isLocal)
        const serverSessions = action.payload.map((conversation) => {
          const cached = state.sessions.find((item) => item.id === conversation.id)
          return cached?.messages ? { ...conversation, messages: cached.messages } : conversation
        })
        state.sessions = [ ...localSessions, ...serverSessions ]
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.listStatus = 'failed'
        state.error = action.payload || action.error.message
      })
      .addCase(fetchConversation.pending, (state, action) => {
        state.detailStatus[ action.meta.arg ] = 'loading'
        state.error = null
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.detailStatus[ action.payload.id ] = 'succeeded'
        const index = state.sessions.findIndex((item) => item.id === action.payload.id)
        if (index >= 0) {
          state.sessions[ index ] = action.payload
        } else {
          state.sessions.unshift(action.payload)
        }
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.detailStatus[ action.meta.arg ] = 'failed'
        state.error = action.payload || action.error.message
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.sendStatus = 'loading'
        state.error = null
      })
      .addCase(sendChatMessage.fulfilled, (state) => {
        state.sendStatus = 'succeeded'
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sendStatus = 'failed'
        state.error = action.payload || action.error.message
      })
  },
})

export const {
  setSessions,
  createLocalSession,
  setActiveSession,
  streamStarted,
  streamChunkAppended,
  clearSessions,
} =
  sessionSlice.actions

export default sessionSlice.reducer
