export function isVisionModel(provider: string, modelId: string): boolean {
  const pid = provider.toLowerCase();
  const mid = modelId.toLowerCase();

  // If it's explicitly deepseek, it doesn't support vision
  if (pid.includes("deepseek") || mid.includes("deepseek")) {
    return false;
  }

  // 1. OpenAI Vision Models
  if (pid.includes("openai")) {
    if (mid.includes("o1-mini")) return false;
    if (
      mid.includes("gpt-4o") ||
      mid.includes("gpt-4-turbo") ||
      mid.includes("vision") ||
      mid === "o1" ||
      mid.startsWith("o1-202")
    ) {
      return true;
    }
    return false;
  }

  // 2. Anthropic Vision Models (Claude 3 / 3.5 series)
  if (pid.includes("anthropic")) {
    if (mid.includes("claude-3")) {
      return true;
    }
    return false;
  }

  // 3. Gemini / Google Vision Models
  if (pid.includes("google") || pid.includes("gemini")) {
    if (
      mid.includes("gemini-") ||
      mid.includes("vision")
    ) {
      return true;
    }
    return false;
  }

  // 4. Other models (e.g. OpenRouter, Groq, local models)
  if (
    mid.includes("vision") ||
    mid.includes("gpt-4o") ||
    mid.includes("claude-3") ||
    mid.includes("gemini-") ||
    mid.includes("llama-3.2-11b") ||
    mid.includes("llama-3.2-90b") ||
    mid.includes("pixtral") ||
    mid.includes("mimo")
  ) {
    return true;
  }

  return false;
}
