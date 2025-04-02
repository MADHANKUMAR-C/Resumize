"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ResultsDisplayProps {
  results: any[]
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(results.length > 0 ? 0 : null)

  const sortedResults = [...results].sort((a, b) => b.match_score - a.match_score)

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Analysis Results</CardTitle>
        <CardDescription>{results.length} resumes analyzed and ranked by match score</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ranked" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ranked">Ranked List</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          </TabsList>

          <TabsContent value="ranked" className="space-y-4">
            {sortedResults.map((result, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  setSelectedCandidate(index)
                  document.querySelector('[data-value="detailed"]')?.click()
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{result.name}</h3>
                  <div className="flex items-center gap-2">
                    {(result.is_mock || result.is_fallback) && (
                      <Badge variant="outline" className="bg-yellow-50">
                        {result.is_mock ? "Mock" : "Fallback"}
                      </Badge>
                    )}
                    <Badge variant={index < 3 ? "default" : "outline"}>
                      {Math.round(result.match_score * 100)}% Match
                    </Badge>
                  </div>
                </div>
                <Progress value={result.match_score * 100} className="h-2" />
                <div className="mt-2 text-sm text-gray-500">
                  <p>{result.summary}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.key_skills.slice(0, 5).map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                  {result.key_skills.length > 5 && (
                    <Badge variant="outline">+{result.key_skills.length - 5} more</Badge>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="detailed">
            {selectedCandidate !== null ? (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{sortedResults[selectedCandidate].name}</h2>
                    <p className="text-gray-500">{sortedResults[selectedCandidate].email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(sortedResults[selectedCandidate].is_mock || sortedResults[selectedCandidate].is_fallback) && (
                      <Badge variant="outline" className="bg-yellow-50">
                        {sortedResults[selectedCandidate].is_mock ? "Mock Analysis" : "Fallback Analysis"}
                      </Badge>
                    )}
                    <Badge size="lg">{Math.round(sortedResults[selectedCandidate].match_score * 100)}% Match</Badge>
                  </div>
                </div>

                {sortedResults[selectedCandidate].is_fallback && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This analysis was generated using fallback mode due to an API error:{" "}
                      {sortedResults[selectedCandidate].fallback_reason}
                    </AlertDescription>
                  </Alert>
                )}

                {sortedResults[selectedCandidate].is_mock && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      This is a simulated analysis generated without using Machine Learning.
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <h3 className="text-lg font-medium mb-2">Summary</h3>
                  <p>{sortedResults[selectedCandidate].summary}</p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Key Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {sortedResults[selectedCandidate].key_skills.map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Strengths</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {sortedResults[selectedCandidate].strengths.map((strength: string, i: number) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Areas for Improvement</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {sortedResults[selectedCandidate].areas_for_improvement.map((area: string, i: number) => (
                      <li key={i}>{area}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Recommendation</h3>
                  <p>{sortedResults[selectedCandidate].recommendation}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a candidate from the ranked list to view details
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

