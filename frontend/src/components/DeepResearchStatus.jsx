import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import './DeepResearchStatus.css';

/**
 * Deep Research Status Component
 * Visualizes the 5-agent workflow: Lead -> Search -> Analyst/Trend -> Skeptic -> Editor
 */
const DeepResearchStatus = ({ events, isComplete }) => {
    const [activeAgent, setActiveAgent] = useState('lead');
    const [logs, setLogs] = useState([]);
    const [report, setReport] = useState(null);
    const [sources, setSources] = useState([]);
    const [verificationLog, setVerificationLog] = useState('');
    const logContainerRef = useRef(null);

    useEffect(() => {
        if (events && events.length > 0) {
            const lastEvent = events[events.length - 1];

            if (lastEvent.type === 'status') {
                setLogs(prev => [...prev, lastEvent.msg]);

                // Simple logic to guess active agent based on message content
                const msg = lastEvent.msg.toLowerCase();
                if (msg.includes('lead')) setActiveAgent('lead');
                else if (msg.includes('search')) setActiveAgent('lead'); // Search is part of Lead's phase usually
                else if (msg.includes('analyst') || msg.includes('hunter')) setActiveAgent('analyst');
                else if (msg.includes('skeptic')) setActiveAgent('skeptic');
                else if (msg.includes('editor')) setActiveAgent('editor');
            }
            else if (lastEvent.type === 'result') {
                setReport(lastEvent.data.report);
                setSources(lastEvent.data.sources || []);
                setVerificationLog(lastEvent.data.verification_log || '');
                setActiveAgent('done');
            }
        }
    }, [events]);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    if (report) {
        return (
            <div className="deep-research-result fade-in">
                <div className="research-header">
                    <h2><span className="icon">🧠</span> Deep Research Report</h2>
                    <div className="badge-verified">Verified by The Skeptic</div>
                </div>

                <div className="research-content markdown-body">
                    <ReactMarkdown>{report}</ReactMarkdown>
                </div>

                {sources.length > 0 && (
                    <div className="research-sources">
                        <h3>📚 Verified Sources</h3>
                        <div className="sources-grid">
                            {sources.map((src, i) => (
                                <a key={i} href={src.href} target="_blank" rel="noreferrer" className="source-card">
                                    <div className="source-title">{src.title}</div>
                                    <div className="source-url">{new URL(src.href).hostname}</div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {verificationLog && (
                    <div className="skeptic-log">
                        <h3>🛡️ Skeptic's Audit Log</h3>
                        <pre>{verificationLog}</pre>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="deep-research-status">
            <div className="agents-grid">
                <AgentCard
                    icon="🧠"
                    name="Lead Researcher"
                    role="Planning"
                    isActive={activeAgent === 'lead'}
                    isDone={activeAgent !== 'lead'}
                />
                <AgentCard
                    icon="📊"
                    name="Analyst / Hunter"
                    role="Extraction"
                    isActive={activeAgent === 'analyst'}
                    isDone={activeAgent === 'skeptic' || activeAgent === 'editor' || activeAgent === 'done'}
                />
                <AgentCard
                    icon="🛡️"
                    name="The Skeptic"
                    role="Verification"
                    isActive={activeAgent === 'skeptic'}
                    isDone={activeAgent === 'editor' || activeAgent === 'done'}
                />
                <AgentCard
                    icon="✍️"
                    name="Chief Editor"
                    role="Synthesis"
                    isActive={activeAgent === 'editor'}
                    isDone={activeAgent === 'done'}
                />
            </div>

            <div className="console-log" ref={logContainerRef}>
                {logs.map((log, i) => (
                    <div key={i} className="log-line">
                        <span className="log-timestamp">[{new Date().toLocaleTimeString()}]</span> {log}
                    </div>
                ))}
                {isComplete && !report && <div className="log-line success">Process Complete. Rendering...</div>}
                <div className="cursor-blink">_</div>
            </div>
        </div>
    );
};

const AgentCard = ({ icon, name, role, isActive, isDone }) => (
    <div className={`agent-card ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
        <div className="agent-icon-wrapper">
            <div className="agent-icon">{icon}</div>
            {isActive && <div className="spinner-ring"></div>}
        </div>
        <div className="agent-info">
            <div className="agent-name">{name}</div>
            <div className="agent-role">{role}</div>
        </div>
        <div className="status-dot"></div>
    </div>
);

export default DeepResearchStatus;
