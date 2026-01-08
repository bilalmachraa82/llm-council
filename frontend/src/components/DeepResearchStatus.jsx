import React, { useState, useEffect, useRef } from 'react';
import './DeepResearchStatus.css';

/**
 * DEEP RESEARCH COUNCIL 2.0 - ULTRATHINK UI
 * Visualizes the 4-phase consensus process:
 * 1. Planning (Lead)
 * 2. Parallel Search (Velocity, Citation, Wildcard)
 * 3. Conflict Resolution (Skeptic)
 * 4. Synthesis (Editor)
 */
export default function DeepResearchStatus({ events, isComplete }) {
    const [activePhase, setActivePhase] = useState('idle'); // idle, planning, council, skeptic, editor, complete
    const [logs, setLogs] = useState([]);
    const [streamData, setStreamData] = useState({ gemini: '', perplexity: '', grok: '' });
    const terminalRef = useRef(null);

    // Parse events to determine phase
    useEffect(() => {
        if (!events || events.length === 0) return;

        // Process latest event
        const lastEvent = events[events.length - 1];

        // Add to logs
        if (lastEvent.type === 'status') {
            const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLogs(prev => [...prev, { time: timestamp, msg: lastEvent.msg }]);

            // AUTO-DETECT PHASE based on message keywords
            const msg = lastEvent.msg.toLowerCase();
            if (msg.includes('lead researcher')) setActivePhase('planning');
            else if (msg.includes('parallel streams')) setActivePhase('council');
            else if (msg.includes('skeptic')) setActivePhase('skeptic');
            else if (msg.includes('chief editor')) setActivePhase('editor');
            else if (msg.includes('mission complete')) setActivePhase('complete');
        }

        // Capture Stream Data
        if (lastEvent.type === 'result') {
            setActivePhase('complete');
            if (lastEvent.data.debug_streams) {
                setStreamData(lastEvent.data.debug_streams);
            }
        }

        // Auto-scroll terminal
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [events]);

    return (
        <div className="deep-research-container">
            {/* HEADER */}
            <div className="research-header">
                <div className="title-group">
                    <div className={`council-pulse ${activePhase === 'complete' ? 'pulse-green' : isComplete ? 'pulse-gold' : ''}`}></div>
                    <h3>Deep Research Council 2.0</h3>
                </div>
                <div className="status-badge">
                    {activePhase === 'complete' ? 'SYSTEM READY' : 'PROCESSING'}
                </div>
            </div>

            {/* PIPELINE VISUALIZATION */}
            <div className="pipeline-viz">

                {/* PHASE 1: LEAD */}
                <div className="node-row">
                    <div className={`node ${activePhase === 'planning' || activePhase === 'complete' ? 'active' : ''}`}>
                        <div className="node-icon">🧠</div>
                        <div className="node-label">Lead Planner</div>
                        <div className="node-model">Gemini 3 Pro</div>
                    </div>
                </div>

                <div className="pipeline-connector"></div>

                {/* PHASE 2: THE COUNCIL (PARALLEL) */}
                <div className="stream-container">
                    {/* Velocity */}
                    <div className={`stream-node velocity ${activePhase === 'council' || activePhase === 'complete' ? 'active' : ''}`}>
                        <div className="node-icon">🚀</div>
                        <div className="node-label">Velocity</div>
                        <div className="node-model">Gemini 3 Flash</div>
                    </div>

                    {/* Citation */}
                    <div className={`stream-node citation ${activePhase === 'council' || activePhase === 'complete' ? 'active' : ''}`}>
                        <div className="node-icon">📚</div>
                        <div className="node-label">Citation</div>
                        <div className="node-model">Sonar Deep</div>
                    </div>

                    {/* Wildcard */}
                    <div className={`stream-node wildcard ${activePhase === 'council' || activePhase === 'complete' ? 'active' : ''}`}>
                        <div className="node-icon">⚡</div>
                        <div className="node-label">Wildcard</div>
                        <div className="node-model">Grok 4.1</div>
                    </div>
                </div>

                <div className="pipeline-connector"></div>

                {/* PHASE 3: SKEPTIC */}
                <div className="node-row">
                    <div className={`node ${activePhase === 'skeptic' || activePhase === 'complete' ? 'active' : ''}`} style={{ borderColor: '#ff4800' }}>
                        <div className="node-icon">🛡️</div>
                        <div className="node-label">The Skeptic</div>
                        <div className="node-model">Claude 3.5 Sonnet</div>
                    </div>
                </div>

                <div className="pipeline-connector"></div>

                {/* PHASE 4: EDITOR */}
                <div className="node-row">
                    <div className={`node ${activePhase === 'editor' || activePhase === 'complete' ? 'active' : ''}`}>
                        <div className="node-icon">✍️</div>
                        <div className="node-label">Chief Editor</div>
                        <div className="node-model">Gemini 3 Pro</div>
                    </div>
                </div>

            </div>

            {/* TERMINAL LOGS */}
            <div className="terminal-window" ref={terminalRef}>
                {logs.map((log, idx) => (
                    <div key={idx} className="log-entry">
                        <span className="log-time">[{log.time}]</span>
                        <span className="log-msg">{log.msg}</span>
                    </div>
                ))}
                {activePhase !== 'complete' && <div className="typing-cursor">_</div>}
            </div>

            {/* DEBUG STREAMS (Shown at end) */}
            {(activePhase === 'complete' || activePhase === 'editor') && (
                <details>
                    <summary style={{ cursor: 'pointer', opacity: 0.7, fontSize: '0.8rem', marginTop: '1rem' }}>View Raw Council Deliberations</summary>
                    <div className="stream-grid">
                        <div className="stream-output" style={{ borderColor: 'var(--neon-blue)' }}>
                            <h4>Velocity Stream</h4>
                            <div className="raw-content">{streamData.gemini || 'Waiting for data...'}</div>
                        </div>
                        <div className="stream-output" style={{ borderColor: 'var(--neon-gold)' }}>
                            <h4>Citation Stream</h4>
                            <div className="raw-content">{streamData.perplexity || 'Waiting for data...'}</div>
                        </div>
                        <div className="stream-output" style={{ borderColor: 'var(--neon-purple)' }}>
                            <h4>Wildcard Stream</h4>
                            <div className="raw-content">{streamData.grok || 'Waiting for data...'}</div>
                        </div>
                    </div>
                </details>
            )}

        </div>
    );
}
