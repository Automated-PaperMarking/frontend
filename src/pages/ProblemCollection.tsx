import { Helmet } from "react-helmet-async";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import DateTimeRange from "@/components/DateTimeRange";
import { post } from "@/lib/api";
import { toast } from "sonner";
import ProblemCard from "@/components/ProblemCard";
import { Project } from "@/types";
import { get } from "@/lib/api";
import { auth, loadProjects } from "@/utils/storage";
import { Search } from "lucide-react";
import { useParams } from "react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

export default function ProblemCollection() {
  const { id } = useParams<{ id: string }>();
  const [projects, setProjects] = useState<Problem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [enrollmentKey, setEnrollmentKey] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [role,setRole] = useState(auth.getUserRole() || "");
  const [searchValue, setSearchValue] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const [statement, setStatement] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("EASY");
  const [testCases, setTestCases] = useState<Array<{ id: string; input: string; expectedOutput: string; type: "SAMPLE" | "HIDDEN" }>>([
    { id: crypto.randomUUID(), input: "", expectedOutput: "", type: "SAMPLE" },
  ]);

//   // Debounced search handler
//   const handleSearchChange = useCallback((value: string) => {
//     setSearchValue(value);
    
//     // Clear existing timer
//     if (debounceTimer.current) {
//       clearTimeout(debounceTimer.current);
//     }
    
//     // Set new timer
//     debounceTimer.current = setTimeout(() => {
//       loadContests(value);
//     }, 500); // 500ms debounce
//   }, []);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       if (debounceTimer.current) {
//         clearTimeout(debounceTimer.current);
//       }
//     };
//   }, []);

  // Load all problems from API
  const loadProblems = async () => {
    setLoadingProjects(true);
    try {
      const res = await get<any>(`/v1/problems/all`);
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

        setProjects(problemsList as any);
      } else {
        setProjects([]);
        toast.error(res.error || "Failed to load problems");
      }
    } catch (err) {
      toast.error(String(err));
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };
      
//       // default query params: search (string), page (int), size (int), sort (array)
//       const search = "";
//       const page = 0;
//       const size = 500;
//       const sort = ["id,asc"];

//       const qs = new URLSearchParams();
//       if (search) qs.set("search", search);
//       qs.set("page", String(page));
//       qs.set("size", String(size));
//       sort.forEach((s) => qs.append("sort", s));

//       const res = await get<any>(`/v1/contests/all?${qs.toString()}`);
//       if (res.ok && res.data) {
//         let raw = res.data;
//         let list: any[] = [];

//         if (Array.isArray(raw)) {
//           list = raw;
//         } else if (raw && Array.isArray(raw.data)) {
//           list = raw.data;
//         } else if (raw && raw.data && Array.isArray(raw.data.data)) {
//           list = raw.data.data;
//         } else {
//           list = [];
//         }

//         const mapped: Project[] = list.map((c: any) => ({
//           id: c.id || c._id || crypto.randomUUID(),
//           name: c.name || c.title || "Untitled",
//           description: c.description || "",
//           enrollmentKey: c.enrollmentKey || c.enrollment_key || "",
//           startTime: c.startTime || c.start_time || undefined,
//           endTime: c.endTime || c.end_time || undefined,
//           createdAt: c.createdAt || c.startTime || new Date().toISOString(),
//           updatedAt: c.updatedAt || new Date().toISOString(),
//           assessments: c.assessments || [],
//         }));
//         setProjects(mapped);
//       } else {
//         setProjects([]);
//         toast({ title: "Load failed", description: res.error || "Failed to load contests" });
//       }
//     } catch (err) {
//       toast({ title: "Error", description: String(err) });
//       setProjects([]);
//     } finally {
//       setLoadingProjects(false);
//     }
//   };

  useEffect(() => {
    // Load all Problems on mount
    loadProblems();
  }, []);

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
    if (!title.trim() || !statement.trim()) {
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
        toast.success("Problem created successfully!");
        setOpen(false);
        setTitle("");
        setStatement("");
        setDifficultyLevel("EASY");
        setTestCases([{ id: crypto.randomUUID(), input: "", expectedOutput: "", type: "SAMPLE" }]);
        // Refresh problems list
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

  return (
    <>
      <Helmet>
        <title>Problems • AI Grading System</title>
        <meta name="description" content="Create and manage projects and assessments." />
        <link rel="canonical" href={`${window.location.origin}/problems`} />
      </Helmet>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Problems</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          {/* <Input 
            placeholder="Search by Contest ID" 
            value={searchValue} 
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          /> */}
        </div>
        {role !== "student" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Create Problem</Button>
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
          </Dialog>)}
      </div>

      {projects.length === 0 ? (
        <div className="text-muted-foreground">No problems yet. {role !== "student" && "Create your first problem."}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProblemCard key={p.id} problem={p} onDeleted={() => loadProblems()} />
          ))}
        </div>
      )}
    </>
  );
}
