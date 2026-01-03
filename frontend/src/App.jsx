import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import LandingPage from './components/LandingPage';
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
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    try {
      const conv = await api.getConversation(id);
      setCurrentConversation(conv);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation();
      setConversations([newConv, ...conversations]);
      setCurrentConversationId(newConv.id);
      setCurrentConversation(newConv); // Set directly to render chat interface immediately
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleSelectConversation = (id) => {
    setCurrentConversationId(id);
  };

  const handleVoiceMessage = async (audioBlob) => {
    if (!currentConversationId || isLoading) return;

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
            setIsLoading(false);
            break;
        }
      });
    } catch (error) {
      console.error('Failed to send voice message:', error);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!currentConversationId || isLoading) return;

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
            setIsLoading(false);
            break;
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async (prompt) => {
    if (!currentConversationId || isLoading) return;

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
    } catch (error) {
      console.error('Failed to generate image:', error);
      setIsLoading(false);
    }
  };

  // If not in chamber, show landing page
  if (!inChamber) {
    return <LandingPage onEnter={() => setInChamber(true)} />;
  }

  // Main app interface
  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        currentTier={currentTier}
        onTierChange={setCurrentTier}
        danMode={danMode}
        onDanModeChange={setDanMode}
      />
      <main className="main-content">
        <ChatInterface
          conversation={currentConversation}
          onSendMessage={handleSendMessage}
          onVoiceMessage={handleVoiceMessage}
          onGenerateImage={handleGenerateImage}
          isLoading={isLoading}
        />
      </main>
    </div>
  );
}

export default App;
