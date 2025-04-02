# Resumize

📄 AI-Powered Resume Analyzer
This project analyzes resumes against a job description using Google Gemini or OpenAI GPT models. It extracts key information from PDFs and Word documents, evaluates candidates, and provides a structured analysis.

🚀 Features
✅ AI-Powered Resume Analysis – Uses Gemini 1.5 Pro or GPT-3.5/GPT-4
✅ Supports Multiple Resumes – Upload PDFs or Word documents
✅ Mock Mode Available – Use mock analysis for testing without API keys
✅ JSON-Based Response – Structured insights including match scores, key skills, and recommendations
✅ Fallback Mechanism – If AI API fails, mock analysis is used

⚙️ Installation
  1️⃣ Clone the Repository
    git clone https://github.com/your-username/resume-analyzer.git
    cd resume-analyzer

  2️⃣ Install Dependencies
    npm install

  3️⃣ Set Up Environment Variables
    Create a .env file in the root directory and add your API keys:
        GEMINI_API_KEY= ""

  4️⃣ Run the Development Server
    npm run dev

🔥 Example Response from API
    {
      "results": [
        {
          "name": "John Doe",
          "email": "john.doe@example.com",
          "match_score": 0.85,
          "summary": "Experienced software engineer with 5+ years in full-stack development.",
          "key_skills": ["JavaScript", "React", "Node.js"],
          "strengths": ["Strong problem-solving", "Team collaboration"],
          "areas_for_improvement": ["Cloud experience", "Database optimization"],
          "recommendation": "Proceed with interview"
        }
      ],
    }

  🎭 Mock Mode
    You can enable mock mode if you don't want to use real AI.

  🛠️ Technologies Used
    Next.js – API Routes & Server-side Processing
    Google Gemini API – AI-powered resume analysis
    Tailwind CSS – Styling
    Node.js – Backend processing
    FormData API – Handling file uploads

  📜 License
    MIT License © 2025 Tech Zodia
