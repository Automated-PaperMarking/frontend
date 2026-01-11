import { useEffect, useMemo, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import CodeEditor from "@/components/Editor";
import { get, post } from "@/lib/api";
import { auth } from "@/utils/storage";

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  type: "SAMPLE" | "HIDDEN";
  problemId: string;
}

interface Problem {
  id: string;
  title: string;
  statement: string;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  contestId: string | null;
  testCases: TestCase[];
  createdAt: string;
  updatedAt: string;
}

type SubmissionType = "SAMPLE" | "HIDDEN";

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

interface SubmissionResult {
  id: string;
  code: string;
  submissionType: string;
  language: string;
  studentId: string;
  problemId: string;
  understandingLogic: number;
  correctnessScore: number;
  readabilityScore: number;
  totalScore: number;
  comment: string;
  gradingResultStatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProblemSubmission() {
  const { problemId, contestId: contestIdParam } = useParams<{ problemId: string; contestId: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState(`// Example starter code

function solve(input) {
  // 1. Convert the input string to a number
  const number = Number(input);

  // 2. Add 10 and return the result
  return number + 10;

  // Remove the body of the function and implement your solution here
}`);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
    const [polling, setPolling] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [language, setLanguage] = useState<"javascript" | "python">("javascript");
  const [submissionType, setSubmissionType] = useState<SubmissionType>("SAMPLE");

  useEffect(() => {
    const loadProblem = async () => {
      if (!problemId) return;
      setLoading(true);
      try {
        const res = await get<any>(`/v1/problems/${problemId}`);
        if (res.ok && res.data) {
          const data = res.data?.data || res.data;
          setProblem(data);
        } else {
          toast.error(res.error || "Failed to load problem");
        }
      } catch (err) {
        toast.error(String(err));
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [problemId]);

  const title = useMemo(() => problem?.title || "Problem Submission", [problem]);

  const sampleTests = problem?.testCases.filter(t => t.type === "SAMPLE") || [];
  const hiddenTests = problem?.testCases.filter(t => t.type === "HIDDEN") || [];
  const contestId = contestIdParam || problem?.contestId || "";

  const run = (all = false) => {
    const tests = all ? problem?.testCases : sampleTests;
    const results = (tests || []).map((t) => {
      const r = runJSUserCode(code, t.input);
      const pass = r.ok && r.output.trim() === t.expectedOutput.trim();
      return { id: t.id, pass, message: r.error ? `Error: ${r.error}` : pass ? "Passed" : `Expected '${t.expectedOutput}' but got '${r.output}'` };
    });
    return results;
  };

  const handleSubmit = async () => {
    if (!problemId || !problem) {
      toast.error("Problem not found");
      return;
    }

    const user = auth.getUser();
    if (!user?.id) {
      toast.error("You need to be logged in to submit.");
      return;
    }

    setSubmitting(true);
    setSubmissionResult(null);
    try {
      const payload = {
        code,
        submissionType,
        language,
        studentId: user.id,
        problemId,
        contestId,
      };

      const res = await post<any>("/api/submissions", payload);
      if (res.ok && res.data && res.data.message) {
        toast.success("Submission sent successfully. Grading in progress...");
        const submissionId = res.data.message;
        setPolling(true);
        // Start polling every 5 seconds
        const poll = async () => {
          const result = await get<any>(`/api/submissions/${submissionId}`);
          if (result.ok && result.data && result.data.code === "200") {
            setSubmissionResult(result.data.data);
            // If status is COMPLETED, stop polling. If PENDING, continue polling.
            if (result.data.data.gradingResultStatus === "COMPLETED") {
              setPolling(false);
              if (pollingRef.current) clearTimeout(pollingRef.current);
              toast.success("Grading completed.");
            } else if (result.data.data.gradingResultStatus === "PENDING") {
              pollingRef.current = setTimeout(poll, 5000);
            }
          } else if (polling) {
            pollingRef.current = setTimeout(poll, 5000);
          }
        };
        poll();
      } else {
        toast.error(res.error || "Submission failed");
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, []);

  if (loading) return <div className="p-6">Loading problem…</div>;
  if (!problem) return <div className="p-6">Problem not found.</div>;

  return (
    <main className="space-y-6">
      <Helmet>
        <title>{title} • Problem Submission</title>
        <meta name="description" content="Submit your solution for the coding problem." />
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold">{problem.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          <span className="inline-block bg-slate-100 px-2 py-1 rounded">{problem.difficultyLevel}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Problem Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{problem.statement}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              className="border rounded-md h-9 px-3 bg-background"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "javascript" | "python")}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>

            {/* <select
              className="border rounded-md h-9 px-3 bg-background"
              value={submissionType}
              onChange={(e) => setSubmissionType(e.target.value as SubmissionType)}
            >
              <option value="SAMPLE">SAMPLE (visible tests)</option>
              <option value="HIDDEN">HIDDEN (all tests)</option>
            </select> */}
          </div>
        </CardContent>
      </Card>

      {sampleTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Test Cases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sampleTests.map((t) => (
              <div key={t.id} className="grid sm:grid-cols-2 gap-4 p-3 border rounded-lg">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Input</Label>
                  <div className="bg-slate-50 p-2 rounded text-sm font-mono whitespace-pre-wrap break-words">
                    {t.input}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Expected Output</Label>
                  <div className="bg-slate-50 p-2 rounded text-sm font-mono whitespace-pre-wrap break-words">
                    {t.expectedOutput}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Code Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Write a function <code className="bg-slate-100 px-2 py-1 rounded">solve(input)</code> that returns the expected output.</p>
          <CodeEditor
            language="javascript"
            value={code}
            onChange={setCode}
          />
          <div className="flex gap-3">
            <Button onClick={() => {
              const results = run(false);
              const pass = results.every((r) => r.pass);
              const message = results.map(r => `${r.pass ? '✅' : '❌'} ${r.message}`).join('\n');
              if (pass) {
                toast.success(<div className="whitespace-pre-wrap">{message}</div>);
              } else {
                toast.error(<div className="whitespace-pre-wrap">{message}</div>);
              }
            }}>
              Run Sample Tests
            </Button>
            {hiddenTests.length > 0 && (<Button onClick={() => {
              const results = run(true);
              const pass = results.every(r => r.pass);
              const message = `${pass ? '✅ All tests passed!' : '❌ Some tests failed'}\n\n${results.map(r => `${r.pass ? '✅' : '❌'} ${r.message}`).join('\n')}`;
              if (pass) {
                toast.success(<div className="whitespace-pre-wrap">{message}</div>);
              } else {
                toast.error(<div className="whitespace-pre-wrap">{message}</div>);
              }
            }}>
              Run Sample & Hidden Tests
            </Button>)}
            <Button
              variant="secondary"
              onClick={() => { handleSubmit(); }}
              disabled={submitting || polling}
            >
              {polling ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Grading...
                </span>
              ) : "Submit Solution"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Show grading result if available */}
      {submissionResult && (
        <Card className="border-2 border-blue-400 shadow-lg">
          <CardHeader className="bg-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2l4-4" /></svg>
              Submission Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${submissionResult.gradingResultStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{submissionResult.gradingResultStatus}</span>
                </div>
                <div className="flex items-center gap-2 text-lg font-bold">
                  <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Total Score: <span className="ml-2 text-blue-700">{submissionResult.totalScore}</span>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-green-600 font-semibold text-lg">{submissionResult.correctnessScore}</span>
                    <span className="text-xs text-gray-500">Correctness</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-purple-600 font-semibold text-lg">{submissionResult.readabilityScore}</span>
                    <span className="text-xs text-gray-500">Readability</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-orange-600 font-semibold text-lg">{submissionResult.understandingLogic}</span>
                    <span className="text-xs text-gray-500">Understanding</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-gray-600 mb-1">Comment</span>
                  <div className="bg-gray-50 border border-gray-200 rounded p-2 text-sm min-h-[32px]">{submissionResult.comment || <span className="text-gray-400">No comment</span>}</div>
                </div>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-600 mb-1">Submitted Code</span>
                <pre className="bg-slate-100 border border-slate-200 rounded p-3 text-sm overflow-x-auto whitespace-pre-wrap max-h-64">{submissionResult.code}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hiddenTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hidden Test Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This problem has {hiddenTests.length} hidden test case(s) that will be evaluated when you submit.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
