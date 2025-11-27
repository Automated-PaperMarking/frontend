import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { loadProjects } from "@/utils/storage";
import { Eye, EyeOff } from "lucide-react";
import { API_BASE } from "@/config/env";

export default function StudentRegister() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentConfirmPassword, setStudentConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    if (!studentFirstName.trim() || !studentLastName.trim() || !studentEmail.trim() || !studentPassword.trim() || !studentConfirmPassword.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (studentPassword !== studentConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    // // Store student session
    // const studentSession = {
    //   studentFirstName,
    //   studentLastName,
    //   studentEmail,
    //   assessmentId: assessmentId,
    //   projectId: projectId,
    //   enrolledAt: new Date().toISOString(),
    // };
    
    // localStorage.setItem("student-session", JSON.stringify(studentSession));
    toast.success("Registration successful!");
    
    // Navigate to student assessment
    // navigate(`/student/assessment/${projectId}/${foundAssessment.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Helmet>
        <title>Student Registration • AI Grading System</title>
        <meta name="description" content="Register for coding assessment with enrollment key" />
      </Helmet>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Student Registration</CardTitle>
          <p className="text-muted-foreground">Enter your details to join the coding assessment</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="studentFirstName">First Name</Label>
            <Input
              id="studentFirstName"
              value={studentFirstName}
              onChange={(e) => setStudentFirstName(e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="studentLastName">Last Name</Label>
            <Input
              id="studentLastName"
              value={studentLastName}
              onChange={(e) => setStudentLastName(e.target.value)}
              placeholder="Enter your last name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="studentEmail">Email</Label>
            <Input
              id="studentEmail"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="studentPassword">Password</Label>
            <div className="relative">
            <Input
              id="studentPassword"
              type={showPassword ? "text" : "password"}
              value={studentPassword}
              onChange={(e) => setStudentPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="studentConfirmPassword">Confirm Password</Label>
            <div className="relative">
            <Input
              id="studentConfirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={studentConfirmPassword}
              onChange={(e) => setStudentConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          </div>
          <Button 
            className="w-full" 
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}