import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { auth } from "@/utils/storage";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    auth.login(email || "teacher@example.com");
    navigate("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center gradient-surface">
      <Helmet>
        <title>Login • AI Grading System</title>
        <meta name="description" content="Login to the AI-aided grading system." />
        <link rel="canonical" href={`${window.location.origin}/login`} />
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" aria-label="Login form">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
