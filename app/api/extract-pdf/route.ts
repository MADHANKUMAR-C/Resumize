import type { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // Use Gemini to extract text from the PDF
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    if (!GEMINI_API_KEY) {
      return Response.json({ error: "Gemini API key is not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const mimeType = file.type

    // Create the prompt for Gemini
    const prompt =
      "Extract all text content from this PDF document. Return only the extracted text, with no additional commentary."

    // Generate content with the PDF
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
    ])

    const response = await result.response
    const text = response.text()

    return Response.json({ text })
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to extract text from PDF",
      },
      { status: 500 },
    )
  }
}

