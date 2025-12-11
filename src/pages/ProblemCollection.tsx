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

interface Contest {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
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

  const [contests, setContests] = useState<Contest[]>([]);
  const [loadingContests, setLoadingContests] = useState(false);
  const [selectedContest, setSelectedContest] = useState("");
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const [statement, setStatement] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("EASY");
  const [testCases, setTestCases] = useState<Array<{ id: string; input: string; expectedOutput: string; type: "SAMPLE" | "HIDDEN" }>>([
    { id: crypto.randomUUID(), input: "", expectedOutput: "", type: "SAMPLE" },
  ]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer
    debounceTimer.current = setTimeout(() => {
      if (value.trim()) {
        searchProblems(value.trim());
      } else {
        loadProblems();
      }
    }, 500); // 500ms debounce
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

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

  // Search for a specific problem by ID
  const searchProblems = async (problemId: string) => {
    setLoadingProjects(true);
    try {
      const res = await get<any>(`/v1/problems/${problemId}`);
      if (res.ok && res.data) {
        const problem = res.data.data || res.data;
        if (problem && problem.id) {
          setProjects([problem]);
        } else {
          setProjects([]);
          toast.error("Problem not found");
        }
      } else {
        setProjects([]);
        toast.error(res.error || "Failed to search problem");
      }
    } catch (err) {
      toast.error(String(err));
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Load user contests
  const loadContests = async () => {
    setLoadingContests(true);
    try {
      const res = await get<any>("/v1/contests/my-contests?page=0&size=100&sort=id&sort=asc");
      if (res.ok && res.data) {
        const contestsList = res.data.data?.data || res.data.data || [];
        setContests(contestsList);
      } else {
        setContests([]);
        toast.error(res.error || "Failed to load contests");
      }
    } catch (err) {
      toast.error(String(err));
      setContests([]);
    } finally {
      setLoadingContests(false);
    }
  };

  useEffect(() => {
    // Load all Problems on mount
    loadProblems();
    loadContests();
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

  const onAssignProblems = async () => {
    if (!selectedContest) {
      toast.error("Please select a contest");
      return;
    }
    
    if (selectedProblems.length === 0) {
      toast.error("Please select at least one problem");
      return;
    }

    setAssigning(true);
    try {
      const payload = {
        contestId: selectedContest,
        problemIds: selectedProblems,
      };

      const res = await post<any>("/v1/contests/assign-problems", payload);
      if (res.ok) {
        toast.success(`${selectedProblems.length} problem(s) assigned to contest successfully!`);
        setAssignDialogOpen(false);
        setSelectedContest("");
        setSelectedProblems([]);
        setSelectionMode(!selectionMode);
      } else {
        toast.error(res.error || "Failed to assign problems");
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setAssigning(false);
    }
  };

  const toggleProblemSelection = (problemId: string) => {
    setSelectedProblems(prev => 
      prev.includes(problemId) 
        ? prev.filter(id => id !== problemId)
        : [...prev, problemId]
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // Clear selections when exiting selection mode
      setSelectedProblems([]);
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
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by Problem ID" 
              value={searchValue} 
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          {role !== "student" && contests.length > 0 && (
            <>
              <Button 
                variant="outline"
                onClick={toggleSelectionMode}
              >
                {selectionMode ? "Cancel Selection" : "Select Problems"}
              </Button>
              {selectionMode && selectedProblems.length > 0 && (
                <Button 
                  variant="default"
                  onClick={() => setAssignDialogOpen(true)}
                >
                  Assign to Contest ({selectedProblems.length})
                </Button>
              )}
            </>
          )}
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
      </div>

      {/* Assign Problems to Contest Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Problems to Contest</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Select Contest</label>
              <Select value={selectedContest} onValueChange={setSelectedContest}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a contest" />
                </SelectTrigger>
                <SelectContent>
                  {contests.map((contest) => (
                    <SelectItem key={contest.id} value={contest.id}>
                      {contest.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedProblems.length} problem(s) selected
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={onAssignProblems} disabled={assigning || !selectedContest}>
              {assigning ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {projects.length === 0 ? (
        <div className="text-muted-foreground">No problems yet. {role !== "student" && "Create your first problem."}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProblemCard 
              key={p.id} 
              problem={p} 
              onDeleted={() => loadProblems()}
              selectionMode={selectionMode && role !== "student" && contests.length > 0}
              isSelected={selectedProblems.includes(p.id)}
              onSelectionChange={toggleProblemSelection}
            />
          ))}
        </div>
      )}
    </>
  );
}
