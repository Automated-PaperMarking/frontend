import { Helmet } from "react-helmet-async";

export default function MCQAssessment() {
  return (
    <main>
      <Helmet>
        <title>MCQ Assessment • Coming Soon</title>
        <meta name="description" content="MCQ assessment page coming soon." />
      </Helmet>
      <h1 className="text-2xl font-bold mb-2">MCQ Page — Coming Soon</h1>
      <p className="text-muted-foreground">This section will support question banks, randomization, and auto-grading.</p>
    </main>
  );
}
