"use client"

import type React from "react"

import { useState } from "react"
import { AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ResumeUploader } from "@/components/resume-uploader"
import { JobDescription } from "@/components/job-description"
import { ResultsDisplay } from "@/components/results-display"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

export default function Home() {
  const [jobDescription, setJobDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useMockMode, setUseMockMode] = useState(false)
  const [analysisMode, setAnalysisMode] = useState<"api" | "mock" | null>(null)
  const [modelType] = useState<string>("ML Analysis")
  const [usedModel, setUsedModel] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0 || !jobDescription) {
      setError("Please upload at least one resume and provide a job description")
      return
    }

    setIsLoading(true)
    setError(null)
    setAnalysisMode(null)
    setUsedModel(null)

    try {
      const formData = new FormData()
      formData.append("jobDescription", jobDescription)
      formData.append("useMockMode", useMockMode.toString())
      formData.append("modelType", modelType)

      files.forEach((file, index) => {
        formData.append(`resume-${index}`, file)
      })

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resumes")
      }

      if (data.results && data.results.length > 0) {
        setResults(data.results)
        setAnalysisMode(data.mode || "api")
        setUsedModel(data.model || null)
      } else {
        setError("No results were returned from the analysis")
      }
    } catch (error) {
      console.error("Error analyzing resumes:", error)
      setError(error instanceof Error ? error.message : "An error occurred while analyzing the resumes")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">AI Resume Screening System</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Switch id="mock-mode" checked={useMockMode} onCheckedChange={setUseMockMode} />
          <Label htmlFor="mock-mode">Use Mock Mode (No ML)</Label>
          <div className="relative ml-1 cursor-help group">
            <Info className="h-4 w-4 text-muted-foreground" />
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-popover text-popover-foreground p-2 rounded shadow-lg w-64 text-sm z-50">
              Mock mode uses simulated analysis without using AI
            </div>
          </div>
        </div>

        {!useMockMode && (
          <div className="flex items-center gap-2">
            <Label>Model:</Label>
            <span className="font-medium">ML Analysis</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <JobDescription jobDescription={jobDescription} setJobDescription={setJobDescription} />

        <ResumeUploader files={files} setFiles={setFiles} />
      </div>

      <div className="flex justify-center mb-8">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || files.length === 0 || !jobDescription}
          className="w-full max-w-md"
        >
          {isLoading ? "Analyzing..." : "Analyze Resumes"}
        </Button>
      </div>

      {results.length > 0 && <ResultsDisplay results={results} />}
    </main>
  )
}
