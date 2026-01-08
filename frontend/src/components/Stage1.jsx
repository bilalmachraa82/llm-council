import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage1.css';

export default function Stage1({ responses }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!responses || responses.length === 0) {
    return null;
  }

  // Helper to get persona display name
  const getPersonaDisplay = (resp) => {
    if (resp.persona) {
      return `${resp.persona.emoji} ${resp.persona.name}`;
    }
    // Fallback to model name
    return resp.model.split('/')[1] || resp.model;
  };

  // Helper to get full persona info
  const getPersonaInfo = (resp) => {
    if (resp.persona) {
      return {
        name: resp.persona.name,
        title: resp.persona.title,
        emoji: resp.persona.emoji,
        avatar: resp.persona.avatar,
        expertise: resp.persona.expertise,
        personality: resp.persona.personality
      };
    }
    return {
      name: resp.model.split('/')[1] || resp.model,
      title: 'Council Member',
      emoji: '🤖',
      avatar: null,
      expertise: '',
      personality: ''
    };
  };

  const activeResponse = responses[activeTab];
  const activePersona = getPersonaInfo(activeResponse);

  return (
    <div className="stage stage1">
      <h3 className="stage-title">Stage 1: Council Responses</h3>

      <div className="tabs">
        {responses.map((resp, index) => (
          <button
            key={index}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
            title={resp.persona?.expertise || resp.model}
          >
            {getPersonaDisplay(resp)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        <div className="persona-header">
          {activePersona.avatar ? (
            <img
              src={activePersona.avatar}
              alt={activePersona.name}
              className="persona-avatar"
            />
          ) : (
            <span className="persona-emoji">{activePersona.emoji}</span>
          )}
          <div className="persona-info">
            <div className="persona-name">{activePersona.name}</div>
            <div className="persona-title">{activePersona.title}</div>
          </div>
        </div>
        {activePersona.expertise && (
          <div className="persona-expertise">
            <strong>Expertise:</strong> {activePersona.expertise}
          </div>
        )}
        <div className="response-text markdown-content">
          <ReactMarkdown>{activeResponse.response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
