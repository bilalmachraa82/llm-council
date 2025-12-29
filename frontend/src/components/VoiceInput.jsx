
import React, { useState, useRef } from 'react';
import './VoiceInput.css';

export default function VoiceInput({ onVoiceMessage, isProcessing }) {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                onVoiceMessage(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please allow permission.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="voice-input-container">
            <button
                className={`voice-record-btn ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording} // Stop if user drags out
                onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                disabled={isProcessing}
                title="Hold to Speak"
            >
                {isProcessing ? (
                    <span className="spinner">↻</span>
                ) : isRecording ? (
                    <span className="waveform-icon">|||||</span>
                ) : (
                    <span className="mic-icon">🎤</span>
                )}
            </button>
            {isRecording && <div className="recording-status">Listening...</div>}
        </div>
    );
}
