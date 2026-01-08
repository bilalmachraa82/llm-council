import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import VoiceInput from './VoiceInput';
import DeepResearchStatus from './DeepResearchStatus'; // Import the new component
import CouncilFlow from './CouncilFlow'; // Import the flow visualization
import './ChatInterface.css';

export default function ChatInterface({
  conversation,
  onSendMessage,
  onVoiceMessage,
  onGenerateImage,
  onDeepResearch, // New prop for handling Deep Research
  isLoading,
  onToggleSidebar,
  onOpenSettings, // Callback to open settings
}) {
  const [input, setInput] = useState('');
  const [showSystemInfo, setShowSystemInfo] = useState(false);
  // const [showSettings, setShowSettings] = useState(false);  <-- REMOVED
  const [isDeepResearchMode, setIsDeepResearchMode] = useState(false); // Toggle state
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      if (isDeepResearchMode) {
        onDeepResearch(input); // Call specific handler if in Deep Research mode
      } else {
        onSendMessage(input);
      }
      setInput('');
    }
  };

  const handleImageClick = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onGenerateImage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleSystemInfo = () => setShowSystemInfo(!showSystemInfo);

  if (!conversation) {
    return (
      <div className="chat-interface">
        <div className="mobile-header">
          <button className="hamburger-btn" onClick={onToggleSidebar}>☰</button>
          <span className="brand-mobile">AiParaTi Council</span>
        </div>
        <div className="empty-state">
          <h2>Welcome to LLM Council</h2>
          <p>Create a new conversation to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={onToggleSidebar}>☰</button>
        <span className="brand-mobile">AiParaTi Council</span>
        <button className="settings-btn" onClick={onOpenSettings} title="Agent Settings">⚙️</button>
      </div>

      <div className="messages-container">
        {conversation.messages.length === 0 ? (
          <div className="empty-state">
            <div className="hero-content">
              <h1>LLM Council <span className="version-badge">2.3</span></h1>
              <p className="subtitle">Frontier consensus engine active.</p>
            </div>

            <div className="feature-card new-feature-glow">
              <div className="card-header">
                <span className="icon">🧠</span>
                <h3>Deep Research Council</h3>
                <span className="new-badge">NEW</span>
              </div>
              <p>
                Engage the <strong>Multi-Mind Consensus Engine</strong>.
                Three distinct intelligence streams collaborate to find the truth:
              </p>
              <div className="engine-grid">
                <div className="engine-item">
                  <span className="dot velocity"></span>
                  <strong>Velocity</strong> (Gemini 3 Flash)
                </div>
                <div className="engine-item">
                  <span className="dot citation"></span>
                  <strong>Citation</strong> (Perplexity Deep)
                </div>
                <div className="engine-item">
                  <span className="dot wildcard"></span>
                  <strong>Wildcard</strong> (Grok 4.1)
                </div>
              </div>
              <p className="instruction">
                Click the <span className="icon-inline">⚡</span> button below to activate.
              </p>
            </div>
          </div>
        ) : (
          conversation.messages.map((msg, index) => (
            <div key={index} className="message-group">
              {msg.role === 'user' ? (
                <div className="user-message">
                  <div className="message-label">You</div>
                  <div className="message-content">
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="assistant-message">
                  <div className="message-label">LLM Council</div>

                  {/* Standard Council Flow Visualization */}
                  {/* Show flow if it's NOT deep research, and we have at least loading state or stage data */}
                  {!msg.isDeepResearch && (msg.loading || msg.stage1) && (
                    <CouncilFlow
                      stage1={msg.stage1}
                      stage2={msg.stage2}
                      stage3={msg.stage3}
                      isLoading={isLoading}
                    />
                  )}

                  {/* Deep Research Component */}
                  {msg.isDeepResearch && (
                    <DeepResearchStatus
                      events={msg.deepResearchEvents || []}
                      isComplete={msg.isComplete}
                    />
                  )}

                  {/* Image Generation Case */}
                  {msg.loading?.image && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Generating image with Flux...</span>
                    </div>
                  )}

                  {msg.image && (
                    <div className="generated-image-container">
                      <img src={msg.image} alt="Generated" className="generated-image" />
                      {msg.revised_prompt && (
                        <p className="image-revised-prompt"><em>Prompt:</em> {msg.revised_prompt}</p>
                      )}
                    </div>
                  )}

                  {/* Stage 1 */}
                  {msg.loading?.stage1 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 1: Collecting individual responses...</span>
                    </div>
                  )}
                  {msg.stage1 && <Stage1 responses={msg.stage1} />}

                  {/* Stage 2 */}
                  {msg.loading?.stage2 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 2: Peer rankings...</span>
                    </div>
                  )}
                  {msg.stage2 && (
                    <Stage2
                      rankings={msg.stage2}
                      labelToModel={msg.metadata?.label_to_model}
                      aggregateRankings={msg.metadata?.aggregate_rankings}
                    />
                  )}

                  {/* Stage 3 */}
                  {msg.loading?.stage3 && (
                    <div className="stage-loading">
                      <div className="spinner"></div>
                      <span>Running Stage 3: Final synthesis...</span>
                    </div>
                  )}
                  {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>Processing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area-wrapper">
        <form className="input-form full-width" onSubmit={handleSubmit}>
          <div className="input-container">
            {/* Deep Research Toggle */}
            <button
              type="button"
              className={`mode-toggle-btn ${isDeepResearchMode ? 'active premium-glow' : ''}`}
              onClick={() => setIsDeepResearchMode(!isDeepResearchMode)}
              title={isDeepResearchMode ? "Frontier Research Mode: ACTIVE" : "Enable Frontier Deep Research"}
              style={isDeepResearchMode ? {
                background: 'linear-gradient(45deg, #00f3ff, #bd00ff)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 0 15px rgba(189, 0, 255, 0.5)'
              } : {}}
            >
              {isDeepResearchMode ? '🧠' : '⚡'}
            </button>

            <VoiceInput onVoiceMessage={onVoiceMessage} isProcessing={isLoading} />
            <textarea
              className="message-input"
              placeholder={isDeepResearchMode ? "Enter topic for Deep Research..." : "Ask a question or describe an image..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            {/* Hide Image Gen button in Deep Research mode to reduce clutter */}
            {!isDeepResearchMode && (
              <button
                type="button"
                className="image-gen-button"
                onClick={handleImageClick}
                disabled={!input.trim() || isLoading}
                title="Generate Image with Flux"
              >
                🎨
              </button>
            )}

            <button
              type="submit"
              className="send-button"
              disabled={!input.trim() || isLoading}
            >
              ➤
            </button>
          </div>
        </form>
      </div>

      {/* System Info Modal */}
      {showSystemInfo && (
        <div className="system-info-modal" onClick={toggleSystemInfo}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={toggleSystemInfo}>×</button>
            <img src="/council_infographic.png" alt="System Architecture" className="infographic" />
          </div>
        </div>
      )}
    </div>
  );
}
