import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import './App.css'

interface Message {
  id: number
  subject: string
  fromName: string
  receivedAt: string
  importance: string
  lifeDomain: string
}

interface Obligation {
  id: number
  action: string
  priority: number
  status: string
  mandatory: boolean
}

function App() {
  const [view, setView] = useState<'messages' | 'obligations'>('messages')

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      const response = await fetch('/api/messages')
      if (!response.ok) throw new Error('Failed to fetch messages')
      return response.json()
    },
  })

  // Fetch obligations
  const { data: obligations, isLoading: obligationsLoading } = useQuery<Obligation[]>({
    queryKey: ['obligations'],
    queryFn: async () => {
      const response = await fetch('/api/obligations')
      if (!response.ok) throw new Error('Failed to fetch obligations')
      return response.json()
    },
  })

  return (
    <div className="app">
      <header className="header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          🎯 Nora Personal Assistant
        </motion.h1>
        <p className="tagline">Never miss an obligation, deadline, or important detail again</p>
      </header>

      <nav className="nav">
        <button
          className={`nav-button ${view === 'messages' ? 'active' : ''}`}
          onClick={() => setView('messages')}
        >
          📧 Messages
        </button>
        <button
          className={`nav-button ${view === 'obligations' ? 'active' : ''}`}
          onClick={() => setView('obligations')}
        >
          ✅ Obligations
        </button>
      </nav>

      <main className="main">
        {view === 'messages' && (
          <motion.div
            key="messages"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Messages</h2>
            {messagesLoading ? (
              <p>Loading messages...</p>
            ) : messages && messages.length > 0 ? (
              <div className="grid">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className="card"
                    whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <h3>{message.subject || 'No Subject'}</h3>
                    <p className="from">From: {message.fromName || 'Unknown'}</p>
                    <div className="badges">
                      {message.importance && (
                        <span className={`badge badge-${message.importance}`}>
                          {message.importance}
                        </span>
                      )}
                      {message.lifeDomain && (
                        <span className="badge badge-domain">{message.lifeDomain}</span>
                      )}
                    </div>
                    <p className="date">
                      {new Date(message.receivedAt).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No messages yet. The API is ready to receive messages!</p>
                <p className="hint">Try creating a message via the API or Swagger UI</p>
              </div>
            )}
          </motion.div>
        )}

        {view === 'obligations' && (
          <motion.div
            key="obligations"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Obligations</h2>
            {obligationsLoading ? (
              <p>Loading obligations...</p>
            ) : obligations && obligations.length > 0 ? (
              <div className="grid">
                {obligations.map((obligation) => (
                  <motion.div
                    key={obligation.id}
                    className="card"
                    whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <h3>{obligation.action}</h3>
                    <div className="badges">
                      <span className={`badge badge-priority-${obligation.priority}`}>
                        Priority {obligation.priority}
                      </span>
                      <span className={`badge badge-${obligation.status}`}>
                        {obligation.status}
                      </span>
                      {obligation.mandatory && (
                        <span className="badge badge-mandatory">Mandatory</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No obligations yet. Messages will be analyzed to extract obligations!</p>
                <p className="hint">AI extraction coming soon</p>
              </div>
            )}
          </motion.div>
        )}
      </main>

      <footer className="footer">
        <p>Nora PA v1.0.0 | <a href="/swagger" target="_blank">API Docs</a> | <a href="/health" target="_blank">Health</a></p>
      </footer>
    </div>
  )
}

export default App
