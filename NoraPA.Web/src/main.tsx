import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Inbox from './pages/Inbox'
import Tasks from './pages/Tasks'
import Obligations from './pages/Obligations'
import Deadlines from './pages/Deadlines'
import Settings from './pages/Settings'
import People from './pages/People'
import Documents from './pages/Documents'
import Events from './pages/Events'
import Chat from './pages/Chat'
import Analytics from './pages/Analytics'

// Enable dark mode by default
document.documentElement.classList.add('dark');

// Create QueryClient instance with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="obligations" element={<Obligations />} />
            <Route path="deadlines" element={<Deadlines />} />
            <Route path="settings" element={<Settings />} />
            <Route path="people" element={<People />} />
            <Route path="documents" element={<Documents />} />
            <Route path="events" element={<Events />} />
            <Route path="chat" element={<Chat />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
          success: {
            iconTheme: {
              primary: 'hsl(var(--primary))',
              secondary: 'hsl(var(--primary-foreground))',
            },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
