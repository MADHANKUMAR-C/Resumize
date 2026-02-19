"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface JobDescriptionProps {
  jobDescription: string
  setJobDescription: (value: string) => void
}

export function JobDescription({ jobDescription, setJobDescription }: JobDescriptionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Description</CardTitle>
        <CardDescription>Enter the job description to match against candidate resumes</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Paste the job description here..."
          className="min-h-[200px]"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />
      </CardContent>
    </Card>
  )
}

