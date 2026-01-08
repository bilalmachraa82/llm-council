import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage2.css';

// Helper to get persona display info
function getPersonaFromRank(rank) {
  if (rank.persona) {
    return {
      name: rank.persona.name,
      emoji: rank.persona.emoji,
      avatar: rank.persona.avatar
    };
  }
  return {
    name: rank.model.split('/')[1] || rank.model,
    emoji: '🤖',
    avatar: null
  };
}

function deAnonymizeText(text, labelToModel) {
  if (!labelToModel) return text;

  let result = text;
  // Replace each "Response X" with the actual model name
  Object.entries(labelToModel).forEach(([label, model]) => {
    const modelShortName = model.split('/')[1] || model;
    result = result.replace(new RegExp(label, 'g'), `**${modelShortName}**`);
  });
  return result;
}

export default function Stage2({ rankings, labelToModel, aggregateRankings }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!rankings || rankings.length === 0) {
    return null;
  }

  const activeRank = rankings[activeTab];
  const activePersona = getPersonaFromRank(activeRank);

  return (
    <div className="stage stage2">
      <h3 className="stage-title">Stage 2: Peer Rankings</h3>

      <h4>Raw Evaluations</h4>
      <p className="stage-description">
        Each council member evaluated all responses (anonymized) to ensure unbiased critique.
      </p>

      <div className="tabs">
        {rankings.map((rank, index) => {
          const p = getPersonaFromRank(rank);
          return (
            <button
              key={index}
              className={`tab ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
              title={p.name}
            >
              {p.emoji} {p.name}
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        <div className="persona-header">
          {activePersona.avatar ? (
            <img
              src={activePersona.avatar}
              alt={activePersona.name}
              className="persona-avatar-small"
            />
          ) : (
            <span className="persona-emoji-small">{activePersona.emoji}</span>
          )}
          <span className="persona-name-small">{activePersona.name}</span>
        </div>

        <div className="ranking-content markdown-content">
          <ReactMarkdown>
            {deAnonymizeText(activeRank.ranking, labelToModel)}
          </ReactMarkdown>
        </div>

        {activeRank.parsed_ranking && activeRank.parsed_ranking.length > 0 && (
          <div className="parsed-ranking">
            <strong>Extracted Ranking:</strong>
            <ol>
              {activeRank.parsed_ranking.map((label, i) => (
                <li key={i}>
                  {labelToModel && labelToModel[label]
                    ? labelToModel[label].split('/')[1] || labelToModel[label]
                    : label}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {aggregateRankings && aggregateRankings.length > 0 && (
        <div className="aggregate-rankings">
          <h4>Aggregate Rankings (Street Cred)</h4>
          <div className="aggregate-list">
            {aggregateRankings.map((agg, index) => (
              <div key={index} className="aggregate-item">
                <span className={`rank-position position-${index + 1}`}>#{index + 1}</span>
                <span className="rank-model">
                  {agg.model.split('/')[1] || agg.model}
                </span>
                <span className="rank-score">
                  Avg: {agg.average_rank.toFixed(2)}
                </span>
                <span className="rank-count">
                  ({agg.rankings_count} votes)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
