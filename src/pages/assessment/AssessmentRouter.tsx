import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MCQAssessment from "./MCQAssessment";
import EssayAssessment from "./EssayAssessment";
import CodingAssessment from "./CodingAssessment";
import CodingSubmissionPage from "./CodingSubmission";
import { Assessment } from "@/types";
import { auth, getAssessment } from "@/utils/storage";

export default function AssessmentRouter() {
  const { id: projectId, assessmentId } = useParams();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const role = auth.getRole();

  useEffect(() => {
    if (!projectId || !assessmentId) return;
    const a = getAssessment(projectId, assessmentId);
    if (a) setAssessment(a);
  }, [projectId, assessmentId]);

  if (!assessment) return <div>Loading…</div>;

  if (role === "teacher") {
    if (assessment.type === "mcq") return <MCQAssessment />;
    if (assessment.type === "essay") return <EssayAssessment />;
    return <CodingAssessment />;
  }

  if (role === "student") {
    if (assessment.type === "mcq") return <MCQAssessment />;
    if (assessment.type === "essay") return <EssayAssessment />;
    return <CodingSubmissionPage />;
  }

  return null;
}
