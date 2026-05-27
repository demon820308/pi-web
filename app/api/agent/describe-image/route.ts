import { NextResponse } from "next/server";
import { AuthStorage } from "@earendil-works/pi-coding-agent";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { image, mimeType, provider: reqProvider, modelId: reqModelId } = await req.json() as {
      image: string;
      mimeType: string;
      provider?: string;
      modelId?: string;
    };

    if (!image || !mimeType) {
      return NextResponse.json({ error: "image and mimeType are required" }, { status: 400 });
    }

    const authStorage = AuthStorage.create();
    let apiKey = "";
    let provider = reqProvider ? reqProvider.toLowerCase() : "";
    let modelId = reqModelId || "";

    // 1. First attempt to resolve API key for the requested provider
    if (provider) {
      const auth = authStorage.get(provider) as { key?: string } | undefined;
      if (auth?.key) {
        apiKey = auth.key;
      } else {
        const envNames = [
          `${provider.toUpperCase()}_API_KEY`,
          `${provider.toUpperCase().replace("-", "_")}_API_KEY`
        ];
        for (const name of envNames) {
          if (process.env[name]) {
            apiKey = process.env[name]!;
            break;
          }
        }
      }
    }

    // 2. If no key resolved for requested provider, fall back to first configured OpenAI / Anthropic key
    if (!apiKey) {
      const openaiAuth = authStorage.get("openai") as { key?: string } | undefined;
      if (openaiAuth?.key) {
        apiKey = openaiAuth.key;
        provider = "openai";
        modelId = "gpt-4o-mini";
      } else {
        const anthropicAuth = authStorage.get("anthropic") as { key?: string } | undefined;
        if (anthropicAuth?.key) {
          apiKey = anthropicAuth.key;
          provider = "anthropic";
          modelId = "claude-3-5-sonnet-20241022";
        }
      }
    }

    // 3. Fallback to general environment variables if still no key
    if (!apiKey) {
      if (process.env.OPENAI_API_KEY) {
        apiKey = process.env.OPENAI_API_KEY;
        provider = "openai";
        modelId = "gpt-4o-mini";
      } else if (process.env.ANTHROPIC_API_KEY) {
        apiKey = process.env.ANTHROPIC_API_KEY;
        provider = "anthropic";
        modelId = "claude-3-5-sonnet-20241022";
      } else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
        provider = "google";
        modelId = "gemini-1.5-flash";
      }
    }

    if (!apiKey) {
      return NextResponse.json({
        error: "未配置可用视觉模型的 API 密钥（OpenAI 或 Anthropic）。请先在侧边栏底部的 Models 中配置 API Key，或在系统环境变量中设置 OPENAI_API_KEY。"
      }, { status: 400 });
    }

    const promptText = "请详细分析并用一段话描述这张图片（网页界面设计、原型图或应用 UI 截图）的整体结构、布局、颜色和主要 UI 元素，作为给编码智能体（Coding Agent）生成代码的系统性描述提示词。直接输出描述内容，不要有任何前导词或说明。";

    // 4. API Calls based on resolved provider
    if (provider === "openai" || provider === "openrouter") {
      const endpoint = provider === "openrouter"
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId || "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as unknown;
        throw new Error(`${provider.toUpperCase()} API returned status ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json() as { choices?: { message?: { content?: string } }[] };
      const description = data.choices?.[0]?.message?.content?.trim() || "";
      return NextResponse.json({ description });
    } else if (provider === "anthropic") {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: modelId || "claude-3-5-sonnet-20241022",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mimeType,
                    data: image,
                  },
                },
                { type: "text", text: promptText },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as unknown;
        throw new Error(`Anthropic API returned status ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json() as { content?: { text?: string }[] };
      const description = data.content?.[0]?.text?.trim() || "";
      return NextResponse.json({ description });
    } else if (provider === "google" || provider === "gemini") {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId || "gemini-1.5-flash"}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                {
                  inlineData: {
                    mimeType,
                    data: image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 300,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as unknown;
        throw new Error(`Gemini API returned status ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const description = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      return NextResponse.json({ description });
    }

    return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
  } catch (error) {
    console.error("Error in describe-image API:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
