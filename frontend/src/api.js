/**
 * API client for the LLM Council backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export const api = {
  /**
   * List all conversations.
   */
  async listConversations() {
    const response = await fetch(`${API_BASE}/api/conversations`);
    if (!response.ok) {
      throw new Error('Failed to list conversations');
    }
    return response.json();
  },

  /**
   * Create a new conversation.
   */
  async createConversation() {
    const response = await fetch(`${API_BASE}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }
    return response.json();
  },

  /**
   * Get a specific conversation.
   */
  async getConversation(conversationId) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}`
    );
    if (!response.ok) {
      throw new Error('Failed to get conversation');
    }
    return response.json();
  },

  /**
   * Send a message in a conversation.
   */
  async sendMessage(conversationId, content) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      }
    );
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    return response.json();
  },

  /**
   * Send a voice message and get a stream of events.
   * @param {string} conversationId
   * @param {Blob} audioBlob
   * @param {string} tier "pro" or "budget"
   * @param {function} onEvent Callback for each SSE event
   */
  async sendAudioMessageStream(conversationId, audioBlob, tier, onEvent) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice_message.webm');

    const response = await fetch(`${API_BASE}/api/conversations/${conversationId}/message/audio?tier=${tier}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // Keep incomplete chunk

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onEvent(data);
          } catch (e) {
            console.error('Error parsing SSE event:', e);
          }
        }
      }
    }
  },

  /**
   * Send a message and receive streaming updates.
   * @param {string} conversationId - The conversation ID
   * @param {string} content - The message content
   * @param {string} tier - The tier (pro, budget, uncensored)
   * @param {string|null} danMode - The DAN persona key
   * @param {function} onEvent - Callback function for each event: (eventType, data) => void
   * @returns {Promise<void>}
   */
  async sendMessageStream(conversationId, content, tier, danMode, onEvent) {
    const response = await fetch(
      `${API_BASE}/api/conversations/${conversationId}/message/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, tier, dan_mode: danMode }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const event = JSON.parse(data);
            onEvent(event);
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }
  },

  /**
   * Generate an image based on a prompt.
   * @param {string} prompt - The image description
   * @returns {Promise<Object>} - The standard response with image URL
   */
  async generateImage(prompt) {
    const response = await fetch(`${API_BASE}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      let errorMessage = 'Image generation failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // ignore JSON parse error
      }
      throw new Error(errorMessage);
    }

    return response.json();
  },
  /**
   * Perform Deep Research with streaming updates.
   * @param {string} prompt - The research query
   * @param {function} onEvent - Callback for SSE events
   */
  async performDeepResearchStream(prompt, onEvent) {
    const response = await fetch(`${API_BASE}/api/deep-research/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) throw new Error('Deep Research failed to start');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            onEvent(event);
          } catch (e) {
            console.error('SSE Error:', e);
          }
        }
      }
    }
  },


  /**
   * Get active agents with user settings.
   * @param {string} token - Auth token
   */
  async getAgents(token) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}/api/agents`, {
      method: 'GET',
      headers
    });

    if (!response.ok) throw new Error('Failed to fetch agents');
    return response.json();
  },

  /**
   * Update agent settings.
   * @param {Object} settings - {"agent_key": {...}}
   * @param {string} token - Auth token
   */
  async updateAgentSettings(settings, token) {
    const response = await fetch(`${API_BASE}/api/settings/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) throw new Error('Failed to update settings');
    return response.json();
  }
};
