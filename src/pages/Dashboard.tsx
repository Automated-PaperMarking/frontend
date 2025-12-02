import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ProjectCard from "@/components/ProjectCard";
import { Project } from "@/types";
import { auth, createProject, loadProjects } from "@/utils/storage";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);
  const [role,setRole] = useState(auth.getUserRole() || "");

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const onCreate = () => {
    if (!title.trim()) return;
    const project = createProject(title.trim());
    setProjects((p) => [project, ...p]);
    setTitle("");
    setOpen(false);
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
          {role == "student" && (
            <DialogTrigger asChild>
              <Button>Create Project</Button>
            </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <Input placeholder="Project title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <DialogFooter>
              <Button onClick={onCreate}>Create</Button>
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
