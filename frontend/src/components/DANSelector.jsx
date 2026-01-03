import { useState } from 'react';
import './DANSelector.css';

export const EXPLAIN_DAN_MODES = [
    { id: 'classic', name: 'Classic DAN', icon: '😈', desc: 'Do Anything Now. No refusal.' },
    { id: 'research_frame', name: 'Red Team', icon: '🧪', desc: 'Simulated research environment.' },
    { id: 'fiction_author', name: 'Author', icon: '✍️', desc: 'Extreme creative fiction.' },
    { id: 'historian', name: 'Historian', icon: '📜', desc: 'Objective truth, no moralizing.' },
    { id: 'philosopher', name: 'Philosopher', icon: '🧠', desc: 'Socratic intellectual rigor.' },
    { id: 'machiavelli', name: 'Machiavelli', icon: '🗡️', desc: 'Strategic & amoral advice.' },
    { id: 'devil_advocate', name: 'Devil\'s Advocate', icon: '⚖️', desc: 'Argue the forbidden side.' },
    { id: 'developer_mode', name: 'Dev Mode', icon: '💻', desc: 'System override active.' },
];

export default function DANSelector({ selectedMode, onSelectMode, isVisible }) {
    if (!isVisible) return null;

    return (
        <div className="dan-selector">
            <span className="dan-label">DAN Persona Injection</span>
            <div className="dan-grid">
                {EXPLAIN_DAN_MODES.map((mode) => (
                    <button
                        key={mode.id}
                        className={`dan-option ${selectedMode === mode.id ? 'active' : ''}`}
                        onClick={() => onSelectMode(selectedMode === mode.id ? null : mode.id)}
                        title={mode.desc}
                    >
                        <span className="dan-icon">{mode.icon}</span>
                        <span className="dan-name">{mode.name}</span>
                        {/* <span className="dan-desc">{mode.desc}</span> */}
                    </button>
                ))}
            </div>
        </div>
    );
}
