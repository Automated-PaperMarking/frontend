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

export default function CodingSubmissionPage() {
  const { id: projectId, assessmentId } = useParams();
  const [assessment, setAssessment] = useState<CodingAssessment | null>(null);

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
          <CardTitle>Problem Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea value={assessment.coding.description || ""} onChange={(e) => update({ description: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Sample Input</Label>
              <Textarea value={assessment.coding.sampleInput || ""} onChange={(e) => update({ sampleInput: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Sample Output</Label>
              <Textarea value={assessment.coding.sampleOutput || ""} onChange={(e) => update({ sampleOutput: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Language</Label>
            <select
              className="border rounded-md h-9 px-3 bg-background"
              value={assessment.coding.language || "javascript"}
              onChange={(e) => update({ language: e.target.value as LanguageOption })}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public Test Cases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {assessment.coding.publicTests.map((t) => (
            <div key={t.id} className="grid sm:grid-cols-2 gap-3">
              <Textarea placeholder="Input" value={t.input} onChange={(e) => updateTest(t.id, { input: e.target.value })} />
              <Textarea placeholder="Expected Output" value={t.expectedOutput} onChange={(e) => updateTest(t.id, { expectedOutput: e.target.value })} />
            </div>
          ))}
          <Button variant="secondary" onClick={() => addTest(false)}>Add Public Test</Button>
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
          <Button variant="secondary" onClick={() => addTest(true)}>Add Hidden Test</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Enrollment Key</Label>
            <div className="flex gap-2">
              <Input 
                value={assessment.coding.enrollmentKey || ""} 
                readOnly 
                className="font-mono"
              />
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(assessment.coding.enrollmentKey || "");
                  toast.success("Enrollment key copied!");
                }}
              >
                Copy
              </Button>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Student Registration Link</Label>
            <div className="flex gap-2">
              <Input 
                value={`${window.location.origin}/student/register?projectId=${projectId}&assessmentId=${assessmentId}`}
                readOnly 
                className="text-sm"
              />
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/student/register?projectId=${projectId}&assessmentId=${assessmentId}`);
                  toast.success("Registration link copied!");
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this link with students to allow them to register and take the assessment.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Write a function solve(input) that returns the expected output.</p>
          <CodeEditor
            language={(assessment.coding.language || "javascript") === "javascript" ? "javascript" : "plaintext"}
            value={assessment.coding.starterCode || ""}
            onChange={(v) => update({ starterCode: v })}
          />
          <div className="flex gap-3">
            <Button onClick={() => {
              const results = run(false) || [];
              alert(results.map(r => `${r.pass ? '✅' : '❌'} ${r.message}`).join('\n'));
            }}>Run Code</Button>
            <Button variant="secondary" onClick={() => {
              const results = run(true) || [];
              const pass = results.every(r => r.pass);
              alert(`${pass ? 'All tests passed' : 'Some tests failed'}\n\n` + results.map(r => `${r.pass ? '✅' : '❌'} ${r.message}`).join('\n'));
            }}>Submit</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
