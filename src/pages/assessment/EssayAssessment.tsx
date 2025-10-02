import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAssessment, updateAssessment } from "@/utils/storage";
import { EssayAssessment } from "@/types";

export default function EssayAssessmentPage() {
  const { id: projectId, assessmentId } = useParams();
  const [assessment, setAssessment] = useState<EssayAssessment | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!projectId || !assessmentId) return;
    const a = getAssessment(projectId, assessmentId);
    if (a && a.type === "essay") setAssessment(a);
  }, [projectId, assessmentId]);

  const onImagesUpload = async (files: FileList | null) => {
    if (!files || !assessment || !projectId) return;
    const readers = Array.from(files).map(
      (f) =>
        new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve((r.result as string) || "");
          r.readAsDataURL(f);
        })
    );
    const urls = await Promise.all(readers);
    const updated: EssayAssessment = {
      ...assessment,
      studentImages: [...(assessment.studentImages || []), ...urls],
    };
    setAssessment(updated);
    updateAssessment(projectId, updated);
  };

  const runAIEvaluation = () => {
    if (!assessment || !projectId) return;
    const notes = "AI Evaluation (simulated): The student answer matches the model answer in key points. Score: 8/10.";
    const ocr = (assessment.studentImages || []).map((_, i) => `OCR result for image #${i + 1} (simulated)`);
    const updated: EssayAssessment = { ...assessment, aiNotes: notes, ocrResults: ocr };
    setAssessment(updated);
    updateAssessment(projectId, updated);
  };

  const title = useMemo(() => assessment?.title || "Essay Assessment", [assessment]);

  if (!assessment) return <div>Loading…</div>;

  return (
    <main className="space-y-6">
      <Helmet>
        <title>{title} • Essay Assessment</title>
        <meta name="description" content="Upload model answers and student images, view OCR and AI evaluation (simulated)." />
      </Helmet>

      <h1 className="text-2xl font-bold">{assessment.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Model Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={assessment.modelAnswer || ""}
            onChange={(e) => {
              const updated = { ...assessment, modelAnswer: e.target.value } as EssayAssessment;
              setAssessment(updated);
              if (projectId) updateAssessment(projectId, updated);
            }}
            placeholder="Paste or write the model answer here (Markdown supported later)."
            className="min-h-40"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Answer Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => onImagesUpload(e.target.files)} />
          {assessment.studentImages && assessment.studentImages.length > 0 && (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {assessment.studentImages.map((src, i) => (
                <img key={i} src={src} alt={`Student answer ${i + 1}`} className="rounded-md border" loading="lazy" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={runAIEvaluation}>Run AI Evaluation</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{assessment.aiNotes || "No evaluation yet. Click \"Run AI Evaluation\" to simulate."}</p>
          {assessment.ocrResults && assessment.ocrResults.length > 0 && (
            <div className="mt-3 space-y-2">
              <h3 className="font-semibold">OCR Results</h3>
              <ul className="list-disc list-inside text-sm">
                {assessment.ocrResults.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
