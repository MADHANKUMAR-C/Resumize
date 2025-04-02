# Resumize


Resume Analysis API

This project provides an API to analyze resumes using either Google Gemini API or OpenAI GPT. The API extracts text from uploaded resumes (PDF/DOCX) and evaluates key skills, strengths, weaknesses, and suitability for job positions.

Features

Supports PDF and DOCX resume uploads.

Extracts and analyzes resume text.

Uses Google Gemini API and OpenAI GPT API for analysis.

Returns a structured JSON response with insights.

Includes a mock mode for testing without API calls.

Tech Stack

Backend: Node.js, Express

AI Services: Google Gemini API, OpenAI GPT API

File Handling: Multer, Langchain PDFLoader, DocxLoader

Environment Variables: dotenv

Setup and Installation

Prerequisites

Install Node.js and npm

Get API keys for Google Gemini API and OpenAI GPT API

Installation Steps

Clone the repository:
