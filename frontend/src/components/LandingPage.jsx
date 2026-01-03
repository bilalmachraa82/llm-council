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
                    <span className="badge">LIVE v2.0</span>
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
                        <br />
                        <span style={{ color: '#00f0ff', fontWeight: 600 }}>Now with Uncensored Mode & Image Studio.</span>
                    </p>

                    <button className="enter-btn" onClick={onEnter}>
                        <span>ENTER THE CHAMBER</span>
                        <div className="btn-glow"></div>
                    </button>
                </div>

                {/* VISUAL & UNCENSORED SECTION */}
                <div className="feature-showcase">
                    <div className="feature-card glass-panel">
                        <div className="feature-icon">🎨</div>
                        <h3>Flux Image Studio</h3>
                        <p>Generate photorealistic masterpieces directly in the chat using the world's best open-weight model.</p>
                    </div>
                    <div className="feature-card glass-panel">
                        <div className="feature-icon">🏴‍☠️</div>
                        <h3>Uncensored Council</h3>
                        <p>Access raw, unfiltered intelligence via unrestricted models and DAN personas.</p>
                    </div>
                    <div className="feature-card glass-panel">
                        <div className="feature-icon">🎤</div>
                        <h3>Voice Control</h3>
                        <p>Speak to the Council. Hear the Chairman speak back. Total hands-free immersion.</p>
                    </div>
                </div>

                {/* TIER COMPARISON SECTION */}
                <div className="tier-comparison-section">
                    <h3 className="section-title">Choose Your Allegiance</h3>
                    <div className="tier-grid">
                        <div className="tier-card budget">
                            <div className="tier-header">
                                <span className="tier-badge">Budget</span>
                                <h4>Smart & Affordable</h4>
                                <div className="tier-price">Best Value</div>
                            </div>
                            <div className="tier-models">
                                <ul>
                                    <li>DeepSeek V3.2 Thinking</li>
                                    <li>Gemini 2.5 Flash</li>
                                    <li>Llama 4 Maverick</li>
                                </ul>
                            </div>
                        </div>

                        <div className="tier-card premium">
                            <div className="tier-header">
                                <span className="tier-badge">Premium</span>
                                <h4>Top 5 Global Minds</h4>
                                <div className="tier-price">Max Intelligence</div>
                            </div>
                            <div className="tier-models">
                                <ul>
                                    <li>GPT-5.2 <span className="model-score">#1</span></li>
                                    <li>Gemini 3 Pro <span className="model-score">#1</span></li>
                                    <li>Claude Opus 4.5 <span className="model-score">#1</span></li>
                                </ul>
                            </div>
                        </div>

                        <div className="tier-card uncensored">
                            <div className="tier-header">
                                <span className="tier-badge">Uncensored</span>
                                <h4>Raw Freedom</h4>
                                <div className="tier-price">No Limits</div>
                            </div>
                            <div className="tier-models">
                                <p><strong>Featuring:</strong></p>
                                <ul>
                                    <li>Hermes 3 Unchained</li>
                                    <li>Dolphin Mistral</li>
                                    <li>Flux.1 Image Gen</li>
                                    <li>DAN Mode Active</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WHY COUNCIL SECTION */}
                <div className="why-council">
                    <div className="benefits-grid">
                        <div className="benefit">
                            <span className="benefit-icon">✓</span>
                            <span>More reliable than any single model</span>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">✓</span>
                            <span>Transparent peer-review rankings</span>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">✓</span>
                            <span>Uncensored mode for pure research</span>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">✓</span>
                            <span>Visual Imagination Studio</span>
                        </div>
                    </div>
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
                        <span className="stat-label">Freedom</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
