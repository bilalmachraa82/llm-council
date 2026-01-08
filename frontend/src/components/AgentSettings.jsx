import { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import './AgentSettings.css';

export default function AgentSettings({ onClose }) {
    const { token, user } = useAuth();
    const [agents, setAgents] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedAgentKey, setSelectedAgentKey] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Edited state
    const [editForm, setEditForm] = useState({
        name: '',
        title: '',
        emoji: '',
        system_prompt: '',
        // future: aggressiveness, etc.
    });

    // Fetch agents on mount
    useEffect(() => {
        async function fetchAgents() {
            try {
                const data = await api.getAgents(token);
                setAgents(data);

                // Select first agent by default
                const keys = Object.keys(data);
                if (keys.length > 0) {
                    selectAgent(keys[0], data);
                }
            } catch (err) {
                console.error('Failed to load agents:', err);
            } finally {
                setLoading(false);
            }
        }

        if (token) {
            fetchAgents();
        }
    }, [token]);

    const selectAgent = (key, agentsMap = agents) => {
        if (hasChanges) {
            if (!window.confirm("You have unsaved changes. Discard them?")) return;
        }

        setSelectedAgentKey(key);
        const agent = agentsMap[key];
        setEditForm({
            name: agent.name || '',
            title: agent.title || '',
            emoji: agent.emoji || '🤖',
            system_prompt: agent.system_prompt || '', // Might be empty if default
        });
        setHasChanges(false);
    };

    const handleChange = (field, value) => {
        setEditForm(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!selectedAgentKey) return;

        try {
            // Prepare update payload
            // We only send the fields for the selected agent
            const updatePayload = {
                [selectedAgentKey]: {
                    name: editForm.name,
                    title: editForm.title,
                    emoji: editForm.emoji,
                    system_prompt: editForm.system_prompt
                }
            };

            await api.updateAgentSettings(updatePayload, token);

            // Update local state
            setAgents(prev => ({
                ...prev,
                [selectedAgentKey]: {
                    ...prev[selectedAgentKey],
                    ...updatePayload[selectedAgentKey]
                }
            }));

            setHasChanges(false);
            alert("Agent settings saved!");

        } catch (err) {
            console.error("Failed to save settings:", err);
            alert("Error saving settings. Please try again.");
        }
    };

    if (!token) {
        return (
            <div className="agent-settings-modal">
                <div className="settings-container">
                    <div className="settings-content" style={{ justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                        Please log in to customize agents.
                        <button className="btn-secondary" onClick={onClose} style={{ marginLeft: '20px' }}>Close</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="agent-settings-modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="settings-container">
                <div className="settings-header">
                    <h2>
                        <span style={{ fontSize: '1.5rem' }}>⚙️</span> Agent Customization
                    </h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="settings-content">
                    {/* Sidebar */}
                    <div className="agents-list">
                        {loading ? <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>Loading...</div> :
                            Object.entries(agents).map(([key, agent]) => (
                                <div
                                    key={key}
                                    className={`agent-item ${selectedAgentKey === key ? 'active' : ''}`}
                                    onClick={() => selectAgent(key)}
                                >
                                    {agent.avatar ? (
                                        <img src={agent.avatar} alt={agent.name} className="agent-item-avatar" />
                                    ) : (
                                        <div className="agent-item-emoji">{agent.emoji}</div>
                                    )}
                                    <div className="agent-item-info">
                                        <span className="agent-item-name">{agent.name}</span>
                                        <span className="agent-item-title">{agent.title}</span>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    {/* Edit Panel */}
                    <div className="edit-panel">
                        {selectedAgentKey && (
                            <>
                                <div className="edit-header">
                                    {/* Preview current look */}
                                    <div className="preview">
                                        {agents[selectedAgentKey]?.avatar ?
                                            <img src={agents[selectedAgentKey].avatar} className="large-avatar" /> :
                                            <div className="large-emoji">{editForm.emoji}</div>
                                        }
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent-cyan)' }}>
                                            Editing: {agents[selectedAgentKey]?.name}
                                        </h3>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            Model: {agents[selectedAgentKey]?.model}
                                        </p>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editForm.name}
                                        onChange={e => handleChange('name', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editForm.title}
                                        onChange={e => handleChange('title', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Emoji</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ width: '80px', textAlign: 'center' }}
                                        value={editForm.emoji}
                                        onChange={e => handleChange('emoji', e.target.value)}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Custom System Behavior (The "Personality" Prompt)</label>
                                    <textarea
                                        className="form-textarea"
                                        value={editForm.system_prompt}
                                        onChange={e => handleChange('system_prompt', e.target.value)}
                                        placeholder="Enter custom instructions to override the default behavior..."
                                    />
                                    <small style={{ display: 'block', marginTop: '8px', color: 'var(--text-muted)' }}>
                                        Leave empty to use the default council persona.
                                    </small>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="settings-footer">
                    <button className="btn-secondary" onClick={onClose}>Cancellation</button>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={!hasChanges}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
