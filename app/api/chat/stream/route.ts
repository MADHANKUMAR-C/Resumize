import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Format messages for Ollama
    const formattedMessages = messages.map((message: any) => ({
      role: message.role,
      content: message.content,
    }))

    // Create a new ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        // Call Ollama API with streaming enabled
        const response = await fetch("http://51.20.69.239:11434/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gemma2",
            messages: formattedMessages,
            stream: true,
          }),
        })

        if (!response.ok) {
          const error = await response.text()
          controller.error(`Ollama API error: ${error}`)
          return
        }

        // Process the stream line by line
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          controller.error("Failed to get reader from response")
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n").filter((line) => line.trim() !== "")

            for (const line of lines) {
              try {
                const parsedLine = JSON.parse(line)
                if (parsedLine.message?.content) {
                  // Send just the content part to the client
                  controller.enqueue(`data: ${JSON.stringify({ content: parsedLine.message.content })}\n\n`)
                }
              } catch (e) {
                console.error("Error parsing JSON:", e)
              }
            }
          }
        } catch (e) {
          controller.error(`Error reading stream: ${e}`)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in stream route:", error)
    return new Response(`data: ${JSON.stringify({ error: "Failed to process your request" })}\n\n`, {
      status: 500,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  }
}
