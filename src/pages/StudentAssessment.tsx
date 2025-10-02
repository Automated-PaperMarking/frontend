import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import CodeEditor from "@/components/Editor";
import { CodingAssessment } from "@/types";
import { getAssessment } from "@/utils/storage";

function runJSUserCode(userCode: string, input: string): { ok: boolean; output: string; error?: string } {
  try {
    const fn = new Function(`${userCode}; return typeof solve === 'function' ? solve : null;`);
    const solve = fn();
    if (typeof solve !== "function") {
      return { ok: false, output: "", error: "Please define a function named solve(input)." };
    }
    const result = solve(input);
    return { ok: true, output: String(result ?? "") };
  } catch (e: any) {
    return { ok: false, output: "", error: String(e?.message || e) };
  }
}

export default function StudentAssessment() {
  const { projectId, assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<CodingAssessment | null>(null);
  const [studentCode, setStudentCode] = useState("");
  const [studentSession, setStudentSession] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check student session
    const sessionData = localStorage.getItem("student-session");
    if (!sessionData) {
      navigate("/student/register");
      return;
    }

    const session = JSON.parse(sessionData);
    if (session.projectId !== projectId || session.assessmentId !== assessmentId) {
      navigate("/student/register");
      return;
    }

    setStudentSession(session);

    // Load assessment
    if (!projectId || !assessmentId) return;
    const a = getAssessment(projectId, assessmentId);
    if (a && a.type === "coding") {
      setAssessment(a);
      setStudentCode(a.coding.starterCode || "");
    }
  }, [projectId, assessmentId, navigate]);

  const runCode = () => {
    if (!assessment) return;
    
    const results = assessment.coding.publicTests.map((test) => {
      const result = runJSUserCode(studentCode, test.input);
      const pass = result.ok && result.output.trim() === test.expectedOutput.trim();
      return {
        input: test.input,
        expected: test.expectedOutput,
        actual: result.output,
        pass,
        error: result.error
      };
    });

    const allPassed = results.every(r => r.pass);
    const message = results.map(r => 
      `Input: ${r.input}\nExpected: ${r.expected}\nActual: ${r.actual}\nResult: ${r.pass ? '✅ Pass' : '❌ Fail'}${r.error ? `\nError: ${r.error}` : ''}`
    ).join('\n\n');

    alert(`${allPassed ? 'All public tests passed!' : 'Some tests failed'}\n\n${message}`);
  };

  const submitCode = () => {
    if (!assessment || !studentSession) return;

    // Save submission
    const submission = {
      studentName: studentSession.studentName,
      studentId: studentSession.studentId,
      code: studentCode,
      submittedAt: new Date().toISOString(),
      assessmentId: assessment.id,
      projectId: projectId
    };

    const submissions = JSON.parse(localStorage.getItem("student-submissions") || "[]");
    submissions.push(submission);
    localStorage.setItem("student-submissions", JSON.stringify(submissions));

    setSubmitted(true);
    toast.success("Code submitted successfully!");
  };

  if (!assessment || !studentSession) {
    return <div>Loading...</div>;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-green-600">Submission Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your code has been submitted successfully. You may now close this window.
            </p>
            <p className="text-sm text-muted-foreground">
              Submitted by: {studentSession.studentName} ({studentSession.studentId})
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Helmet>
        <title>{assessment.title} • Student Assessment</title>
        <meta name="description" content="Take coding assessment as a student" />
      </Helmet>

      <div className="container mx-auto p-4">
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg shadow-lg">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {assessment.title}
                </h1>
                <p className="text-muted-foreground">
                  Student: {studentSession.studentName} ({studentSession.studentId})
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Language</p>
                <p className="font-semibold capitalize">{assessment.coding.language || "JavaScript"}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Problem Description
                  </CardTitle>
                </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm whitespace-pre-wrap">
                  {assessment.coding.description || "No description provided."}
                </p>
              </div>
              
              {assessment.coding.sampleInput && (
                <div>
                  <h4 className="font-medium mb-2">Sample Input</h4>
                  <pre className="text-sm bg-muted p-2 rounded">
                    {assessment.coding.sampleInput}
                  </pre>
                </div>
              )}
              
              {assessment.coding.sampleOutput && (
                <div>
                  <h4 className="font-medium mb-2">Sample Output</h4>
                  <pre className="text-sm bg-muted p-2 rounded">
                    {assessment.coding.sampleOutput}
                  </pre>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Public Test Cases</h4>
                <div className="space-y-2">
                  {assessment.coding.publicTests.map((test, idx) => (
                    <div key={test.id} className="border rounded p-2">
                      <p className="text-sm"><strong>Test {idx + 1}</strong></p>
                      <p className="text-xs text-muted-foreground">Input: {test.input}</p>
                      <p className="text-xs text-muted-foreground">Expected: {test.expectedOutput}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Code Editor
                  </CardTitle>
                </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Write a function named `solve(input)` that returns the expected output.
              </p>
              
              <CodeEditor
                language={(assessment.coding.language || "javascript") === "javascript" ? "javascript" : "plaintext"}
                value={studentCode}
                onChange={setStudentCode}
                height="400px"
              />
              
                <div className="flex gap-2">
                  <Button onClick={runCode} variant="outline" className="flex-1">
                    <span className="mr-2">▶</span>
                    Run Tests
                  </Button>
                  <Button onClick={submitCode} className="flex-1">
                    <span className="mr-2">🚀</span>
                    Submit Code
                  </Button>
                </div>
               </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}