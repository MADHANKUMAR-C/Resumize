// List of models in order of preference (fastest first)
const FAST_MODELS = [
  "phi", // Microsoft's Phi-2 (very fast, good for structured tasks)
  "gemma2:2b", // Google's gemma2 2B (very fast)
  "mistral", // Mistral 7B (good balance of speed and quality)
  "llama2", // Llama 2 (faster than Llama 3)
  "gemma2", // Fallback to Llama 3 if nothing else is available
]

export type ModelInfo = {
  name: string
  size: string // e.g., "2B", "7B"
  description: string
}

export async function checkOllamaStatus() {
  try {
    // Set up AbortController with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 5 second timeout

    try {
      const response = await fetch("http://51.20.69.239:11434/api/tags", {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return { running: false, error: `Ollama returned status ${response.status}` }
      }

      const data = await response.json()
      const availableModels = data.models || []

      // Find the fastest available model from our preference list
      let selectedModel: ModelInfo | null = null

      for (const modelPrefix of FAST_MODELS) {
        const matchingModel = availableModels.find(
          (model: any) =>
            model.name === modelPrefix ||
            model.name.startsWith(`${modelPrefix}:`) ||
            model.name.startsWith(`${modelPrefix}-`),
        )

        if (matchingModel) {
          // Extract size from model name if possible
          const sizeMatch = matchingModel.name.match(/[0-9]+b/i)
          const size = sizeMatch ? sizeMatch[0].toUpperCase() : "Unknown"

          selectedModel = {
            name: matchingModel.name,
            size,
            description: getModelDescription(matchingModel.name),
          }
          break
        }
      }

      if (!selectedModel) {
        return {
          running: true,
          error:
            "Ollama is running but no suitable models are available. Run 'ollama pull phi' or 'ollama pull mistral' to download a fast model.",
          modelLoaded: false,
          availableModels: availableModels.map((m: any) => m.name),
        }
      }

      return {
        running: true,
        modelLoaded: true,
        selectedModel,
        availableModels: availableModels.map((m: any) => m.name),
      }
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === "AbortError") {
        return { running: false, error: "Connection to Ollama timed out" }
      }

      return { running: false, error: error.message }
    }
  } catch (error: any) {
    return { running: false, error: error.message }
  }
}

function getModelDescription(modelName: string): string {
  const lowerName = modelName.toLowerCase()

  if (lowerName.includes("phi")) {
    return "Microsoft's Phi (very fast, efficient model)"
  } else if (lowerName.includes("gemma2")) {
    return "Google's gemma2 (compact, efficient model)"
  } else if (lowerName.includes("mistral")) {
    return "Mistral AI's model (good balance of speed and quality)"
  } else if (lowerName.includes("llama2")) {
    return "Meta's Llama 2 (faster than Llama 3)"
  } else if (lowerName.includes("gemma2")) {
    return "Meta's Llama 3 (high quality but slower)"
  } else {
    return "AI language model"
  }
}
