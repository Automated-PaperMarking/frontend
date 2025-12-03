import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AssessmentCard from "@/components/AssessmentCard";
import { AssessmentType, Project } from "@/types";
import { addAssessment } from "@/utils/storage";
import { get } from "@/lib/api";
import { format } from "date-fns";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AssessmentType>("mcq");
  const [open, setOpen] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    loadContest();
  }, [id]);

  const createdAt = useMemo(() => (project ? format(new Date(project.createdAt || project.startTime ||  Date.now()), "PPpp") : ""), [project]);
  const updatedAt = useMemo(() => (project && project.updatedAt ? format(new Date(project.updatedAt), "PPpp") : ""), [project]);

  const onCreate = () => {
    if (!id || !title.trim()) return;
    const a = addAssessment(id, title.trim(), type);
    // setProject(getProject(id));
    setOpen(false);
    setTitle("");
    if (a) navigate(`/project/${id}/assessment/${a.id}`);
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
