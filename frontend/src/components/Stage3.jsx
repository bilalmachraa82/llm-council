import ReactMarkdown from 'react-markdown';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) {
    return null;
  }

  // Get persona info or fallback
  const persona = finalResponse.persona || {
    name: finalResponse.model.split('/')[1] || finalResponse.model,
    title: 'Chairman',
    emoji: '👑',
    avatar: null
  };

  return (
    <div className="stage stage3">
      <h3 className="stage-title">Stage 3: Final Council Answer</h3>
      <div className="final-response">
        <div className="chairman-header">
          {persona.avatar ? (
            <img
              src={persona.avatar}
              alt={persona.name}
              className="chairman-avatar"
            />
          ) : (
            <span className="chairman-emoji">{persona.emoji}</span>
          )}
          <div className="chairman-info">
            <span className="chairman-name">{persona.name}</span>
            <span className="chairman-title">{persona.title}</span>
          </div>
          <span className="chairman-badge">Chairman</span>
        </div>
        <div className="final-text markdown-content">
          <ReactMarkdown>{finalResponse.response}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
