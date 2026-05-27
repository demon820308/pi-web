import { NextResponse } from "next/server";
import { AuthStorage } from "@earendil-works/pi-coding-agent";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { image, mimeType } = await req.json() as { image: string; mimeType: string };
    if (!image || !mimeType) {
      return NextResponse.json({ error: "image and mimeType are required" }, { status: 400 });
    }

    const authStorage = AuthStorage.create();
    let apiKey = "";
    let provider = "";

    // 1. Check AuthStorage for configured API keys
    const openaiAuth = authStorage.get("openai") as { key?: string } | undefined;
    if (openaiAuth?.key) {
      apiKey = openaiAuth.key;
      provider = "openai";
    } else {
      const anthropicAuth = authStorage.get("anthropic") as { key?: string } | undefined;
      if (anthropicAuth?.key) {
        apiKey = anthropicAuth.key;
        provider = "anthropic";
      }
    }

    // 2. Fallback to Environment Variables
    if (!apiKey) {
      if (process.env.OPENAI_API_KEY) {
        apiKey = process.env.OPENAI_API_KEY;
        provider = "openai";
      } else if (process.env.ANTHROPIC_API_KEY) {
        apiKey = process.env.ANTHROPIC_API_KEY;
        provider = "anthropic";
      }
    }

    if (!apiKey) {
      return NextResponse.json({
        error: "未配置可用视觉模型的 API 密钥（OpenAI 或 Anthropic）。请先在侧边栏底部的 Models 中配置 API Key，或在系统环境变量中设置 OPENAI_API_KEY。"
      }, { status: 400 });
    }

    const promptText = "请详细分析并用一段话描述这张图片（网页界面设计、原型图或应用 UI 截图）的整体结构、布局、颜色和主要 UI 元素，作为给编码智能体（Coding Agent）生成代码的系统性描述提示词。直接输出描述内容，不要有任何前导词或说明。";

    if (provider === "openai") {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
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
        throw new Error(`OpenAI API returned status ${response.status}: ${JSON.stringify(errorData)}`);
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
          model: "claude-3-5-sonnet-20241022",
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
    }

    return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
  } catch (error) {
    console.error("Error in describe-image API:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
