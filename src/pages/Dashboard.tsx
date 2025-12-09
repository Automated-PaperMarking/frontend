import { Helmet } from "react-helmet-async";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import DateTimeRange from "@/components/DateTimeRange";
import { post } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/types";
import { get } from "@/lib/api";
import { auth, loadProjects } from "@/utils/storage";
import { Search } from "lucide-react";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
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

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer
    debounceTimer.current = setTimeout(() => {
      loadContests(value);
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

  const onCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      // Prepare payload according to v1/contests API
      const payload = {
        name: title.trim(),
        description: description || "",
        enrollmentKey: enrollmentKey || "",
        startTime: startTime ? new Date(startTime).toISOString() : undefined,
        endTime: endTime ? new Date(endTime).toISOString() : undefined,
      } as any;

      const res = await post<any>("/v1/contests", payload);
      if (res.ok) {
        // Use server name when available, otherwise fallback to provided title
        const serverData = res.data?.data || res.data || payload;
        setTitle("");
        setDescription("");
        setEnrollmentKey("");
        setStartTime("");
        setEndTime("");
        setOpen(false);
        toast({ title: "Created", description: "Contest created successfully." });
        // refresh list after successful creation
        await loadContests();
      } else {
        toast({ title: "Create failed", description: res.error || "Failed to create contest" });
      }
    } catch (err) {
      toast({ title: "Error", description: String(err) });
    } finally {
      setCreating(false);
    }
  };
  // loadContests is a reusable function so we can call it after creating a contest
  const loadContests = async (searchQuery: string = "") => {
    setLoadingProjects(true);
    try {
      // If there's a search query, fetch specific contest by ID
      if (searchQuery.trim()) {
        const res = await get<any>(`/v1/contests/{id}?id=${searchQuery.trim()}`);
        if (res.ok && res.data) {
          const c = res.data.data || res.data;
          const mapped: Project[] = [{
            id: c.id || c._id || crypto.randomUUID(),
            name: c.name || c.title || "Untitled",
            description: c.description || "",
            enrollmentKey: c.enrollmentKey || c.enrollment_key || "",
            startTime: c.startTime || c.start_time || undefined,
            endTime: c.endTime || c.end_time || undefined,
            createdAt: c.createdAt || c.startTime || new Date().toISOString(),
            updatedAt: c.updatedAt || new Date().toISOString(),
            assessments: c.assessments || [],
          }];
          setProjects(mapped);
          setLoadingProjects(false);
          return;
        } else {
          setProjects([]);
          toast({ title: "Not found", description: "Contest not found" });
          setLoadingProjects(false);
          return;
        }
      }
      
      // default query params: search (string), page (int), size (int), sort (array)
      const search = "";
      const page = 0;
      const size = 500;
      const sort = ["id,asc"];

      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      qs.set("page", String(page));
      qs.set("size", String(size));
      sort.forEach((s) => qs.append("sort", s));

      const res = await get<any>(`/v1/contests/all?${qs.toString()}`);
      if (res.ok && res.data) {
        let raw = res.data;
        let list: any[] = [];

        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && Array.isArray(raw.data)) {
          list = raw.data;
        } else if (raw && raw.data && Array.isArray(raw.data.data)) {
          list = raw.data.data;
        } else {
          list = [];
        }

        const mapped: Project[] = list.map((c: any) => ({
          id: c.id || c._id || crypto.randomUUID(),
          name: c.name || c.title || "Untitled",
          description: c.description || "",
          enrollmentKey: c.enrollmentKey || c.enrollment_key || "",
          startTime: c.startTime || c.start_time || undefined,
          endTime: c.endTime || c.end_time || undefined,
          createdAt: c.createdAt || c.startTime || new Date().toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString(),
          assessments: c.assessments || [],
        }));
        setProjects(mapped);
      } else {
        setProjects([]);
        toast({ title: "Load failed", description: res.error || "Failed to load contests" });
      }
    } catch (err) {
      toast({ title: "Error", description: String(err) });
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    // call loadContests but avoid setting state after unmount by checking mounted
    loadContests();
  }, []);

  return (
    <>
      <Helmet>
        <title>Dashboard • AI Grading System</title>
        <meta name="description" content="Create and manage projects and assessments." />
        <link rel="canonical" href={`${window.location.origin}/dashboard`} />
      </Helmet>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search by Contest ID" 
            value={searchValue} 
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        {role !== "student" && (<Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Create Contest</Button>
            </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Contest</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <Input placeholder="Contest title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input placeholder="Contest description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Input placeholder="Enrollment key" value={enrollmentKey} onChange={(e) => setEnrollmentKey(e.target.value)} />
              <DateTimeRange
                startIso={startTime}
                endIso={endTime}
                onChange={(s, e) => {
                  setStartTime(s || "");
                  setEndTime(e || "");
                }}
              />
            </div>
            <DialogFooter>
              <Button onClick={onCreate} disabled={creating}>{creating ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )} : 
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New Enrollment</Button>
            </DialogTrigger>
          
          {/* <DialogContent>
            <DialogHeader>
              <DialogTitle>New Enrollment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <Input placeholder="Contest title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input placeholder="Contest description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Input placeholder="Enrollment key" value={enrollmentKey} onChange={(e) => setEnrollmentKey(e.target.value)} />
              <DateTimeRange
                startIso={startTime}
                endIso={endTime}
                onChange={(s, e) => {
                  setStartTime(s || "");
                  setEndTime(e || "");
                }}
              />
            </div>
            <DialogFooter>
              <Button onClick={onCreate} disabled={creating}>{creating ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </DialogContent> */}
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="text-muted-foreground">No projects yet. Create your first project.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onDeleted={() => loadContests()} />
          ))}
        </div>
      )}
    </>
  );
}
