import type { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export const maxDuration = 60 // Set maximum duration to 60 seconds

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const jobDescription = formData.get("jobDescription") as string
    const useMockModeStr = formData.get("useMockMode") as string
    const modelType = (formData.get("modelType") as string) || "gemini-pro-vision"

    const useMockMode = useMockModeStr === "true"

    if (!jobDescription) {
      return Response.json({ error: "Job description is required" }, { status: 400 })
    }

    // Get all resume files from the form data
    const resumeFiles: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("resume-") && value instanceof File) {
        resumeFiles.push(value)
      }
    }

    if (resumeFiles.length === 0) {
      return Response.json({ error: "No resume files provided" }, { status: 400 })
    }

    // If using mock mode, return mock results
    if (useMockMode) {
      const mockResults = generateMockResults(resumeFiles, jobDescription)
      return Response.json({
        results: mockResults,
        mode: "mock",
      })
    }

    // Process resumes with Gemini API
    const results = await analyzeResumesWithGemini(resumeFiles, jobDescription, modelType)

    return Response.json({
      results,
      mode: "api",
      model: modelType,
    })
  } catch (error) {
    console.error("Error in analyze API route:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}

async function analyzeResumesWithGemini(
  resumeFiles: File[],
  jobDescription: string,
  modelType: string,
): Promise<any[]> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY

  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured")
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  // Use the correct model name based on the selected type
  const modelName = modelType === "gemini-pro-vision" ? "gemini-1.5-flash" : "gemini-1.5-flash"
  const model = genAI.getGenerativeModel({ model: modelName })

  const results = []

  for (const file of resumeFiles) {
    try {
      // Extract text from the resume
      let resumeText = ""

      if (file.type === "application/pdf") {
        // For PDFs, extract text directly using Gemini Vision
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64 = buffer.toString("base64")
        const mimeType = file.type

        // Create the prompt for Gemini
        const extractPrompt =
          "Extract all text content from this PDF document. Return only the extracted text, with no additional commentary."

        // Generate content with the PDF using Gemini Vision
        const visionModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const extractResult = await visionModel.generateContent([
          extractPrompt,
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
        ])

        const extractResponse = await extractResult.response
        resumeText = extractResponse.text() || ""
      } else {
        // For other file types, you might need different extraction methods
        // This is a placeholder for DOCX files
        resumeText = `Content of ${file.name} (DOCX extraction not implemented)`
      }

      if (!resumeText || resumeText.trim().length === 0) {
        throw new Error("Failed to extract text from resume")
      }

      // Prepare the prompt for analysis
      const prompt = `
      You are an expert HR recruiter. Analyze the following resume against the job description.
      
      JOB DESCRIPTION:
      ${jobDescription}
      
      RESUME:
      ${resumeText}
      
      Provide a detailed analysis in the following JSON format:
      {
        "name": "Candidate's full name",
        "email": "Candidate's email if available, or 'Not provided'",
        "match_score": "A decimal between 0 and 1 representing how well the candidate matches the job",
        "summary": "A brief 1-2 sentence summary of the candidate's fit",
        "key_skills": ["List", "of", "relevant", "skills", "found", "in", "resume"],
        "strengths": ["List", "of", "candidate's", "strengths", "for", "this", "role"],
        "areas_for_improvement": ["List", "of", "missing", "skills", "or", "experiences"],
        "recommendation": "Your recommendation on whether to interview this candidate"
      }
      
      Return ONLY the JSON with no additional text.
      `

      // Generate the analysis
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse the JSON response
      // First, find the JSON object in the text (in case there's any extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Failed to parse analysis result")
      }

      const jsonStr = jsonMatch[0]
      const analysis = JSON.parse(jsonStr)

      results.push(analysis)
    } catch (error) {
      console.error(`Error analyzing resume ${file.name}:`, error)

      // Add a fallback result for this resume
      results.push(generateFallbackResult(file.name, error instanceof Error ? error.message : "Unknown error"))
    }
  }

  return results
}

function generateMockResults(resumeFiles: File[], jobDescription: string): any[] {
  // Generate mock results for testing without API calls
  return resumeFiles.map((file, index) => {
    const matchScore = 0.5 + Math.random() * 0.4 // Random score between 0.5 and 0.9

    return {
      name: `Candidate ${index + 1}`,
      email: `candidate${index + 1}@example.com`,
      match_score: matchScore,
      summary: `This is a mock analysis of ${file.name} with a match score of ${Math.round(matchScore * 100)}%.`,
      key_skills: ["JavaScript", "React", "Node.js", "TypeScript", "UI/UX Design"],
      strengths: [
        "Strong frontend development experience",
        "Good understanding of modern JavaScript frameworks",
        "Experience with responsive design",
      ],
      areas_for_improvement: [
        "Limited backend experience",
        "No mention of testing methodologies",
        "Could benefit from more project management experience",
      ],
      recommendation:
        matchScore > 0.7
          ? "Recommend interviewing this candidate"
          : "Consider for second round if top candidates are unavailable",
      is_mock: true,
    }
  })
}

function generateFallbackResult(fileName: string, errorMessage: string): any {
  // Generate a fallback result when analysis fails
  return {
    name: `Candidate (${fileName})`,
    email: "Not available",
    match_score: 0.5, // Neutral score
    summary: "Unable to perform detailed analysis on this resume.",
    key_skills: ["Unable to extract skills"],
    strengths: ["Unable to determine strengths"],
    areas_for_improvement: ["Unable to determine areas for improvement"],
    recommendation: "Manual review recommended due to processing error",
    is_fallback: true,
    fallback_reason: errorMessage,
  }
}

