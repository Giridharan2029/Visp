import { AIProviderConfig, AppSettings } from '../types';

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string, tokens?: { prompt: number; completion: number; total: number }) => void;
  onError: (error: Error) => void;
}

export interface CompletionRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  contextSnippet?: string;
  systemPrompt?: string;
  temperature?: number;
}

export class AIProviderService {
  /**
   * Send a completion request with streaming support
   */
  static async streamCompletion(
    config: AIProviderConfig,
    request: CompletionRequest,
    callbacks: StreamCallbacks,
    settings: AppSettings,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const { apiKey, provider } = config;
    const systemPrompt = request.systemPrompt || settings.personality.systemPrompt;
    
    // Inject active context if available
    let enrichedSystemPrompt = systemPrompt;
    if (request.contextSnippet) {
      enrichedSystemPrompt += `\n\n[ACTIVE USER CONTEXT]:\n${request.contextSnippet}`;
    }

    // Check if key is missing and provider requires key
    if (!apiKey && provider !== 'ollama') {
      // Simulate intelligent onboard guidance if no key is configured
      const fallbackResponse = `I notice your **${config.name}** API key hasn't been set yet in VISP Settings.

To enable full real-time intelligence, voice replies, and second-brain memory:
1. Open **Settings** (gear icon or in Workspace mode).
2. Enter your API key for **${config.name}** (or select another provider like **Google Gemini**, **Groq**, or local **Ollama**).
3. Click Save.

Once configured, I will be fully active and ready to reason, converse, and help with your workflow!`;

      // Stream fallback gently
      let current = '';
      const chunks = fallbackResponse.split(' ');
      for (let i = 0; i < chunks.length; i++) {
        if (abortSignal?.aborted) return;
        current += (i === 0 ? '' : ' ') + chunks[i];
        callbacks.onToken((i === 0 ? '' : ' ') + chunks[i]);
        await new Promise((r) => setTimeout(r, 25));
      }
      callbacks.onComplete(current, { prompt: 15, completion: 85, total: 100 });
      return;
    }

    try {
      if (provider === 'gemini') {
        await this.streamGemini(config, enrichedSystemPrompt, request, callbacks, abortSignal);
      } else if (provider === 'anthropic') {
        await this.streamAnthropic(config, enrichedSystemPrompt, request, callbacks, abortSignal);
      } else {
        // OpenAI, Groq, Ollama, and Custom use OpenAI-compatible format
        await this.streamOpenAICompatible(config, enrichedSystemPrompt, request, callbacks, abortSignal);
      }
    } catch (err: any) {
      if (abortSignal?.aborted) {
        callbacks.onComplete('[Interrupted by user]');
        return;
      }
      callbacks.onError(err);
    }
  }

  /**
   * OpenAI, Groq, Ollama, and Custom OpenAI-compatible streaming
   */
  private static async streamOpenAICompatible(
    config: AIProviderConfig,
    systemPrompt: string,
    request: CompletionRequest,
    callbacks: StreamCallbacks,
    abortSignal?: AbortSignal
  ): Promise<void> {
    let endpoint = 'https://api.openai.com/v1/chat/completions';
    if (config.provider === 'groq') {
      endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    } else if (config.baseUrl) {
      endpoint = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...request.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: request.temperature ?? 0.7,
        stream: true,
      }),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API error (${response.status}): ${errText}`);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported on this response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') break;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              callbacks.onToken(delta);
            }
          } catch {
            // Partial JSON in stream line, skip
          }
        }
      }
    }

    callbacks.onComplete(fullText, {
      prompt: Math.round(systemPrompt.length / 4) + Math.round(request.messages.reduce((a, b) => a + b.content.length, 0) / 4),
      completion: Math.round(fullText.length / 4),
      total: Math.round((systemPrompt.length + fullText.length) / 4),
    });
  }

  /**
   * Google Gemini streaming implementation
   */
  private static async streamGemini(
    config: AIProviderConfig,
    systemPrompt: string,
    request: CompletionRequest,
    callbacks: StreamCallbacks,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const model = config.model || 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${config.apiKey}`;

    const contents = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
        },
      }),
      signal: abortSignal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response stream not available');

    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const textChunk = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (textChunk) {
              fullText += textChunk;
              callbacks.onToken(textChunk);
            }
          } catch {
            // Stream chunk parse error
          }
        }
      }
    }

    callbacks.onComplete(fullText);
  }

  /**
   * Anthropic Claude streaming implementation
   */
  private static async streamAnthropic(
    config: AIProviderConfig,
    systemPrompt: string,
    request: CompletionRequest,
    callbacks: StreamCallbacks,
    abortSignal?: AbortSignal
  ): Promise<void> {
    const endpoint = 'https://api.anthropic.com/v1/messages';
    const messages = request.messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-7-sonnet-20250219',
        system: systemPrompt,
        messages,
        max_tokens: 4096,
        stream: true,
      }),
      signal: abortSignal,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic Error (${response.status}): ${err}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response stream not available');

    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            if (json.type === 'content_block_delta' && json.delta?.text) {
              fullText += json.delta.text;
              callbacks.onToken(json.delta.text);
            }
          } catch {
            // Ignore parse chunk
          }
        }
      }
    }

    callbacks.onComplete(fullText);
  }
}
