import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import CodeEditor from "@/components/Editor";
import { get } from "@/lib/api";

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

export default function ProblemSubmission() {
  const { problemId } = useParams<{ problemId: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState(`// Example starter code

function solve(input) {
  // 1. Convert the input string to a number
  const number = Number(input);

  // 2. Add 10 and return the result
  return number + 10;

  // Remove the body of the function and implement your solution here
}`);

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

  const run = (all = false) => {
    const tests = all ? problem?.testCases : sampleTests;
    const results = (tests || []).map((t) => {
      const r = runJSUserCode(code, t.input);
      const pass = r.ok && r.output.trim() === t.expectedOutput.trim();
      return { id: t.id, pass, message: r.error ? `Error: ${r.error}` : pass ? "Passed" : `Expected '${t.expectedOutput}' but got '${r.output}'` };
    });
    return results;
  };

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
          <select className="border rounded-md h-9 px-3 bg-background" value={"javascript"}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
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
              const message = results.map(r => `${r.pass ? '✅' : '❌'} ${r.message}`).join('\n');
              toast.success(message);
            }}>
              Run Sample Tests
            </Button>
            {hiddenTests.length > 0 && (<Button onClick={() => {
              const results = run(true);
              const pass = results.every(r => r.pass);
              const message = `${pass ? '✅ All tests passed!' : '❌ Some tests failed'}\n\n${results.map(r => `${r.pass ? '✅' : '❌'} ${r.message}`).join('\n')}`;
              if (pass) {
                toast.success(message);
              } else {
                toast.error(message);
              }
            }}>
              Run Sample & Hidden Tests
            </Button>)}
            <Button variant="secondary" onClick={() => {
              // const results = run(true);
              // const pass = results.every(r => r.pass);
              // const message = `${pass ? '✅ All tests passed!' : '❌ Some tests failed'}\n\n${results.map(r => `${r.pass ? '✅' : '❌'} ${r.message}`).join('\n')}`;
              // if (pass) {
              //   toast.success(message);
              // } else {
              //   toast.error(message);
              // }
            }}>
              Submit Solution
            </Button>
          </div>
        </CardContent>
      </Card>

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
