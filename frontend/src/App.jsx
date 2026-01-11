import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import ImageStudio from './components/ImageStudio';
import LandingPage from './components/LandingPage';
import ErrorBoundary from './components/ErrorBoundary';
import AgentSettings from './components/AgentSettings';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import { api } from './api';
import './App.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Main App Layout (The "Council Chamber")
const CouncilChamber = () => {
  const [inChamber, setInChamber] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState('pro');
  const [danMode, setDanMode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to get user-friendly error message
  const getErrorMessage = (err) => {
    if (err?.response?.status === 429) return "Too many requests. Please wait a moment and try again.";
    if (err?.response?.status === 401) return "You need to be logged in to perform this action.";
    if (err?.response?.status === 403) return "You don't have permission to access this resource.";
    if (err?.response?.status === 404) return "The requested conversation was not found.";
    if (err?.response?.status === 500) return "Server error. Please try again later.";
    if (err?.message) return err.message;
    return "An unexpected error occurred. Please try again.";
  };

  const clearError = () => setError(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      loadConversation(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      // If 401, logout
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
      }
      setError(getErrorMessage(err));
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError(getErrorMessage(err));
    }
  };

  const handleNewConversation = async () => {
    clearError();
    try {
      const newConv = await api.createConversation();
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConv.id);
      setCurrentConversation(newConv);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError(getErrorMessage(err));
    }
  };

  const handleSelectConversation = (id) => {
    clearError();
    setCurrentConversationId(id);
  };

  const handleVoiceMessage = async (audioBlob) => {
    if (!currentConversationId || isLoading) return;
    clearError();
    setIsLoading(true);
    // Optimistic update
    setCurrentConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: '🎤 Processing voice...' }, { role: 'assistant', loading: { stage1: true, stage2: true, stage3: true } }],
    }));

    try {
      await api.sendAudioMessageStream(currentConversationId, audioBlob, currentTier, (event) => {
        const eventType = event.type;
        if (eventType === 'transcription') {
          setCurrentConversation((prev) => {
            const messages = [...prev.messages];
            const userMsgIndex = messages.length - 2;
            if (messages[userMsgIndex] && messages[userMsgIndex].role === 'user') messages[userMsgIndex].content = event.text;
            return { ...prev, messages };
          });
        } else if (eventType === 'stage1_complete') {
          setCurrentConversation((prev) => {
            const messages = [...prev.messages];
            messages[messages.length - 1].stage1 = event.data;
            messages[messages.length - 1].loading.stage1 = false;
            return { ...prev, messages };
          });
        } else if (eventType === 'stage2_complete') {
          setCurrentConversation((prev) => {
            const messages = [...prev.messages];
            messages[messages.length - 1].stage2 = event.data;
            messages[messages.length - 1].metadata = event.metadata;
            messages[messages.length - 1].loading.stage2 = false;
            return { ...prev, messages };
          });
        } else if (eventType === 'stage3_complete') {
          setCurrentConversation((prev) => {
            const messages = [...prev.messages];
            messages[messages.length - 1].stage3 = event.data;
            messages[messages.length - 1].loading.stage3 = false;
            return { ...prev, messages };
          });
          if (event.audio) new Audio(event.audio).play().catch(e => console.error(e));
        } else if (eventType === 'complete' || eventType === 'title_complete') {
          loadConversations();
          if (eventType === 'complete') setIsLoading(false);
        } else if (eventType === 'error') {
          setError(event.message); setIsLoading(false);
        }
      });
    } catch (err) { setError(getErrorMessage(err)); setIsLoading(false); }
  };

  const handleSendMessage = async (content) => {
    if (!currentConversationId || isLoading) return;
    clearError();
    setIsLoading(true);
    setCurrentConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content }, { role: 'assistant', loading: { stage1: true, stage2: true, stage3: true } }],
    }));

    try {
      await api.sendMessageStream(currentConversationId, content, currentTier, danMode, (event) => {
        const eventType = event.type;
        if (eventType === 'stage1_complete') {
          setCurrentConversation((prev) => {
            const messages = [...prev.messages];
            messages[messages.length - 1].stage1 = event.data;
            messages[messages.length - 1].loading.stage1 = false;
            return { ...prev, messages };
          });
        } else if (eventType === 'stage2_complete') {
          setCurrentConversation((prev) => {
            const messages = [...prev.messages];
            messages[messages.length - 1].stage2 = event.data;
            messages[messages.length - 1].metadata = event.metadata;
            messages[messages.length - 1].loading.stage2 = false;
            return { ...prev, messages };
          });
        } else if (eventType === 'stage3_complete') {
          setCurrentConversation((prev) => {
            const messages = [...prev.messages];
            messages[messages.length - 1].stage3 = event.data;
            messages[messages.length - 1].loading.stage3 = false;
            return { ...prev, messages };
          });
        } else if (eventType === 'complete' || eventType === 'title_complete') {
          loadConversations();
          if (eventType === 'complete') setIsLoading(false);
        } else if (eventType === 'error') {
          setError(event.message); setIsLoading(false);
        }
      });
    } catch (err) { setError(getErrorMessage(err)); setIsLoading(false); }
  };

  const handleGenerateImage = async (prompt) => {
    // (Simplified reuse)
    if (!currentConversationId || isLoading) return;
    setIsLoading(true);
    setCurrentConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: `🎨 Generate image: ${prompt}` }, { role: 'assistant', loading: { image: true } }],
    }));
    try {
      const result = await api.generateImage(prompt);
      setCurrentConversation((prev) => {
        const msgs = [...prev.messages];
        const last = msgs[msgs.length - 1];
        last.image = result.url; last.revised_prompt = result.revised_prompt; last.loading.image = false;
        return { ...prev, messages: msgs };
      });
      setIsLoading(false); loadConversations();
    } catch (err) { setError(getErrorMessage(err)); setIsLoading(false); }
  };

  const handleDeepResearch = async (prompt) => {
    if (!currentConversationId || isLoading) return;
    setIsLoading(true);
    setCurrentConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: `🧠 Deep Research: ${prompt}` }, { role: 'assistant', isDeepResearch: true, loading: { deepResearch: true }, deepResearchEvents: [] }],
    }));
    try {
      await api.performDeepResearchStream(prompt, (event) => {
        setCurrentConversation((prev) => {
          const msgs = [...prev.messages];
          const last = msgs[msgs.length - 1];
          last.deepResearchEvents = [...(last.deepResearchEvents || []), event];
          if (event.type === 'result') {
            last.content = event.data.report; last.sources = event.data.sources; last.debug_streams = event.data.debug_streams; last.loading.deepResearch = false;
          }
          return { ...prev, messages: msgs };
        });
      });
      setIsLoading(false); loadConversations();
    } catch (err) { setError(getErrorMessage(err)); setIsLoading(false); }
  };


  if (!inChamber) {
    return (
      <ErrorBoundary>
        <LandingPage onEnter={() => setInChamber(true)} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          currentTier={currentTier}
          onTierChange={setCurrentTier}
          danMode={danMode}
          onDanModeChange={setDanMode}
          activeView={activeView}
          onViewChange={setActiveView}
          onOpenSettings={() => setShowSettings(true)}
        />
        <main className="main-content">
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={clearError} className="error-dismiss">×</button>
            </div>
          )}
          {activeView === 'chat' ? (
            <ChatInterface
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              conversation={currentConversation}
              onSendMessage={handleSendMessage}
              onVoiceMessage={handleVoiceMessage}
              onGenerateImage={handleGenerateImage}
              onDeepResearch={handleDeepResearch}
              onOpenSettings={() => setShowSettings(true)}
              isLoading={isLoading}
            />
          ) : (
            <ImageStudio onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          )}
          {showSettings && <AgentSettings onClose={() => setShowSettings(false)} />}
        </main>
      </div>
    </ErrorBoundary>
  );
};

// Main Router App
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <CouncilChamber />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
