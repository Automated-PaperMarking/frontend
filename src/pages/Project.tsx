import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AssessmentCard from "@/components/AssessmentCard";
import { AssessmentType, Project } from "@/types";
import { addAssessment, getProject, loadProjects } from "@/utils/storage";
import { format } from "date-fns";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AssessmentType>("mcq");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setProject(getProject(id));
  }, [id]);

  const createdAt = useMemo(() => (project ? format(new Date(project.createdAt), "PPpp") : ""), [project]);

  const onCreate = () => {
    if (!id || !title.trim()) return;
    const a = addAssessment(id, title.trim(), type);
    setProject(getProject(id));
    setOpen(false);
    setTitle("");
    if (a) navigate(`/project/${id}/assessment/${a.id}`);
  };

  if (!project) return <div>Project not found.</div>;

  return (
    <>
      <Helmet>
        <title>{project.title} • Project</title>
        <meta name="description" content={`Manage assessments in project ${project.title}.`} />
        <link rel="canonical" href={`${window.location.origin}/project/${project.id}`} />
      </Helmet>
      <article className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <p className="text-sm text-muted-foreground">Created {createdAt}</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Create Assessment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Assessment</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <Input placeholder="Assessment title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <div>
                  <label className="text-sm mb-2 block">Type</label>
                  <Select value={type} onValueChange={(v: AssessmentType) => setType(v)}>
                    <SelectTrigger><SelectValue placeholder="Choose type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">MCQ</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={onCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </header>

        {project.assessments.length === 0 ? (
          <div className="text-muted-foreground">No assessments yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {project.assessments.map((a) => (
              <AssessmentCard key={a.id} projectId={project.id} assessment={a} />
            ))}
          </div>
        )}
      </article>
      <Outlet />
    </>
  );
}
