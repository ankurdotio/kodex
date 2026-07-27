import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  createLocalSession,
  fetchConversation,
  fetchConversations,
  sendChatMessage,
  setActiveSession,
} from '../state/sessionSlice'

export function useSession() {
  const dispatch = useDispatch()
  const { sessions, activeSessionId, listStatus, detailStatus, sendStatus, error } = useSelector(
    (state) => state.chatSession,
  )

  useEffect(() => {
    dispatch(fetchConversations())
  }, [ dispatch ])

  const activeSession = useMemo(
    () => sessions.find((item) => item.id === activeSessionId) || null,
    [ sessions, activeSessionId ],
  )

  const createSession = (title = 'New Chat') => {
    const session = {
      id: crypto.randomUUID(),
      title,
      createdAt: new Date().toISOString(),
      messages: [],
      isLocal: true,
    }
    dispatch(createLocalSession(session))
    return session
  }

  const setActive = (id) => {
    dispatch(setActiveSession(id))
    dispatch(fetchConversation(id))
  }

  const sendMessage = (message) =>
    dispatch(
      sendChatMessage({
        message,
        conversationId: activeSession?.isLocal ? undefined : activeSession?.id,
        localSessionId: activeSession?.isLocal ? activeSession.id : undefined,
      }),
    ).unwrap()

  return {
    sessions,
    activeSession,
    activeSessionId,
    listStatus,
    activeSessionStatus: activeSessionId ? detailStatus[ activeSessionId ] : null,
    sendStatus,
    error,
    createSession,
    setActive,
    sendMessage,
  }
}
