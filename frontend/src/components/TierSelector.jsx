import { useState } from 'react';
import './TierSelector.css';

export default function TierSelector({ currentTier, onTierChange }) {
    const [isOpen, setIsOpen] = useState(false);

    const tiers = [
        {
            id: 'pro',
            name: 'Premium',
            icon: '👑',
            description: 'Gemini 3.0 • Grok 4.1 • Claude Opus • GPT-5.2 • Qwen3',
            cost: '~$50/query',
        },
        {
            id: 'budget',
            name: 'Budget',
            icon: '⚡',
            description: 'GLM-4.7 • DeepSeek V3.2 • Qwen3 • Kimi K2 • Llama 4',
            cost: '~$2/query',
        },
    ];

    const activeTier = tiers.find((t) => t.id === currentTier) || tiers[0];

    return (
        <div className="tier-selector">
            <button className="tier-toggle" onClick={() => setIsOpen(!isOpen)}>
                <span className="tier-icon">{activeTier.icon}</span>
                <span className="tier-name">{activeTier.name}</span>
                <span className="tier-chevron">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="tier-dropdown">
                    {tiers.map((tier) => (
                        <button
                            key={tier.id}
                            className={`tier-option ${tier.id === currentTier ? 'active' : ''}`}
                            onClick={() => {
                                onTierChange(tier.id);
                                setIsOpen(false);
                            }}
                        >
                            <div className="tier-option-header">
                                <span className="tier-option-icon">{tier.icon}</span>
                                <span className="tier-option-name">{tier.name}</span>
                                <span className="tier-option-cost">{tier.cost}</span>
                            </div>
                            <p className="tier-option-description">{tier.description}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
