# 🦅 LLM Council

**The Avant-Garde Multi-Model Decision Engine**

Access the collective intelligence of SOTA Large Language Models through a premium, structured decision-making process. The Council provides reasoned, ranked, and synthesized answers by consulting a diverse board of AI agents.

![LLM Council Banner](https://placehold.co/1200x400/0a0a0a/ffffff?text=LLM+Council)

## ✨ Features

*   **Three-Stage Council Process**:
    1.  **Response Collection**: Parallel interaction with top-tier models (Gemini, Claude, GPT-4, Llama, etc.).
    2.  **Blind Ranking**: Models peer-review each other without knowing the author, scoring on reasoning and accuracy.
    3.  **Chairman Synthesis**: A "Chairman" model synthesizes the best insights into a final verdict.
*   **Dual Tiers**:
    *   **Premium (Pro)**: Best-in-class models (GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro).
    *   **Budget (Reasoning)**: Optimized for cost-effective reasoning (DeepSeek, Llama 3, Qwen).
*   **Voice Mode (🎙️ Live)**: Interact with the Council via voice. Real-time transcription (Whisper) and auditory verdicts (OpenAI TTS).
*   **Avant-Garde UI**: Glassmorphism, micro-interactions, and a premium "Chamber" aesthetic.
*   **Persistent Memory**: PostgreSQL (Neon) database integration via Prisma.

## 🚀 Getting Started

### Prerequisites

*   Python 3.9+
*   Node.js 18+
*   PostgreSQL (Neon or Local)
*   **API Keys**:
    *   `OPENROUTER_API_KEY`: For accessing Council models.
    *   `OPENAI_API_KEY`: For Voice Mode (Whisper/TTS).

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/bilalmachraa82/llm-council.git
    cd llm-council
    ```

2.  **Backend Setup**
    ```bash
    cd backend
    pip install -r requirements.txt
    
    # Setup Envs
    cp .env.example .env
    # Edit .env with your keys and DATABASE_URL
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    # Setup Envs
    cp .env.example .env
    ```

4.  **Database Migration**
    ```bash
    cd backend
    prisma db push
    ```

### Running the App

*   **Backend**: `uvicorn main:app --reload --port 8000`
*   **Frontend**: `npm run dev`

## 🧠 Architecture

### The Council Members
Dynamic configuration in `backend/config.py`.

**Pro Tier:**
*   `google/gemini-pro-1.5`
*   `anthropic/claude-3.5-sonnet`
*   `openai/gpt-4o`
*   ... and more.

**Budget Tier:**
*   `deepseek/deepseek-coder`
*   `meta-llama/llama-3-70b`
*   `qwen/qwen-2.5`

### Voice Pipeline
`Voice Input (Frontend)` -> `Upload` -> `Whisper API (Transcribe)` -> `Council Execution` -> `OpenAI TTS (Synthesize)` -> `Audio Playback`.

## 🛠️ Deploy

*   **Frontend**: Vercel (Auto-detects React).
*   **Backend**: Railway / Render (Python FastAPI).
*   **Database**: Neon (PostgreSQL).

## 📄 License
MIT
