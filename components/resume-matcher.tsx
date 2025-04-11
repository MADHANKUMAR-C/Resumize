"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, FileText, CheckCircle, XCircle, AlertCircle, Zap } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

type MatchResult = {
  matchPercentage: number
  matchedSkills: string[]
  missingSkills: string[]
  suggestions: string[]
  explanation: string
  modelUsed?: string
  error?: string
  rawResponse?: string
}

export function ResumeMatcher() {
  const [jobDescription, setJobDescription] = useState("")
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MatchResult | null>(null)
  const [processingTime, setProcessingTime] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit. Please upload a smaller file.")
        setResumeFile(null)
        return
      }

      if (
        file.type === "application/pdf" ||
        file.name.endsWith(".pdf") ||
        file.type === "text/plain" ||
        file.name.endsWith(".txt") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        setResumeFile(file)
        setError(null)
      } else {
        setError("Please upload a PDF, TXT, or DOCX file")
        setResumeFile(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!resumeFile) {
      setError("Please upload a resume file")
      return
    }

    if (!jobDescription.trim()) {
      setError("Please enter a job description")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setProcessingTime(null)

    const startTime = Date.now()

    try {
      const formData = new FormData()
      formData.append("resume", resumeFile)
      formData.append("jobDescription", jobDescription)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1200000) // 1 minute timeout

      const response = await fetch("/api/match-resume", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const endTime = Date.now()
      setProcessingTime(endTime - startTime)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Server responded with ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setResult(data)
    } catch (err: any) {
      if (err.name === "AbortError") {
        setError(
          "Request timed out. Try with a shorter resume or job description, or check if Ollama is running properly.",
        )
      } else {
        setError(err.message || "Failed to analyze resume")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resume Matcher</CardTitle>
          <CardDescription>Upload your resume and paste a job description to see how well they match</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload Resume</label>
              <div
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.txt,.docx"
                />
                {resumeFile ? (
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    <span className="font-medium">{resumeFile.name}</span>
                    <span className="text-xs text-muted-foreground">({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">PDF, TXT, or DOCX (max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Description</label>
              <Textarea
                placeholder="Paste the job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground text-right">{jobDescription.length} characters</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !resumeFile || !jobDescription.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Resume...
              </>
            ) : (
              "Analyze Resume"
            )}
          </Button>
        </CardFooter>
      </Card>

      {isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis in Progress</CardTitle>
            <CardDescription>Please wait while we analyze your resume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Processing</h3>
              </div>
              <Progress value={undefined} className="h-2" />
            </div>

            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Analysis Results</span>
              {result.modelUsed && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
                >
                  <Zap className="h-3 w-3" />
                  {result.modelUsed}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Here's how your resume matches the job description
              {processingTime && (
                <span className="text-xs text-muted-foreground ml-2">
                  (Processed in {(processingTime / 1000).toFixed(1)} seconds)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Match Percentage</h3>
                <span className="text-lg font-bold">{result.matchPercentage}%</span>
              </div>
              <Progress value={result.matchPercentage} className="h-2" />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Matched Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.matchedSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    {skill}
                  </Badge>
                ))}
                {result.matchedSkills.length === 0 && (
                  <p className="text-sm text-muted-foreground">No matched skills found</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Missing Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.missingSkills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800"
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    {skill}
                  </Badge>
                ))}
                {result.missingSkills.length === 0 && (
                  <p className="text-sm text-muted-foreground">No missing skills found</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Suggestions to Improve</h3>
              <ul className="list-disc pl-5 space-y-1">
                {result.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Explanation</h3>
              <p className="text-sm whitespace-pre-wrap">{result.explanation}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
