import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useSession } from '../../hooks/useSession'

const markdownClassName =
  'text-[15px] leading-relaxed text-[#ECECEC] [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-[#7EB6FF] [&_a]:underline [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:text-[13px] [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#0D0D0D] [&_pre]:p-3 [&_pre_code]:bg-transparent [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-[#3A3A3A] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-[#3A3A3A] [&_td]:px-3 [&_td]:py-2'

function MessageContent({ message }) {
  if (message.author === 'ai') {
    return (
      <div className={markdownClassName}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
    )
  }

  return <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
}

export function ChatPage() {
  const { user, logout } = useAuth()
  const {
    sessions,
    activeSession,
    listStatus,
    activeSessionStatus,
    sendStatus,
    error,
    createSession,
    setActive,
    sendMessage,
  } = useSession()
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef(null)

  const activeMessages = activeSession?.messages

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const content = message.trim()
    if (!content || sendStatus === 'loading') return

    setMessage('')
    try {
      await sendMessage(content)
    } catch {
      setMessage(content)
    }
  }

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [sessions],
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#212121] text-[#ECECEC]">
      <aside
        className="flex w-65 min-h-0 flex-col bg-[#171717]"
        aria-label="Conversation sidebar"
      >
        <div className="p-3">
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-[#2A2A2A]"
            type="button"
            onClick={() => createSession('Untitled chat')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            New chat
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <p className="px-2 py-2 text-xs font-medium text-[#8E8E9E]">Chats</p>
          {listStatus === 'loading' && (
            <p className="px-2 py-1 text-[13px] text-[#8E8E9E]">Loading conversations...</p>
          )}
          <ul className="grid list-none gap-1 p-0">
            {sortedSessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    session.id === activeSession?.id
                      ? 'bg-[#2A2A2A] text-white'
                      : 'text-[#ECECEC] hover:bg-[#2A2A2A]'
                  }`}
                  onClick={() => setActive(session.id)}
                >
                  {session.title}
                </button>
              </li>
            ))}
          </ul>
          {listStatus !== 'loading' && !sortedSessions.length && (
            <p className="px-2 py-1 text-[13px] text-[#8E8E9E]">No chats yet</p>
          )}
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-[#2A2A2A] p-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10A37F] text-sm font-medium text-white">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="truncate text-[13px] text-[#C5C5D2]">{user?.email}</span>
          </div>
          <button
            className="shrink-0 rounded-lg px-2 py-1.5 text-[13px] text-[#C5C5D2] transition-colors hover:bg-[#2A2A2A]"
            type="button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto" role="region" aria-label="Conversation panel">
          <div className="mx-auto w-full max-w-3xl px-4 py-6">
            {activeSession ? (
              <>
                {activeSessionStatus === 'loading' && (
                  <p className="text-[15px] text-[#8E8E9E]">Loading messages...</p>
                )}
                {activeSession.messages?.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-6 flex ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.author === 'user' ? (
                      <div className="max-w-[75%] rounded-3xl bg-[#303030] px-4 py-2.5">
                        <MessageContent message={message} />
                      </div>
                    ) : (
                      <div className="w-full">
                        {message.content ? (
                          <MessageContent message={message} />
                        ) : (
                          sendStatus === 'loading' && (
                            <p className="text-[15px] text-[#8E8E9E]">Thinking...</p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {activeSession.messages?.length === 0 && (
                  <p className="text-[15px] text-[#8E8E9E]">No messages in this conversation.</p>
                )}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex h-[60vh] items-center justify-center">
                <p className="text-[15px] text-[#8E8E9E]">
                  Start a new chat or select a conversation.
                </p>
              </div>
            )}
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </div>
        </div>

        <div className="px-4 pb-4">
          <form
            className="mx-auto flex w-full max-w-3xl items-center gap-2 rounded-3xl bg-[#303030] px-3 py-2"
            aria-label="Message composer"
            onSubmit={handleSubmit}
          >
            <input
              className="flex-1 bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-[#8E8E9E]"
              type="text"
              placeholder="Ask anything"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              disabled={sendStatus === 'loading'}
            />
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black transition-opacity disabled:opacity-30"
              type="submit"
              aria-label="Send message"
              disabled={!message.trim() || sendStatus === 'loading'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 19V5M12 5l-6 6M12 5l6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-[#8E8E9E]">
            ChatGPT clone can make mistakes. Check important info.
          </p>
        </div>
      </main>
    </div>
  )
}
