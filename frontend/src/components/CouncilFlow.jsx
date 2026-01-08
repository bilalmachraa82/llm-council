import React, { useEffect, useState } from 'react';
import './CouncilFlow.css';

export default function CouncilFlow({ stage1, stage2, stage3, isLoading }) {
    // Determine the status of each stage
    // Status: 'waiting', 'active', 'complete'

    const [stages, setStages] = useState({
        agents: 'waiting',
        ranking: 'waiting',
        chairman: 'waiting'
    });

    useEffect(() => {
        let newStages = {
            agents: 'waiting',
            ranking: 'waiting',
            chairman: 'waiting'
        };

        // Stage 1 Logic (Agents)
        if (stage1) {
            newStages.agents = 'complete';
        } else if (isLoading && !stage2 && !stage3) {
            newStages.agents = 'active';
        }

        // Stage 2 Logic (Ranking)
        if (stage2) {
            newStages.ranking = 'complete';
        } else if (stage1 && isLoading && !stage3) {
            newStages.ranking = 'active';
        }

        // Stage 3 Logic (Chairman)
        if (stage3) {
            newStages.chairman = 'complete';
        } else if (stage2 && isLoading) {
            newStages.chairman = 'active';
        }

        setStages(newStages);
    }, [stage1, stage2, stage3, isLoading]);

    // Calculate progress bar width based on active/complete stages
    const getProgressWidth = () => {
        if (stages.chairman === 'complete') return '100%';
        if (stages.chairman === 'active') return '85%';
        if (stages.ranking === 'complete') return '66%';
        if (stages.ranking === 'active') return '50%';
        if (stages.agents === 'complete') return '33%';
        if (stages.agents === 'active') return '15%';
        return '0%';
    };

    return (
        <div className="council-flow-container">
            <span className="flow-title">Council Orchestration Pipeline</span>

            <div className="flow-diagram">
                {/* Connection Lines */}
                <div className="flow-line-bg"></div>
                <div
                    className="flow-line-progress"
                    style={{ width: getProgressWidth() }}
                ></div>

                {/* Node 1: Agents */}
                <div className={`flow-node ${stages.agents}`}>
                    <div className="node-icon">
                        {stages.agents === 'complete' ? '✓' : '🤖'}
                    </div>
                    <span className="node-label">Agents</span>
                    <span className="node-status">
                        {stages.agents === 'active' ? 'Generating...' :
                            stages.agents === 'complete' ? 'Collected' : 'Waiting'}
                    </span>
                </div>

                {/* Node 2: Ranking */}
                <div className={`flow-node ${stages.ranking}`}>
                    <div className="node-icon">
                        {stages.ranking === 'complete' ? '✓' : '📊'}
                    </div>
                    <span className="node-label">Ranking</span>
                    <span className="node-status">
                        {stages.ranking === 'active' ? 'Evaluating...' :
                            stages.ranking === 'complete' ? 'Ranked' : 'Waiting'}
                    </span>
                </div>

                {/* Node 3: Chairman */}
                <div className={`flow-node chairman ${stages.chairman}`}>
                    <div className="node-icon">
                        {stages.chairman === 'complete' ? '👑' : '🏛️'}
                    </div>
                    <span className="node-label">Chairman</span>
                    <span className="node-status">
                        {stages.chairman === 'active' ? 'Synthesizing...' :
                            stages.chairman === 'complete' ? 'Finalized' : 'Waiting'}
                    </span>
                </div>
            </div>
        </div>
    );
}
