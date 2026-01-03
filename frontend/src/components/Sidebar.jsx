import { useState } from 'react';
import TierSelector from './TierSelector';
import DANSelector from './DANSelector';
import AuthModal from './AuthModal';
import { useAuth } from '../AuthContext';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  currentTier,
  onTierChange,
  danMode,
  onDanModeChange,
}) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>LLM Council</h1>
        <TierSelector currentTier={currentTier} onTierChange={onTierChange} />

        <DANSelector
          selectedMode={danMode}
          onSelectMode={onDanModeChange}
          isVisible={currentTier === 'uncensored'}
        />

        <button className="new-conversation-btn" onClick={onNewConversation}>
          + New Conversation
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">No conversations yet</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''
                }`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="conversation-title">
                {conv.title || 'New Conversation'}
              </div>
              <div className="conversation-meta">
                {conv.message_count} messages
              </div>
            </div>
          ))
        )}
      </div>

      {/* Auth Section */}
      <div className="sidebar-footer">
        {isAuthenticated ? (
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <button className="logout-btn" onClick={signOut}>Sign Out</button>
          </div>
        ) : (
          <button className="login-btn" onClick={() => setShowAuthModal(true)}>
            Sign In / Sign Up
          </button>
        )}
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
