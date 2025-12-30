# 📡 LLM Council API Reference

Base URL: `http://localhost:8000` (or your deployed URL)

## Authentication
Currently, the API is public. Future versions may require Bearer tokens.

## Endpoints

### 1. Conversations

#### List Conversations
GET `/api/conversations`
Returns a list of all conversations, ordered by most recent update.

**Response:**
```json
[
  {
    "id": "uuid-string",
    "title": "Discussion about Quantum Physics",
    "updated_at": "2023-10-27T10:00:00Z",
    "messages": [...]
  }
]
```

#### Get Conversation
GET `/api/conversations/{conversation_id}`
Returns full details of a specific conversation.

#### Create Conversation
POST `/api/conversations`
Creates a new empty conversation.

**Response:**
```json
{
  "id": "new-uuid",
  "title": "New Conversation",
  "created_at": "...",
  "updated_at": "...",
  "messages": []
}
```

#### Update Title
PUT `/api/conversations/{conversation_id}/title`
Updates the title of a conversation manually.

**Body:**
```json
{
  "title": "New Title"
}
```

### 2. Messaging (Streaming)

#### Send Text Message (Stream)
POST `/api/conversations/{conversation_id}/message/stream`
Sends a text message and receives a Server-Sent Events (SSE) stream of the Council's process.

**Body:**
```json
{
  "content": "What is the future of AI?",
  "tier": "pro" // or "budget"
}
```

**Stream Events:**
*   `stage1_start`
*   `stage1_complete`: Payload contains individual model responses.
*   `stage2_start`
*   `stage2_complete`: Payload contains rankings.
*   `stage3_start`
*   `stage3_complete`: Payload contains final synthesis.
*   `title_complete`: (Optional) If title was auto-generated.
*   `complete`: Stream finished.

#### Send Voice Message (Stream)
POST `/api/conversations/{conversation_id}/message/audio`
Uploads an audio file (WebM/WAV) to be transcribed and processed by the Council. Returns SSE stream consistent with the text endpoint, plus an `audio` field in `stage3_complete` containing the TTS response.

**Query Param:** `tier` (default: "pro")
**Form Data:** `audio` (File)

**Stream Events:**
*   `transcription`: Payload `{"text": "Transcribed user text"}`.
*   ... (Same as Text Message stream)
*   `stage3_complete`: Payload includes `"audio": "data:audio/mp3;base64,..."`.
