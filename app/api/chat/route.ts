import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Format messages for Ollama
    const formattedMessages = messages.map((message: any) => ({
      role: message.role,
      content: message.content,
    }))

    // Call Ollama API (running locally)
    const response = await fetch("http://51.20.69.239:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemma2", // Use the Llama 3 model
        messages: formattedMessages,
        stream: false,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API error: ${error}`)
    }

    const data = await response.json()

    return NextResponse.json({
      response: data.message.content,
    })
  } catch (error) {
    console.error("Error in chat route:", error)
    return NextResponse.json({ error: "Failed to process your request" }, { status: 500 })
  }
}
