import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AssessmentCard from "@/components/AssessmentCard";
import ProblemCard from "@/components/ProblemCard";
import Leaderboard from "@/components/Leaderboard";
import { AssessmentType, Project } from "@/types";
import { addAssessment } from "@/utils/storage";
import { get, post } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface Problem {
  id: string;
  title: string;
  statement: string;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  contestId: string | null;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
    type: "SAMPLE" | "HIDDEN";
    problemId: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Coding problem states
  const [title, setTitle] = useState("");
  const [statement, setStatement] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("EASY");
  const [testCases, setTestCases] = useState<Array<{ id: string; input: string; expectedOutput: string; type: "SAMPLE" | "HIDDEN" }>>(
    [{ id: crypto.randomUUID(), input: "", expectedOutput: "", type: "SAMPLE" }]
  );

  const loadContest = async () => {
      try {
        const res = await get<any>(`/v1/contests/{id}?id=${id}`);
        if (res.ok && res.data) {
          const raw = res.data.data || res.data;
          const p: Project = {
            id: raw.id || raw._id || id,
            name: raw.name || raw.title || "Untitled",
            description: raw.description || "",
            enrollmentKey: raw.enrollmentKey || raw.enrollment_key || "",
            startTime: raw.startTime || raw.start_time,
            endTime: raw.endTime || raw.end_time,
            createdAt: raw.createdAt || raw.startTime || new Date().toISOString(),
            updatedAt: raw.updatedAt || raw.updated_at || undefined,
            assessments: raw.assessments || [],
          };
          setProject(p);
          return;
        }
      } catch (err) {
        // ignore and fallback
      }
    }

  const loadProblems = async () => {
    if (!id) return;
    setLoadingProblems(true);
    try {
      const res = await get<any>(`/v1/contests/problems/${id}`);
      if (res.ok && res.data) {
        let raw = res.data;
        let problemsList: Problem[] = [];

        // Handle different response structures
        if (Array.isArray(raw)) {
          problemsList = raw;
        } else if (raw && Array.isArray(raw.data)) {
          problemsList = raw.data;
        } else if (raw && raw.data && Array.isArray(raw.data.data)) {
          problemsList = raw.data.data;
        } else {
          problemsList = [];
        }

        setProblems(problemsList);
      } else {
        setProblems([]);
        toast.error(res.error || "Failed to load problems");
      }
    } catch (err) {
      toast.error(String(err));
      setProblems([]);
    } finally {
      setLoadingProblems(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadContest();
    loadProblems();
  }, [id]);

  const createdAt = useMemo(() => (project ? format(new Date(project.createdAt || project.startTime ||  Date.now()), "PPpp") : ""), [project]);
  const updatedAt = useMemo(() => (project && project.updatedAt ? format(new Date(project.updatedAt), "PPpp") : ""), [project]);

  const addTestCase = (type: "SAMPLE" | "HIDDEN" = "SAMPLE") => {
    setTestCases([...testCases, { id: crypto.randomUUID(), input: "", expectedOutput: "", type }]);
  };

  const updateTestCase = (id: string, patch: Partial<{ input: string; expectedOutput: string; type: "SAMPLE" | "HIDDEN" }>) => {
    setTestCases(testCases.map((tc) => (tc.id === id ? { ...tc, ...patch } : tc)));
  };

  const removeTestCase = (id: string) => {
    setTestCases(testCases.filter((tc) => tc.id !== id));
  };

  const onCreate = async () => {
    if (!id || !title.trim() || !statement.trim()) {
      toast.error("Please fill in title and statement");
      return;
    }
    
    if (testCases.length === 0) {
      toast.error("Please add at least one test case");
      return;
    }

    setCreating(true);
    try {
      const payload = {
        title: title.trim(),
        statement: statement.trim(),
        difficultyLevel,
        testCases: testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          type: tc.type,
        })),
      };

      const res = await post<any>("/v1/problems", payload);
      if (res.ok) {
        // Extract problem ID from response - it's returned directly as a string in data
        const problemId = res.data?.data || res.data;
        
        if (problemId && typeof problemId === 'string') {
          // Assign problem to contest
          const assignRes = await post<any>("/v1/contests/assign-problems", {
            contestId: id,
            problemIds: [problemId],
          });
          
          if (assignRes.ok) {
            toast.success("Coding problem created and assigned successfully!");
          } else {
            toast.error("Problem created but failed to assign to contest: " + (assignRes.error || "Unknown error"));
          }
        } else {
          toast.error("Problem created but ID not found in response");
        }
        
        setOpen(false);
        setTitle("");
        setStatement("");
        setDifficultyLevel("EASY");
        setTestCases([{ id: crypto.randomUUID(), input: "", expectedOutput: "", type: "SAMPLE" }]);
        // Refresh project data
        await loadProblems();
      } else {
        toast.error(res.error || "Failed to create problem");
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setCreating(false);
    }
  };

  if (!id) return <div>Project not found.</div>;
  if (!project) return <div className="p-6">Loading contest…</div>;

  return (
    <>
      <Helmet>
        <title>{project.name} • Project</title>
        <meta name="description" content={`Manage assessments in project ${project.name}.`} />
        <link rel="canonical" href={`${window.location.origin}/project/${project.id}`} />
      </Helmet>
      <article className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">Start: {createdAt}</p>
            {project.endTime && <p className="text-sm text-muted-foreground">End: {format(new Date(project.endTime), "PPpp")}</p>}
            {project.createdAt && <p className="text-sm text-muted-foreground">Created: {format(new Date(project.createdAt), "PPpp")}</p>}
            {project.updatedAt && <p className="text-sm text-muted-foreground">Updated: {updatedAt}</p>}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Create Assessment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Coding Problem</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input 
                    placeholder="Problem title" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                  />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Problem Statement</label>
                  <Textarea 
                    placeholder="Describe the problem..." 
                    value={statement} 
                    onChange={(e) => setStatement(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Difficulty Level</label>
                  <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <label className="text-sm font-medium">Test Cases</label>
                  {testCases.map((tc) => (
                    <div key={tc.id} className="grid grid-cols-1 gap-2 p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{tc.type}</span>
                        {testCases.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTestCase(tc.id)}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Input"
                        value={tc.input}
                        onChange={(e) => updateTestCase(tc.id, { input: e.target.value })}
                        size={undefined}
                      />
                      <Input
                        placeholder="Expected Output"
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(tc.id, { expectedOutput: e.target.value })}
                        size={undefined}
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => addTestCase("SAMPLE")}
                      className="text-xs"
                    >
                      + Add Sample Test
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => addTestCase("HIDDEN")}
                      className="text-xs"
                    >
                      + Add Hidden Test
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={onCreate} disabled={creating}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        <Tabs defaultValue="problems" className="w-full">
          <TabsList>
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="problems" className="space-y-4">
            <h2 className="text-xl font-bold">Problems</h2>
            {problems.length === 0 ? (
              <div className="text-muted-foreground">No problems assigned yet.</div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {problems.map((p) => (
                  <ProblemCard key={p.id} problem={p} contestId={id} onDeleted={() => loadProblems()} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            {id && <Leaderboard contestId={id} />}
          </TabsContent>
        </Tabs>
      </article>
      <Outlet />
    </>
  );
}