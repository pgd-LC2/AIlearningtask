import { supabase } from './supabase';

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

export async function callVolcengine(request: VolcengineRequest): Promise<VolcengineResponse> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/volcengine-ai`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

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
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    onError(new Error('User not authenticated'));
    return;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/volcengine-ai`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...request, stream: true }),
      }
    );

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
          } catch (e) {
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
