export interface TextContent {
  type: 'text';
  text: string;
}

export interface ImageUrlContent {
  type: 'image_url';
  image_url: {
    url: string;
  };
}

export interface VideoUrlContent {
  type: 'video_url';
  video_url: {
    url: string;
  };
}

export type MessageContent = string | Array<TextContent | ImageUrlContent | VideoUrlContent>;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
  annotations?: unknown;
}

export interface ThinkingConfig {
  type?: 'disabled' | 'auto' | 'enabled';
}

export interface VolcengineRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
  thinking?: ThinkingConfig;
}

export interface VolcengineResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
    index?: number;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  created?: number;
  object?: string;
}

const VOLCENGINE_API = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const API_KEY = import.meta.env.VITE_VOLCENGINE_API_KEY as string;

export async function callVolcengine(request: VolcengineRequest): Promise<VolcengineResponse> {
  const response = await fetch(VOLCENGINE_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model || 'kimi-k2-thinking-251104',
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 16000,
      stream: false,
      ...(request.top_p !== undefined && { top_p: request.top_p }),
      ...(request.frequency_penalty !== undefined && { frequency_penalty: request.frequency_penalty }),
      ...(request.presence_penalty !== undefined && { presence_penalty: request.presence_penalty }),
      ...(request.thinking !== undefined && { thinking: request.thinking }),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Volcengine API request failed');
  }

  return await response.json();
}

export async function callVolcengineStream(
  request: VolcengineRequest,
  onChunk: (text: string, isThinking?: boolean) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(VOLCENGINE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'kimi-k2-thinking-251104',
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 16000,
        stream: true,
        ...(request.top_p !== undefined && { top_p: request.top_p }),
        ...(request.frequency_penalty !== undefined && { frequency_penalty: request.frequency_penalty }),
        ...(request.presence_penalty !== undefined && { presence_penalty: request.presence_penalty }),
        ...(request.thinking !== undefined && { thinking: request.thinking }),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Volcengine API request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.choices?.[0]?.delta?.content) {
              onChunk(parsed.choices[0].delta.content, false);
            }

            if (parsed.choices?.[0]?.delta?.thinking_content) {
              onChunk(parsed.choices[0].delta.thinking_content, true);
            }

            if (parsed.choices?.[0]?.delta?.reasoning_content) {
              onChunk(parsed.choices[0].delta.reasoning_content, true);
            }
          } catch {
            console.warn('Failed to parse SSE data:', data);
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error occurred'));
  }
}

export function encodeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
