export function isVisionModel(provider: string, modelId: string): boolean {
  const pid = provider.toLowerCase();
  const mid = modelId.toLowerCase();

  // If it's explicitly deepseek, it doesn't support vision (except for deepseek-vl / deepseek-vl2 series)
  if (pid.includes("deepseek") || mid.includes("deepseek")) {
    if (mid.includes("deepseek-vl") || mid.includes("deepseek-vl2")) {
      return true;
    }
    return false;
  }

  // 1. OpenAI Vision Models
  if (pid.includes("openai")) {
    if (mid.includes("o1-mini")) return false;
    if (
      mid.includes("gpt-4o") ||
      mid.includes("gpt-5") ||
      mid.includes("gpt-4.5") ||
      mid.includes("gpt-4-turbo") ||
      mid.includes("vision") ||
      mid.includes("multimodal") ||
      mid === "o1" ||
      mid.startsWith("o1-202")
    ) {
      return true;
    }
    return false;
  }

  // 2. Anthropic Vision Models (Claude 3 / 3.5 / 4 / 5 series)
  if (pid.includes("anthropic")) {
    if (
      mid.includes("claude-3") ||
      mid.includes("claude-4") ||
      mid.includes("claude-5") ||
      mid.includes("claude-sonnet") ||
      mid.includes("claude-opus") ||
      (mid.includes("claude-") && (mid.includes("vision") || mid.includes("multimodal")))
    ) {
      return true;
    }
    return false;
  }

  // 3. Gemini / Google Vision Models
  if (pid.includes("google") || pid.includes("gemini")) {
    if (
      mid.includes("gemini-") ||
      mid.includes("omni") ||
      mid.includes("vision") ||
      mid.includes("multimodal")
    ) {
      return true;
    }
    return false;
  }

  // 4. Other models (e.g. OpenRouter, Groq, local models, specialized Chinese gateways)
  if (
    mid.includes("vision") ||
    mid.includes("multimodal") ||
    mid.includes("vlm") ||
    mid.includes("vla") ||
    mid.includes("gpt-4o") ||
    mid.includes("gpt-5") ||
    mid.includes("gpt-4.5") ||
    mid.includes("claude-3") ||
    mid.includes("claude-4") ||
    mid.includes("gemini-") ||
    mid.includes("pixtral") ||
    mid.includes("mimo") ||
    mid.includes("-vl") ||
    mid.includes("molmo") ||
    mid.includes("paligemma") ||
    mid.includes("gemma-3") ||
    mid.includes("gemma-4") ||
    mid.includes("gemma-5") ||
    // Llama vision models (Llama 3.2 11B/90B, Llama 3.3/4 Vision, etc.)
    (mid.includes("llama") && (mid.includes("11b") || mid.includes("90b") || mid.includes("vision") || mid.includes("multimodal"))) ||
    // Qwen VL models
    (mid.includes("qwen") && mid.includes("vl")) ||
    // Zhipu GLM Vision models
    (mid.includes("glm") && (mid.includes("4v") || mid.includes("5v") || mid.includes("thinking"))) ||
    mid.includes("cogvlm") ||
    mid.includes("internvl") ||
    // Yi VL models
    (mid.includes("yi") && mid.includes("vl")) ||
    // StepFun Vision models
    (mid.includes("step-") && (mid.includes("v") || mid.includes("vision"))) ||
    // Tencent Hunyuan Vision models
    (mid.includes("hunyuan") && (mid.includes("vision") || mid.includes("vl"))) ||
    // ByteDance Doubao Vision models
    (mid.includes("doubao") && (mid.includes("vision") || mid.includes("vl"))) ||
    // MiniMax Vision models
    (mid.includes("abab") && (mid.includes("vision") || mid.includes("vl")))
  ) {
    return true;
  }

  return false;
}
