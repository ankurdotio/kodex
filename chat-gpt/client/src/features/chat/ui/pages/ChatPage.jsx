import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../auth/hooks/useAuth'
import { useSession } from '../../hooks/useSession'
import { chatService } from '../../service/chatService'
import logoImg from '../../../../assets/logo.png'

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlightHTML(code) {
  const escaped = escapeHtml(code)
  const tagRegex = /(&lt;!--[\s\S]*?--&gt;)|(&lt;!DOCTYPE[\s\S]*?&gt;)|(&lt;\/?[a-zA-Z0-9:-]+(\s[\s\S]*?)?\/?&gt;)/gi
  
  let lastIndex = 0
  let html = ''
  let match

  while ((match = tagRegex.exec(escaped)) !== null) {
    html += escaped.substring(lastIndex, match.index)
    const [full, comment, doctype, tag] = match

    if (comment) {
      html += `<span class="text-[#71717A]">${comment}</span>`
    } else if (doctype) {
      html += `<span class="text-[#60A5FA]">${doctype}</span>`
    } else if (tag) {
      const highlightedTag = tag
        .replace(/^(&lt;\/?[a-zA-Z0-9:-]+)/, '<span class="text-[#60A5FA]">$1</span>')
        .replace(/(\s+)([a-zA-Z0-9_-]+)(=")([^"]*)(")/g, '$1<span class="text-[#FCD34D]">$2</span>$3<span class="text-[#34D399]">$4</span>$5')
        .replace(/(\s+)([a-zA-Z0-9_-]+)(=')([^']*)(')/g, '$1<span class="text-[#FCD34D]">$2</span>$3<span class="text-[#34D399]">$4</span>$5')
        .replace(/(\/?&gt;)$/, '<span class="text-[#60A5FA]">$1</span>')
      html += highlightedTag
    }
    lastIndex = tagRegex.lastIndex
  }
  html += escaped.substring(lastIndex)
  return html
}

function highlightCSS(code) {
  const regex = /(\/\*[\s\S]*?\*\/)|([a-zA-Z0-9_.-]+)(?=\s*\{)|([a-zA-Z0-9_-]+)(?=\s*:)|(:\s*)([^;}]+)/g
  let lastIndex = 0
  let html = ''
  let match

  while ((match = regex.exec(code)) !== null) {
    html += escapeHtml(code.substring(lastIndex, match.index))
    const [full, comment, selector, property, colon, val] = match

    if (comment) {
      html += `<span class="text-[#71717A]">${escapeHtml(comment)}</span>`
    } else if (selector) {
      html += `<span class="text-[#60A5FA]">${escapeHtml(selector)}</span>`
    } else if (property) {
      html += `<span class="text-[#FCD34D]">${escapeHtml(property)}</span>`
    } else if (val) {
      html += `${escapeHtml(colon)}<span class="text-[#34D399]">${escapeHtml(val)}</span>`
    }
    lastIndex = regex.lastIndex
  }
  html += escapeHtml(code.substring(lastIndex))
  return html
}

function highlightSQL(code) {
  const regex = /(\-\-.*)|((["'])([\s\S]*?)\3)|(\b(?:SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|ON|GROUP|BY|ORDER|HAVING|LIMIT|CREATE|TABLE|DROP|ALTER|INDEX|INTO|VALUES|SET|AND|OR|NOT|IN|LIKE|IS|NULL|AS|UNION|ALL|CASE|WHEN|THEN|ELSE|END)\b)|(\b\d+\b)/gi
  let lastIndex = 0
  let html = ''
  let match

  while ((match = regex.exec(code)) !== null) {
    html += escapeHtml(code.substring(lastIndex, match.index))
    const [full, comment, string, , keyword, number] = match

    if (comment) {
      html += `<span class="text-[#71717A]">${escapeHtml(comment)}</span>`
    } else if (string) {
      html += `<span class="text-[#34D399]">${escapeHtml(string)}</span>`
    } else if (keyword) {
      html += `<span class="text-[#60A5FA]">${escapeHtml(keyword)}</span>`
    } else if (number) {
      html += `<span class="text-[#FCD34D]">${escapeHtml(number)}</span>`
    }
    lastIndex = regex.lastIndex
  }
  html += escapeHtml(code.substring(lastIndex))
  return html
}

function highlightGeneral(code) {
  const regex = /(\/\/.*|#.*|\/\*[\s\S]*?\*\/)|((["'`])[\s\S]*?\3)|(\b(?:class|public|private|protected|static|final|void|int|double|float|boolean|char|long|short|byte|if|else|for|while|do|return|import|package|new|def|as|from|try|except|fn|let|mut|struct|impl|use|namespace|using|virtual|override|interface|enum|switch|case|break|continue|nil|null|true|false|self|this|elif|pass|lambda|with|assert|yield|async|await|const|var|function|export)\b)|(\b\d+\b)|(\b[a-zA-Z0-9_]+)(?=\()/g
  let lastIndex = 0
  let html = ''
  let match

  while ((match = regex.exec(code)) !== null) {
    html += escapeHtml(code.substring(lastIndex, match.index))
    const [full, comment, string, , keyword, number, func] = match

    if (comment) {
      html += `<span class="text-[#71717A]">${escapeHtml(comment)}</span>`
    } else if (string) {
      html += `<span class="text-[#34D399]">${escapeHtml(string)}</span>`
    } else if (keyword) {
      html += `<span class="text-[#60A5FA]">${escapeHtml(keyword)}</span>`
    } else if (number) {
      html += `<span class="text-[#FCD34D]">${escapeHtml(number)}</span>`
    } else if (func) {
      html += `<span class="text-[#FBBF24]">${escapeHtml(func)}</span>`
    }
    lastIndex = regex.lastIndex
  }
  html += escapeHtml(code.substring(lastIndex))
  return html
}

function highlightCode(code, language) {
  const lang = language.toLowerCase()

  if (lang === 'html' || lang === 'xml' || lang === 'xhtml') {
    return highlightHTML(code)
  }
  if (lang === 'css') {
    return highlightCSS(code)
  }
  if (lang === 'sql') {
    return highlightSQL(code)
  }

  return highlightGeneral(code)
}

function formatMarkdownText(text) {
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const lines = escaped.split('\n')
  const formattedLines = lines.map((line) => {
    let trimmed = line.trim()
    let isBlock = false
    let result = line

    // 1. Headers
    if (trimmed.startsWith('### ')) {
      isBlock = true
      result = `<h3 class="text-base font-bold mt-4 mb-1.5 text-white">${trimmed.slice(4)}</h3>`
    } else if (trimmed.startsWith('## ')) {
      isBlock = true
      result = `<h2 class="text-lg font-bold mt-5 mb-2 text-white">${trimmed.slice(3)}</h2>`
    } else if (trimmed.startsWith('# ')) {
      isBlock = true
      result = `<h1 class="text-xl font-bold mt-6 mb-2.5 text-white">${trimmed.slice(2)}</h1>`
    } 
    // 2. Unordered lists
    else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      isBlock = true
      result = `<li class="list-disc ml-5 my-1 text-zinc-300 leading-relaxed">${trimmed.slice(2)}</li>`
    }
    // 3. Ordered lists
    else if (/^\d+\.\s/.test(trimmed)) {
      isBlock = true
      const match = trimmed.match(/^(\d+\.\s)(.*)/)
      result = `<li class="list-decimal ml-5 my-1 text-zinc-300 leading-relaxed">${match[2]}</li>`
    }

    // Apply inline styling (bold, inline code)
    result = result.replace(/`([^`]+)`/g, '<code class="bg-[#18181B] border border-[#27272A] px-1.5 py-0.5 rounded text-[#FCD34D] font-mono text-[12.5px]">$1</code>')
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')

    if (!isBlock) {
      return trimmed === '' ? '<div class="h-2"></div>' : `<p class="my-1 text-zinc-300 leading-relaxed">${result}</p>`
    }

    return result
  })

  return formattedLines.join('')
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[#27272A] bg-[#18181B] text-left select-text">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F0F11] border-b border-[#27272A] text-xs font-semibold text-[#A1A1AA] select-none">
        <div className="flex items-center gap-2">
          {/* File Tag Icon */}
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#A1A1AA]">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span className="uppercase tracking-wider">{language}</span>
        </div>
        <div className="flex items-center gap-3">
          {/* View code button */}
          <button className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer" title="View Code">
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="h-3.5 w-3.5">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </button>
          {/* Copy button */}
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            title="Copy Code"
          >
            {copied ? (
              <span className="text-[10px] text-zinc-400 font-sans">Copied!</span>
            ) : (
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            )}
          </button>
        </div>
      </div>
      {/* Code Area */}
      <div className="p-4 overflow-x-auto bg-[#09090B] font-mono text-[13px] leading-relaxed text-[#ECECEC] whitespace-pre">
        <code dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }} />
      </div>
    </div>
  )
}

function parseMessageContent(content) {
  const parts = []
  let currentIndex = 0

  while (currentIndex < content.length) {
    const openIndex = content.indexOf('```', currentIndex)

    if (openIndex === -1) {
      parts.push({
        type: 'text',
        content: content.substring(currentIndex)
      })
      break
    }

    if (openIndex > currentIndex) {
      parts.push({
        type: 'text',
        content: content.substring(currentIndex, openIndex)
      })
    }

    const codeStartIndex = openIndex + 3
    let newlineIndex = content.indexOf('\n', codeStartIndex)
    let closeIndex = -1

    if (newlineIndex !== -1) {
      closeIndex = content.indexOf('```', newlineIndex + 1)
    }

    if (closeIndex === -1) {
      // Unclosed code block (still streaming)
      let language = 'plaintext'
      let code = ''

      if (newlineIndex === -1) {
        language = content.substring(codeStartIndex).trim() || 'plaintext'
        code = ''
      } else {
        language = content.substring(codeStartIndex, newlineIndex).trim() || 'plaintext'
        code = content.substring(newlineIndex + 1)
      }

      parts.push({
        type: 'code',
        language: language,
        code: code
      })
      break
    } else {
      // Closed code block
      const language = content.substring(codeStartIndex, newlineIndex).trim() || 'plaintext'
      const code = content.substring(newlineIndex + 1, closeIndex)

      parts.push({
        type: 'code',
        language: language,
        code: code
      })
      currentIndex = closeIndex + 3
    }
  }

  return parts
}

export function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  const { user, logout, accessToken } = useAuth()
  const { sessions, activeSessionId, setActive, hydrateSessions } = useSession()

  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [openMenuSessionId, setOpenMenuSessionId] = useState(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [customAlert, setCustomAlert] = useState({ show: false, title: '', message: '' })
  
  const messagesEndRef = useRef(null)
  const ignoreNextHistoryFetchRef = useRef(null)
  const inputRef = useRef(null)

  // Sync activeSessionId with URL param "id"
  useEffect(() => {
    setActive(id || null)
  }, [id])

  // Fetch all sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const { data } = await chatService.listSessions()
        hydrateSessions(data.data.sessions || [])
      } catch (err) {
        console.error('Failed to fetch sessions:', err)
      }
    }
    fetchSessions()
  }, [])

  // Fetch messages when active session changes
  useEffect(() => {
    let isCurrent = true

    if (activeSessionId) {
      // Skip message fetch if we are currently streaming or about to stream on mount
      if (isStreaming || location.state?.streamOnMount) {
        setLoadingMessages(false)
        return
      }
      if (ignoreNextHistoryFetchRef.current === activeSessionId) {
        // Skip message fetch because we are actively streaming this new session
        ignoreNextHistoryFetchRef.current = null
        setLoadingMessages(false)
        return
      }

      const fetchMessages = async () => {
        setLoadingMessages(true)
        try {
          const { data } = await chatService.getMessages(activeSessionId)
          if (isCurrent) {
            setMessages(data.data.messages || [])
          }
        } catch (err) {
          console.error('Failed to fetch messages:', err)
        } finally {
          if (isCurrent) {
            setLoadingMessages(false)
          }
        }
      }
      fetchMessages()
    } else {
      if (!isStreaming) {
        setMessages([])
      }
      setLoadingMessages(false)
    }

    return () => {
      isCurrent = false
    }
  }, [activeSessionId, isStreaming, location.state])

  // Handle streaming on mount if navigated from a new chat creation
  useEffect(() => {
    if (activeSessionId && id === activeSessionId && location.state?.streamOnMount) {
      const messageToStream = location.state.streamOnMount
      
      // Clear navigation state immediately so reloads don't trigger it again
      navigate(location.pathname, { replace: true, state: {} })

      // Trigger the stream
      triggerStream(messageToStream, activeSessionId)
    }
  }, [activeSessionId, id, location.state])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Global click listener to close session 3-dots menu
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenuSessionId(null)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Keyboard Shortcuts: '/' focuses input, 'Ctrl+Shift+O' opens New Chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Shortcut 1: Ctrl + Shift + O -> New Chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        handleNewChat()
        return
      }

      // Shortcut 2: / -> Focus text box (only if not already focusing an input/textarea)
      if (e.key === '/') {
        const activeEl = document.activeElement
        if (
          activeEl &&
          (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)
        ) {
          return
        }
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Get user name display
  const displayName = user?.name || user?.email?.split('@')[0] || 'Bhavya'

  const showAlert = (title, message) => {
    setCustomAlert({ show: true, title, message })
  }

  async function handleDeleteSession(sessionId) {
    try {
      await chatService.deleteSession(sessionId)
      
      // Update session list in local state
      const updatedSessions = sessions.filter((s) => s.id !== sessionId)
      hydrateSessions(updatedSessions)
      
      // If deleted session was active, navigate to /chat
      if (sessionId === activeSessionId) {
        navigate('/chat')
      }
    } catch (err) {
      console.error('Failed to delete session:', err)
      showAlert('Delete Failed', err.response?.data?.message || err.message || JSON.stringify(err))
    } finally {
      setOpenMenuSessionId(null)
    }
  }

  async function triggerStream(messageContent, sessionId) {
    if (isStreaming) return
    setIsStreaming(true)

    // Append user message immediately
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent
    }
    setMessages((prev) => [...prev, userMessage])

    // Append a placeholder assistant message for streaming
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: ''
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/v1/chat/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          message: messageContent,
          conversationId: sessionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to stream AI response')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          let cleanPart = part
          // Strip any leading newlines left over from buffer split
          while (cleanPart.startsWith('\n') || cleanPart.startsWith('\r')) {
            cleanPart = cleanPart.slice(1)
          }

          if (cleanPart.startsWith('data: ')) {
            const dataStr = cleanPart.slice(6)
            
            try {
              const packet = JSON.parse(dataStr)
              if (packet && packet.text !== undefined) {
                const text = packet.text
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + text }
                      : msg
                  )
                )
              }
            } catch (err) {
              console.error('Error parsing SSE packet:', err)
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, content: 'Error streaming response. Please try again.' }
            : msg
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  async function handleSend(e) {
    if (e) e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMessageContent = input.trim()
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    if (!activeSessionId) {
      // 1. First message of a new chat session!
      setIsStreaming(true)
      try {
        const { data } = await chatService.createSession(userMessageContent)
        const { conversationId, title } = data.data
        
        const newSession = {
          id: conversationId,
          title,
          createdAt: new Date().toISOString()
        }
        
        // Skip database history reload since we already have the fully streamed content in local state
        ignoreNextHistoryFetchRef.current = conversationId
        
        hydrateSessions([newSession, ...sessions])
        
        // Transition route immediately, passing the message to trigger the stream on mount
        navigate(`/chat/${conversationId}`, { replace: true, state: { streamOnMount: userMessageContent } })
      } catch (err) {
        console.error('Failed to create session:', err)
      } finally {
        setIsStreaming(false)
      }
    } else {
      // 2. Existing chat session, trigger stream immediately
      triggerStream(userMessageContent, activeSessionId)
    }
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    
    // Auto-grow height calculation
    const element = e.target
    element.style.height = 'auto'
    const newHeight = Math.min(element.scrollHeight, 200)
    element.style.height = `${newHeight}px`
  }

  const handleInputKeyDown = (e) => {
    // If Enter is pressed without Shift, submit!
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isStreaming) {
        handleSend(e)
      }
    }
  }

  function handleNewChat() {
    navigate('/chat')
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-[#FAFAFA] font-sans antialiased relative">
      {/* Custom Alert Modal */}
      {customAlert.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-[400px] bg-[#18181B] border border-[#27272A] rounded-2xl p-6 shadow-2xl mx-4 transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-[#EF4444] mb-3">
              <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" className="h-6 w-6">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3 className="text-lg font-bold text-white">{customAlert.title}</h3>
            </div>
            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
              {customAlert.message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setCustomAlert({ show: false, title: '', message: '' })}
                className="px-5 py-2 text-xs font-semibold bg-white text-black rounded-full hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Backdrop overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        flex flex-col w-[260px] h-full bg-[#000000] border-r border-[#1C1C1E] select-none
        transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Header */}
        <div className="flex items-center justify-between px-3.5 py-4 text-[#FAFAFA]">
          {/* Logo & Sidebar toggle */}
          <div className="flex items-center gap-2.5 select-none">
            <img src={logoImg} alt="CHAD GPT Logo" className="h-10 w-10 object-contain rounded-md" />
            <span className="text-sm font-black tracking-widest text-white">CHAD GPT</span>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Close button for mobile sidebar */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden p-1 hover:bg-[#1C1C1E] rounded-md transition-colors text-[#A1A1AA] hover:text-white cursor-pointer"
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" className="h-4.5 w-4.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Options */}
        <div className="px-3 py-1">
          <button 
            onClick={() => {
              handleNewChat()
              setIsMobileSidebarOpen(false)
            }}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm text-white font-medium hover:bg-[#1C1C1E] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="h-4.5 w-4.5 text-[#A1A1AA]">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
              </svg>
              <span>New chat</span>
            </div>
          </button>
        </div>

        {/* Recents Section */}
        <div className="flex-1 overflow-y-auto px-3 mt-4 scrollbar-thin">
          <div className="px-3 text-xs font-semibold text-[#71717A] mb-1.5">Recents</div>
          <div className="grid gap-0.5">
            {sessions.map((chat) => (
              <div
                key={chat.id}
                className="group relative flex items-center justify-between rounded-lg hover:bg-[#1C1C1E] transition-colors"
              >
                <button
                  onClick={() => {
                    navigate(`/chat/${chat.id}`)
                    setIsMobileSidebarOpen(false)
                  }}
                  className={`flex-1 text-left pl-3 pr-8 py-2 text-sm truncate transition-colors ${
                    chat.id === activeSessionId
                      ? 'text-white font-medium bg-[#1C1C1E] rounded-lg'
                      : 'text-[#E4E4E7] group-hover:text-white'
                  }`}
                >
                  {chat.title}
                </button>

                {/* 3 dots vertical button (visible on hover) */}
                <div className="absolute right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuSessionId(openMenuSessionId === chat.id ? null : chat.id)
                    }}
                    className="p-1 hover:bg-[#27272A] rounded text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                  >
                    <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" className="h-4 w-4">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="12" cy="5" r="1"></circle>
                      <circle cx="12" cy="19" r="1"></circle>
                    </svg>
                  </button>

                  {/* Context Menu Dropdown */}
                  {openMenuSessionId === chat.id && (
                    <div className="absolute right-0 top-7 w-28 bg-[#18181B] border border-[#27272A] rounded-lg shadow-xl py-1 z-50 text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSession(chat.id)
                          setIsMobileSidebarOpen(false)
                        }}
                        className="w-full px-3 py-1.5 text-xs text-[#EF4444] font-semibold hover:bg-neutral-800 transition-colors text-left flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="h-3.5 w-3.5">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="px-3 text-xs text-[#71717A] italic py-2">No chats yet</div>
            )}
          </div>
        </div>

        {/* User Account / Profile bottom */}
        <div className="relative p-3 border-t border-[#1C1C1E] bg-[#000000]">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-[#1C1C1E] transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              {/* Avatar circle */}
              <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white uppercase">
                {(user?.name || displayName).charAt(0)}
              </div>
              <div className="grid leading-tight">
                <span className="text-xs font-semibold text-white truncate max-w-[140px]">{user?.name || displayName}</span>
              </div>
            </div>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4 text-[#A1A1AA]">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>

          {/* Profile Popover Drawer Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-16 left-3 right-3 rounded-lg border border-[#27272A] bg-[#18181B] p-1.5 shadow-2xl z-50">
              <button
                onClick={() => {
                  logout()
                  setIsMobileSidebarOpen(false)
                }}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm text-[#EF4444] hover:bg-neutral-800 font-semibold transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-black overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-5 h-[56px] select-none">
          <div className="flex items-center gap-1.5">
            {/* Hamburger menu button for mobile */}
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 hover:bg-[#1C1C1E] rounded-md transition-colors text-[#A1A1AA] hover:text-white cursor-pointer mr-1"
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" className="h-5 w-5">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#FAFAFA] select-none">
              <img src={logoImg} alt="CHAD GPT Logo" className="h-5 w-5 object-contain rounded-md" />
              <span>chadgpt</span>
            </div>
          </div>

        </header>

        {/* Message stream / Greeting Container */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-none flex flex-col">
          {loadingMessages ? (
            <div className="flex-1 flex items-center justify-center text-sm text-[#A1A1AA]">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            /* Screen 1: Empty state / Greeting in center */
            <div className="flex-1 flex flex-col items-center justify-center pb-24">
              <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight text-center">
                Hey, {displayName}. Ready to dive in?
              </h2>
              {/* Centered Composer */}
              <div className="w-full max-w-[720px] mt-6">
                <form onSubmit={handleSend} className="relative flex items-end bg-[#18181B] rounded-[24px] border border-[#27272A] pl-4 pr-2 py-2 focus-within:border-zinc-500 transition-colors">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    placeholder="Ask anything"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    className="flex-1 bg-transparent border-none text-[15px] outline-none text-white placeholder-[#71717A] px-3 py-1.5 resize-none overflow-y-auto max-h-[200px] scrollbar-thin"
                    style={{ height: 'auto' }}
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || isStreaming}
                    className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors cursor-pointer disabled:cursor-not-allowed mb-0.5"
                  >
                    <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" className="h-4 w-4">
                      <line x1="12" y1="19" x2="12" y2="5"></line>
                      <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            /* Screen 2: Chatting state */
            <div className="flex-1 w-full max-w-[720px] mx-auto flex flex-col gap-8 pb-32">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    /* User Message Bubble */
                    <div className="bg-[#18181B] border border-[#27272A] rounded-[24px] px-5 py-3 text-[15px] text-white max-w-[85%] leading-relaxed break-words">
                      {msg.content}
                    </div>
                  ) : (
                    /* Assistant Message styled segments */
                    <div className="text-[15px] text-white leading-relaxed break-words w-full pr-10">
                      {parseMessageContent(msg.content).map((part, idx) => {
                        if (part.type === 'code') {
                          return <CodeBlock key={idx} language={part.language} code={part.code} />
                        }
                        return (
                          <div 
                            key={idx} 
                            dangerouslySetInnerHTML={{ __html: formatMarkdownText(part.content) }} 
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Screen 2: Sticky Bottom Composer */}
        {messages.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pt-10 pb-6 px-4">
            <div className="w-full max-w-[720px] mx-auto">
              <form onSubmit={handleSend} className="relative flex items-end bg-[#18181B] rounded-[24px] border border-[#27272A] pl-4 pr-2 py-2 focus-within:border-zinc-500 transition-colors">
                <textarea
                  ref={inputRef}
                  rows={1}
                  placeholder="Ask anything"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  className="flex-1 bg-transparent border-none text-[15px] outline-none text-white placeholder-[#71717A] px-3 py-1.5 resize-none overflow-y-auto max-h-[200px] scrollbar-thin"
                  style={{ height: 'auto' }}
                />
                <button 
                  type="submit" 
                  disabled={!input.trim() || isStreaming}
                  className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors cursor-pointer disabled:cursor-not-allowed mb-0.5"
                >
                  <svg stroke="currentColor" fill="none" strokeWidth="2.5" viewBox="0 0 24 24" className="h-4.5 w-4.5">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                </button>
              </form>
              <div className="text-[11px] text-center text-[#71717A] mt-2.5 select-none">
                chadgpt can make mistakes. Check important info.
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
