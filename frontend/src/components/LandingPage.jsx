import { useState, useEffect } from 'react';
import './LandingPage.css';

export default function LandingPage({ onEnter }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="landing-container active">
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
                    <div className="infographic_container">
                        <img
                            src="/council_infographic.png"
                            alt="The Council Process: User Query -> 5 Models -> Analysis -> Chairman Synthesis -> Optimal Answer"
                            className="council-infographic"
                        />
                    </div>
                </div>

                {/* TIER COMPARISON SECTION */}
                <div className="tier-comparison-section">
                    <h3 className="section-title">Choose Your Council</h3>
                    <div className="tier-grid">
                        <div className="tier-card budget">
                            <div className="tier-header">
                                <span className="tier-badge">Budget</span>
                                <h4>Standard Council</h4>
                                <div className="tier-price">Low Cost</div>
                            </div>
                            <div className="tier-models">
                                <p><strong>Powered by:</strong></p>
                                <ul>
                                    <li>GPT-4o Mini</li>
                                    <li>Gemini 2.5 Flash-Lite</li>
                                    <li>Claude 3 Haiku</li>
                                    <li>Grok 3 Fast</li>
                                </ul>
                            </div>
                        </div>

                        <div className="tier-card premium">
                            <div className="tier-header">
                                <span className="tier-badge">Premium</span>
                                <h4>Elite Council</h4>
                                <div className="tier-price">Best Quality</div>
                            </div>
                            <div className="tier-models">
                                <p><strong>Powered by:</strong></p>
                                <ul>
                                    <li>Gemini 3 Pro</li>
                                    <li>Claude Opus 4.5</li>
                                    <li>GPT-5.2</li>
                                    <li>Qwen 3 Max</li>
                                    <li>Grok 4.1</li>
                                </ul>
                            </div>
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
                    <p className="models-brand">AiParaTi</p>
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
