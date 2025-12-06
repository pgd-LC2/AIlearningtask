import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TextContent {
  type: "text";
  text: string;
}

interface ImageUrlContent {
  type: "image_url";
  image_url: {
    url: string;
  };
}

interface VideoUrlContent {
  type: "video_url";
  video_url: {
    url: string;
  };
}

type MessageContent = string | Array<TextContent | ImageUrlContent | VideoUrlContent>;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: MessageContent;
  annotations?: unknown;
}

interface ThinkingConfig {
  type?: "disabled" | "auto" | "enabled";
}

interface VolcengineRequest {
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const apiKey = Deno.env.get("VOLCENGINE_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Volcengine API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData: VolcengineRequest = await req.json();

    if (!requestData.messages || requestData.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const volcenginePayload: Record<string, unknown> = {
      model: requestData.model || "kimi-k2-thinking-251104",
      messages: requestData.messages,
      temperature: requestData.temperature ?? 0.7,
      max_tokens: requestData.max_tokens ?? 2000,
      stream: requestData.stream ?? true,
    };

    if (requestData.top_p !== undefined) {
      volcenginePayload.top_p = requestData.top_p;
    }
    if (requestData.frequency_penalty !== undefined) {
      volcenginePayload.frequency_penalty = requestData.frequency_penalty;
    }
    if (requestData.presence_penalty !== undefined) {
      volcenginePayload.presence_penalty = requestData.presence_penalty;
    }
    if (requestData.thinking !== undefined) {
      volcenginePayload.thinking = requestData.thinking;
    }

    const volcengineResponse = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(volcenginePayload),
    });

    if (!volcengineResponse.ok) {
      const errorText = await volcengineResponse.text();
      console.error("Volcengine API error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Volcengine API request failed",
          details: errorText,
          status: volcengineResponse.status
        }),
        {
          status: volcengineResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (requestData.stream !== false) {
      return new Response(volcengineResponse.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    const data = await volcengineResponse.json();

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});