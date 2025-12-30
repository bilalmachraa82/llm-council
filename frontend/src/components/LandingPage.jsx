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

                    <p className="tagline">
                        5 AI models. 3 stages. 1 optimal answer.
                    </p>

                    <button className="enter-btn" onClick={onEnter}>
                        <span>ENTER THE CHAMBER</span>
                        <div className="btn-glow"></div>
                    </button>
                </div>

                {/* HOW IT WORKS SECTION */}
                <div className="how-it-works">
                    <h3 className="section-title">How It Works</h3>
                    <div className="stages-grid">
                        <div className="stage-card">
                            <div className="stage-number">1</div>
                            <h4>Response Collection</h4>
                            <p>5 top-tier AI models answer your question in parallel. Each model brings unique reasoning and perspective.</p>
                        </div>
                        <div className="stage-arrow">→</div>
                        <div className="stage-card">
                            <div className="stage-number">2</div>
                            <h4>Blind Ranking</h4>
                            <p>Models rank each other's responses anonymously. No bias, no favoritism—pure quality assessment.</p>
                        </div>
                        <div className="stage-arrow">→</div>
                        <div className="stage-card">
                            <div className="stage-number">3</div>
                            <h4>Chairman Synthesis</h4>
                            <p>A designated "Chairman" model synthesizes the best insights into one coherent, optimal answer.</p>
                        </div>
                    </div>
                </div>

                {/* WHY COUNCIL SECTION */}
                <div className="why-council">
                    <h3 className="section-title">Why Council?</h3>
                    <div className="benefits-grid">
                        <div className="benefit">
                            <span className="benefit-icon">✓</span>
                            <span>More reliable than any single model</span>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">✓</span>
                            <span>Transparent reasoning via rankings</span>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">✓</span>
                            <span>Choose Premium or Budget tier</span>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">✓</span>
                            <span>Voice Mode for hands-free interaction</span>
                        </div>
                    </div>
                </div>

                {/* MODELS SHOWCASE */}
                <div className="models-showcase">
                    <p className="models-label">Powered by</p>
                    <p className="models-list">Gemini 2.5 • Claude 4 • GPT-4o • Llama 3.3 • DeepSeek V3</p>
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
