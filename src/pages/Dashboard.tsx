import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import DateTimeRange from "@/components/DateTimeRange";
import { post } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/types";
import { createProject, loadProjects } from "@/utils/storage";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [enrollmentKey, setEnrollmentKey] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setProjects(loadProjects());
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
        // No need to store locally
        // const project = createProject((serverData.name as string) || title.trim());
        // setProjects((p) => [project, ...p]);
        setTitle("");
        setDescription("");
        setEnrollmentKey("");
        setStartTime("");
        setEndTime("");
        setOpen(false);
        toast({ title: "Created", description: "Contest created successfully." });
      } else {
        toast({ title: "Create failed", description: res.error || "Failed to create contest" });
      }
    } catch (err) {
      toast({ title: "Error", description: String(err) });
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard • AI Grading System</title>
        <meta name="description" content="Create and manage projects and assessments." />
        <link rel="canonical" href={`${window.location.origin}/dashboard`} />
      </Helmet>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Project</Button>
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
      </div>

      {projects.length === 0 ? (
        <div className="text-muted-foreground">No projects yet. Create your first project.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </>
  );
}
