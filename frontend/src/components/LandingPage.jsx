import { useState, useEffect } from 'react';
import './LandingPage.css';

export default function LandingPage({ onEnter }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`landing-container ${mounted ? 'active' : ''}`}>
            <div className="grid-background"></div>

            <div className="landing-content">
                <div className="landing-header">
                    <span className="badge">BETA v1.0</span>
                    <span className="brand">AiParaTi</span>
                </div>

                <div className="landing-hero">
                    <div className="hero-visual">
                        <img
                            src="/council_hero_glass.png"
                            alt="The Glass Council"
                            className="glass-orb"
                        />
                        <div className="orb-glow"></div>
                    </div>

                    <h1 className="glitch-text" data-text="THE COUNCIL">THE COUNCIL</h1>
                    <h2 className="subtitle">Democracy of Intelligence</h2>

                    <p className="description">
                        Harness the cognitive power of the world's most advanced synthetic minds.
                        <br />
                        <span className="models">Gemini 3.0 • Grok 4.1 • Claude Opus • GPT-5.2 • Qwen3</span>
                    </p>

                    <button className="enter-btn" onClick={onEnter}>
                        <span>ENTER THE CHAMBER</span>
                        <div className="btn-glow"></div>
                    </button>
                </div>
                <div className="landing-footer">
                    <div className="stat">
                        <span className="stat-val">3</span>
                        <span className="stat-label">Stages</span>
                    </div>
                    <div className="stat">
                        <span className="stat-val">5</span>
                        <span className="stat-label">Models</span>
                    </div>
                    <div className="stat">
                        <span className="stat-val">∞</span>
                        <span className="stat-label">Possibilities</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
