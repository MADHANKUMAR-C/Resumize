import { type NextRequest, NextResponse } from "next/server"
import { parseResume, parseJobDescription } from "@/lib/resume-parser"
import { analysisCache } from "@/lib/cache"
import { checkOllamaStatus } from "@/lib/check-ollama"
import pdfParse from "pdf-parse"
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const resumeFile = formData.get("resume") as File
    const jobDescription = formData.get("jobDescription") as string

    if (!resumeFile || !jobDescription) {
      return NextResponse.json({ error: "Resume file and job description are required" }, { status: 400 })
    }

    const arrayBuffer = await resumeFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const parsed = await pdfParse(buffer)
    const resumeText = parsed.text
    const cachedResult = analysisCache.get(resumeText, jobDescription)
    if (cachedResult) {
      console.log("Returning cached result")
      return NextResponse.json(cachedResult)
    }

    const ollamaStatus = await checkOllamaStatus()
    if (!ollamaStatus.running || !ollamaStatus.modelLoaded) {
      return NextResponse.json(
        { error: ollamaStatus.error || "Ollama is not running or no suitable model is available" },
        { status: 500 }
      )
    }

    const modelName = ollamaStatus.selectedModel?.name || "phi"
    console.log(`Using model: ${modelName}`)

    const parsedJobDescription = parseJobDescription(jobDescription, true)
    console.log(resumeText)
    console.log(parsedJobDescription)
    const prompt = `
You are an expert recruiter and must analyze ONLY the overlap between the job description and the candidate's resume.

Only count skills that are *explicitly relevant to the job role*. Do NOT include unrelated programming languages or tools, even if they appear in the resume.

Your job is to:

1. Identify up to 5 matchedSkills from the resume that are *directly useful* for the job description.
2. Identify up to 5 missingSkills from the job description that are *not found* in the resume.
3. Provide 1–3 useful suggestions to improve job fit.
4. Provide a short explanation.
5. Calculate matchPercentage ONLY based on matchedSkills that directly align with job description needs.

Do not include skills that are not useful for this job. Ignore extra text. Strictly respond in this JSON format:

{
  "matchPercentage": number (0-100),
  "matchedSkills": string[] (max 5),
  "missingSkills": string[] (max 5),
  "suggestions": string[] (max 3),
  "explanation": string (brief 1-2 lines)
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${parsedJobDescription}
`.trim()


    console.log("Sending ultra-optimized request to Ollama API...")

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1200000)

    try {
      const response = await fetch("http://51.20.69.239:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          options: {
            temperature: 0.0,
            top_p: 0.8,
            num_predict: 500,
            stop: ["}"]
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Ollama API error: ${error}`)
      }

      const data = await response.json()
      const content = data.message.content

      try {
        const firstBrace = content.indexOf("{")
        let lastBrace = content.lastIndexOf("}")

        if (firstBrace === -1) {
          throw new Error("No opening JSON brace found in Ollama response")
        }

        // If no closing brace, assume JSON runs till end
        if (lastBrace === -1 || lastBrace <= firstBrace) {
          console.warn("⚠️ Closing brace missing. Attempting recovery...")
          lastBrace = content.length
        }

        let jsonString = content.slice(firstBrace, lastBrace + 1)
        if (!jsonString.trim().endsWith("}")) {
          console.warn("⚠️ Closing brace missing. Attempting recovery1...")
          jsonString += "}"
        }
        console.log(jsonString)
        // Remove anything after the last }
        jsonString = jsonString.replace(/}\s*[^}]*$/, "}")

        let result
        try {
          result = JSON.parse(jsonString)
        } catch (e) {
          console.error("🛑 Failed to parse JSON:", e)
          console.log("🔎 Extracted JSON string:", jsonString)
          throw new Error("Invalid JSON in Ollama response")
        }

        const finalResult = {
          matchPercentage: result.matchPercentage || 0,
          matchedSkills: result.matchedSkills || [],
          missingSkills: result.missingSkills || [],
          suggestions: result.suggestions || [],
          explanation: result.explanation || "Analysis complete.",
          modelUsed: modelName
        }

        analysisCache.set(resumeText, jobDescription, finalResult)
        return NextResponse.json(finalResult)

      } catch (error) {
        console.error("Error parsing JSON from Ollama response:", error)
        console.log("Raw response:", content)

        const match = content.match(/(\d+)%/) || content.match(/percentage[:\s]+(\d+)/i)
        const fallbackPercent = match ? parseInt(match[1]) : 50

        const fallbackResult = {
          matchPercentage: fallbackPercent,
          matchedSkills: ["Could not extract data"],
          missingSkills: ["Could not extract data"],
          suggestions: ["Try submitting simpler resume/job inputs"],
          explanation: "Response was incomplete or not fully parseable.",
          modelUsed: modelName,
          rawResponse: content.slice(0, 500)
        }

        return NextResponse.json(fallbackResult)
      }
    } catch (error: any) {
      clearTimeout(timeoutId)

      if (error.name === "AbortError") {
        console.error("Request to Ollama timed out")
        return NextResponse.json(
          { error: "Analysis timed out. Try again with shorter resume or job description." },
          { status: 504 }
        )
      }

      throw error
    }

  } catch (error: any) {
    console.error("Error in match-resume route:", error)
    return NextResponse.json(
      { error: error.message || "Internal error. Ensure Ollama is running with a proper model." },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
