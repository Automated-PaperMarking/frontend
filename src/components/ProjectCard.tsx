import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArchiveX, CalendarDays, Delete } from "lucide-react";
import { del } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Project } from "@/types";

interface Props {
  project: Project;
  onDeleted?: (id: string) => void;
}

const ProjectCard = ({ project, onDeleted }: Props) => {
  const [deleting, setDeleting] = React.useState(false);
  const date = format(new Date(project.createdAt), "PPpp");
  return (
    <Card className="transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{project.title}</span>
          <div className="flex items-center gap-2">
            <Link to={`/project/${project.id}`}>
              <Button size="sm">Open</Button>
            </Link>
            <button
              className="inline-flex items-center rounded px-2 py-1 text-sm text-destructive hover:bg-destructive/10"
              onClick={async () => {
                if (!confirm("Delete this contest? This action cannot be undone.")) return;
                setDeleting(true);
                try {
                  const qs = new URLSearchParams();
                  qs.set("id", project.id);
                  const res = await del<any>(`/v1/contests?${qs.toString()}`);
                  if (res.ok) {
                    toast({ title: "Deleted", description: "Contest deleted." });
                    onDeleted?.(project.id);
                  } else {
                    toast({ title: "Delete failed", description: res.error || "Failed to delete contest" });
                  }
                } catch (err) {
                  toast({ title: "Error", description: String(err) });
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              aria-label="Delete contest"
            >
              <ArchiveX className="h-6 w-6" />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <CalendarDays className="h-4 w-4" />
          <p>{project.description}</p>
          <time dateTime={project.createdAt}>{date}</time>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
