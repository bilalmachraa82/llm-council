import { useState } from 'react';
import { api } from '../api';
import './ImageStudio.css';

export default function ImageStudio({ onToggleSidebar }) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null); // For Zoom Modal

    const handleGenerate = async () => {
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const result = await api.generateImage(prompt);
            setGeneratedImages(prev => [
                { url: result.url, prompt: result.revised_prompt || prompt, timestamp: Date.now() },
                ...prev
            ]);
            setPrompt('');
        } catch (error) {
            console.error('Image generation failed:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    const handleDownload = (imgUrl, index) => {
        const link = document.createElement('a');
        link.href = imgUrl;
        link.download = `flux-generated-${Date.now()}-${index}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="image-studio">
            <div className="mobile-header">
                <button className="hamburger-btn" onClick={onToggleSidebar}>☰</button>
                <span className="brand-mobile">Flux Studio</span>
            </div>
            <div className="studio-header">
                <h1>🎨 Flux Image Studio</h1>
                <p>Generate stunning images with the Flux AI model</p>
            </div>

            <div className="studio-input-area">
                <textarea
                    className="studio-prompt-input"
                    placeholder="Describe the image you want to create..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={3}
                />
                <button
                    className="studio-generate-btn"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isLoading}
                >
                    {isLoading ? 'Generating...' : '✨ Generate'}
                </button>
            </div>

            {/* How it Works Infographic */}
            <div className="studio-info-section">
                <h2>How It Works</h2>
                <img src="/infographic_studio.png" alt="Image Studio Workflow" className="studio-infographic" />
            </div>

            {/* Generated Images Gallery */}
            <div className="studio-gallery">
                <h2>Your Creations</h2>
                {generatedImages.length === 0 ? (
                    <div className="gallery-empty">
                        <p>No images generated yet. Describe your vision above!</p>
                    </div>
                ) : (
                    <div className="gallery-grid">
                        {generatedImages.map((img, index) => (
                            <div key={img.timestamp} className="gallery-item">
                                <div className="gallery-image-wrapper" onClick={() => setSelectedImage(img)}>
                                    <img src={img.url} alt={`Generated ${index + 1}`} />
                                    <button
                                        className="gallery-download-btn"
                                        onClick={() => handleDownload(img.url, index)}
                                        title="Download Image"
                                    >
                                        ⬇️
                                    </button>
                                </div>
                                <div className="gallery-item-prompt">{img.prompt}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Zoom Modal */}
            {selectedImage && (
                <div className="image-zoom-overlay" onClick={() => setSelectedImage(null)}>
                    <div className="image-zoom-content" onClick={e => e.stopPropagation()}>
                        <img src={selectedImage.url} alt="Zoomed View" />
                        <button className="close-zoom-btn" onClick={() => setSelectedImage(null)}>×</button>
                        <div className="zoom-actions">
                            <span className="zoom-prompt">{selectedImage.prompt}</span>
                            <button
                                className="zoom-download-btn"
                                onClick={() => handleDownload(selectedImage.url, selectedImage.timestamp)}
                            >
                                Download HD
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
