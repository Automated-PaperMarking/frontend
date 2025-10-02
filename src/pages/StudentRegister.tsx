import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { loadProjects } from "@/utils/storage";

export default function StudentRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    if (!studentName.trim() || !studentId.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    
    // Get project and assessment from URL params
    const projectId = searchParams.get("projectId");
    const assessmentId = searchParams.get("assessmentId");
    
    if (!projectId || !assessmentId) {
      toast.error("Invalid assessment link");
      setLoading(false);
      return;
    }

    // Find assessment by IDs
    const projects = loadProjects();
    const project = projects.find(p => p.id === projectId);
    const foundAssessment = project?.assessments.find(a => a.id === assessmentId && a.type === "coding");

    if (!foundAssessment) {
      toast.error("Assessment not found");
      setLoading(false);
      return;
    }

    // Store student session
    const studentSession = {
      studentName,
      studentId,
      assessmentId: assessmentId,
      projectId: projectId,
      enrolledAt: new Date().toISOString(),
    };
    
    localStorage.setItem("student-session", JSON.stringify(studentSession));
    toast.success("Registration successful!");
    
    // Navigate to student assessment
    navigate(`/student/assessment/${projectId}/${foundAssessment.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Helmet>
        <title>Student Registration • AI Grading System</title>
        <meta name="description" content="Register for coding assessment with enrollment key" />
      </Helmet>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Join Assessment</CardTitle>
          <p className="text-muted-foreground">Enter your details to join the coding assessment</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="studentName">Full Name</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter your student ID"
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registering..." : "Join Assessment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}