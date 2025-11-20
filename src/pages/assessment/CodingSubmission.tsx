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
import { CodingAssessment, LanguageOption, TestCase } from "@/types";
import { getAssessment, updateAssessment } from "@/utils/storage";

const API_BASE = "http://localhost:4000/api";

interface SubmissionPayload {
  gradedResultId: string;
  studentId: string;
  submissionType: "sample" | "final";
  language: string;
  code: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

interface SubmissionResponse {
  success: boolean;
  message: string;
  results?: Array<{
    id: string;
    pass: boolean;
    message: string;
  }>;
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

async function submitCodeToAPI(payload: SubmissionPayload): Promise<SubmissionResponse> {
  try {
    const response = await fetch(`${API_BASE}/submissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit code";
    return {
      success: false,
      message,
    };
  }
}

export default function CodingSubmissionPage() {
  const { id: projectId, assessmentId } = useParams();
  const [assessment, setAssessment] = useState<CodingAssessment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentId, setStudentId] = useState<string>("");
  const [gradedResultId, setGradedResultId] = useState<string>("");

  useEffect(() => {
    if (!projectId || !assessmentId) return;
    const a = getAssessment(projectId, assessmentId);
    if (a && a.type === "coding") setAssessment(a);
  }, [projectId, assessmentId]);

  const title = useMemo(() => assessment?.title || "Coding Assessment", [assessment]);

  const update = (patch: Partial<CodingAssessment["coding"]>) => {
    if (!assessment || !projectId) return;
    const updated: CodingAssessment = { ...assessment, coding: { ...assessment.coding, ...patch } };
    setAssessment(updated);
    updateAssessment(projectId, updated);
  };

  const addTest = (hidden = false) => {
    if (!assessment) return;
    const test: TestCase = { id: crypto.randomUUID(), input: "", expectedOutput: "" };
    const list = hidden ? [...assessment.coding.hiddenTests, test] : [...assessment.coding.publicTests, test];
    update(hidden ? { hiddenTests: list } : { publicTests: list });
  };

  const updateTest = (id: string, patch: Partial<TestCase>, hidden = false) => {
    if (!assessment) return;
    const list = (hidden ? assessment.coding.hiddenTests : assessment.coding.publicTests).map((t) => (t.id === id ? { ...t, ...patch } : t));
    update(hidden ? { hiddenTests: list } : { publicTests: list });
  };

  const run = (all = false) => {
    if (!assessment) return;
    const lang = assessment.coding.language || "javascript";
    const tests = all ? [...assessment.coding.publicTests, ...assessment.coding.hiddenTests] : assessment.coding.publicTests;
    const code = assessment.coding.starterCode || "";
    const results = tests.map((t) => {
      if (lang !== "javascript") return { id: t.id, pass: false, message: "Simulation supports JavaScript only." };
      const r = runJSUserCode(code, t.input);
      const pass = r.ok && r.output.trim() === t.expectedOutput.trim();
      return { id: t.id, pass, message: r.error ? `Error: ${r.error}` : pass ? "Passed" : `Expected '${t.expectedOutput}' but got '${r.output}'` };
    });
    return results;
  };

  const handleRunCode = () => {
    const results = run(false) || [];
    const message = results.map(r => `${r.pass ? '✅' : '❌'} ${r.message}`).join('\n');
    toast.info(message);
  };

  const handleSubmit = async () => {
    if (!assessment || !projectId) {
      toast.error("Assessment not loaded");
      return;
    }

    if (!studentId || !gradedResultId) {
      toast.error("Please enter Student ID and Graded Result ID");
      return;
    }

    setIsSubmitting(true);

    const payload: SubmissionPayload = {
      gradedResultId,
      studentId,
      submissionType: "sample",
      language: assessment.coding.language || "javascript",
      code: assessment.coding.starterCode || "",
      testCases: assessment.coding.publicTests.map((t) => ({
        input: t.input,
        expectedOutput: t.expectedOutput,
      })),
    };

    const response = await submitCodeToAPI(payload);

    if (response.success) {
      toast.success(response.message || "Code submitted successfully!");
    } else {
      toast.error(response.message || "Failed to submit code");
    }

    setIsSubmitting(false);
  };

  if (!assessment) return <div>Loading…</div>;

  return (
    <main className="space-y-6">
      <Helmet>
        <title>{title} • Coding Assessment</title>
        <meta name="description" content="Create coding problems and run submissions against test cases (simulated)." />
      </Helmet>

      <h1 className="text-2xl font-bold">{assessment.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                placeholder="Enter student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gradedResultId">Graded Result ID</Label>
              <Input
                id="gradedResultId"
                placeholder="Enter graded result ID"
                value={gradedResultId}
                onChange={(e) => setGradedResultId(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Problem Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea value={assessment.coding.description || ""} readOnly className="bg-muted" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Sample Input</Label>
              <Textarea value={assessment.coding.sampleInput || ""} readOnly className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label>Sample Output</Label>
              <Textarea value={assessment.coding.sampleOutput || ""} readOnly className="bg-muted" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Language</Label>
            <Textarea value={assessment.coding.language || "javascript"} readOnly className="bg-muted" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public Test Cases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assessment.coding.publicTests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No test cases added yet.</p>
          ) : (
            assessment.coding.publicTests.map((t) => (
              <div key={t.id} className="grid sm:grid-cols-2 gap-3 p-3 border rounded bg-muted/50">
                <div>
                  <Label className="text-xs">Input</Label>
                  <p className="text-sm">{t.input}</p>
                </div>
                <div>
                  <Label className="text-xs">Expected Output</Label>
                  <p className="text-sm">{t.expectedOutput}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hidden Test Cases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assessment.coding.hiddenTests.map((t) => (
            <div key={t.id} className="grid sm:grid-cols-2 gap-3">
              <Textarea placeholder="Input" value={t.input} onChange={(e) => updateTest(t.id, { input: e.target.value }, true)} />
              <Textarea placeholder="Expected Output" value={t.expectedOutput} onChange={(e) => updateTest(t.id, { expectedOutput: e.target.value }, true)} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Code Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Write a function solve(input) that returns the expected output.</p>
          <CodeEditor
            language={(assessment.coding.language || "javascript") === "javascript" ? "javascript" : "plaintext"}
            value={assessment.coding.starterCode || ""}
            onChange={(v) => update({ starterCode: v })}
          />
          <div className="flex gap-3">
            <Button onClick={handleRunCode} disabled={isSubmitting}>
              Run Code
            </Button>
            <Button
              variant="secondary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
