import { Navigate, Route, Routes } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AppLayout from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ProjectPage from "@/pages/Project";
import Profile from "@/pages/Profile";
import StudentRegister from "@/pages/StudentRegister";
import StudentAssessment from "@/pages/StudentAssessment";
import AssessmentRouter from "@/pages/assessment/AssessmentRouter";
import { auth } from "@/utils/storage";
import ProblemCollection from "@/pages/ProblemCollection";

function Protected({ children }: { children: React.ReactNode }) {
  return auth.isLoggedIn() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  const isAuthed = auth.isLoggedIn();
  return (
    <>
      <Helmet>
        <title>AI Grading System</title>
        <meta name="description" content="Modern AI-aided grading system for teachers to manage projects and assessments." />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      <Routes>
        <Route path="/" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/assessment/:projectId/:assessmentId" element={<StudentAssessment />} />
        <Route
          path="/"
          element={
            <Protected>
              <AppLayout>
                {/* children routed below */}
              </AppLayout>
            </Protected>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="problems" element={<ProblemCollection />} />
          <Route path="profile" element={<Profile />} />
          <Route path="project/:id" element={<ProjectPage />} />
          <Route path="project/:id/assessment/:assessmentId" element={<AssessmentRouter />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthed ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
}
