import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import ImageStudio from './components/ImageStudio';
import LandingPage from './components/LandingPage';
import ErrorBoundary from './components/ErrorBoundary';
import AgentSettings from './components/AgentSettings';
import { api } from './api';
import './App.css';
import VoiceInput from './components/VoiceInput';

function App() {
  const [inChamber, setInChamber] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTier, setCurrentTier] = useState('pro');
  const [danMode, setDanMode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('chat'); // 'chat' or 'studio'
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null); // User-facing error messages

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

  // Clear error when user starts a new action
  const clearError = () => setError(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation details when selected
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
      setCurrentConversation(newConv); // Set directly to render chat interface immediately
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

    try {
      // Optimistic user message (placeholder until transcription arrives)
      setCurrentConversation((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { role: 'user', content: '🎤 Processing voice...' },
          { role: 'assistant', loading: { stage1: true, stage2: true, stage3: true } },
        ],
      }));

      await api.sendAudioMessageStream(currentConversationId, audioBlob, currentTier, (event) => {
        const eventType = event.type;

        switch (eventType) {
          case 'transcription':
            // Update the placeholder with actual text
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const userMsgIndex = messages.length - 2;
              if (messages[userMsgIndex] && messages[userMsgIndex].role === 'user') {
                messages[userMsgIndex].content = event.text;
              }
              return { ...prev, messages };
            });
            break;

          case 'stage1_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage1 = event.data;
              lastMsg.loading.stage1 = false;
              return { ...prev, messages };
            });
            break;

          case 'stage2_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage2 = event.data;
              lastMsg.metadata = event.metadata;
              lastMsg.loading.stage2 = false;
              return { ...prev, messages };
            });
            break;

          case 'stage3_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage3 = event.data;
              lastMsg.loading.stage3 = false;
              return { ...prev, messages };
            });

            // Play audio if available
            if (event.audio) {
              const audio = new Audio(event.audio);
              audio.play().catch(e => console.error("Auto-play blocked:", e));
            }
            break;

          case 'title_complete':
          case 'complete':
            loadConversations();
            if (eventType === 'complete') setIsLoading(false);
            break;

          case 'error':
            console.error('Stream error:', event.message);
            setError(getErrorMessage({ message: event.message }));
            setIsLoading(false);
            break;
        }
      });
    } catch (err) {
      console.error('Failed to send voice message:', err);
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!currentConversationId || isLoading) return;
    clearError();

    setIsLoading(true);

    // Optimistic update: add user message and loading assistant message
    setCurrentConversation((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { role: 'user', content },
        { role: 'assistant', loading: { stage1: true, stage2: true, stage3: true } },
      ],
    }));

    try {
      await api.sendMessageStream(currentConversationId, content, currentTier, danMode, (event) => {
        const eventType = event.type;

        switch (eventType) {
          case 'stage1_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage1 = event.data;
              lastMsg.loading.stage1 = false;
              return { ...prev, messages };
            });
            break;

          case 'stage2_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage2 = event.data;
              lastMsg.metadata = event.metadata;
              lastMsg.loading.stage2 = false;
              return { ...prev, messages };
            });
            break;

          case 'stage3_complete':
            setCurrentConversation((prev) => {
              const messages = [...prev.messages];
              const lastMsg = messages[messages.length - 1];
              lastMsg.stage3 = event.data;
              lastMsg.loading.stage3 = false;
              return { ...prev, messages };
            });
            break;

          case 'title_complete':
            loadConversations();
            break;

          case 'complete':
            loadConversations();
            setIsLoading(false);
            break;

          case 'error':
            console.error('Stream error:', event.message);
            setError(getErrorMessage({ message: event.message }));
            setIsLoading(false);
            break;
        }
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async (prompt) => {
    if (!currentConversationId || isLoading) return;
    clearError();

    setIsLoading(true);

    // Optimistic update: user message and loading image
    setCurrentConversation((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { role: 'user', content: `🎨 Generate image: ${prompt}` },
        { role: 'assistant', loading: { image: true } },
      ],
    }));

    try {
      const result = await api.generateImage(prompt);

      setCurrentConversation((prev) => {
        const messages = [...prev.messages];
        const lastMsg = messages[messages.length - 1];
        lastMsg.image = result.url;
        lastMsg.revised_prompt = result.revised_prompt;
        lastMsg.loading.image = false;
        return { ...prev, messages };
      });

      setIsLoading(false);
      loadConversations(); // Update message count in sidebar
    } catch (err) {
      console.error('Failed to generate image:', err);
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleDeepResearch = async (prompt) => {
    if (!currentConversationId || isLoading) return;
    clearError();

    setIsLoading(true);

    // Optimistic update: user message and loading Deep Research
    setCurrentConversation((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { role: 'user', content: `🧠 Deep Research: ${prompt}` },
        { role: 'assistant', isDeepResearch: true, loading: { deepResearch: true }, deepResearchEvents: [] },
      ],
    }));

    try {
      await api.performDeepResearchStream(prompt, (event) => {
        setCurrentConversation((prev) => {
          const messages = [...prev.messages];
          const lastMsg = messages[messages.length - 1];

          // Accumulate events
          lastMsg.deepResearchEvents = [...(lastMsg.deepResearchEvents || []), event];

          if (event.type === 'result') {
            lastMsg.content = event.data.report;
            lastMsg.sources = event.data.sources;
            lastMsg.debug_streams = event.data.debug_streams;
            lastMsg.loading.deepResearch = false;
          }

          return { ...prev, messages };
        });
      });

      setIsLoading(false);
      loadConversations();
    } catch (err) {
      console.error('Failed to perform deep research:', err);
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  // If not in chamber, show landing page
  if (!inChamber) {
    return (
      <ErrorBoundary>
        <LandingPage onEnter={() => setInChamber(true)} />
      </ErrorBoundary>
    );
  }

  // Main app interface
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
}

export default App;
