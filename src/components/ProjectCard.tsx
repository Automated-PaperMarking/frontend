import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArchiveX, CalendarDays, Delete } from "lucide-react";
import { del, post } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Project } from "@/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { auth } from "@/utils/storage";

interface Props {
  project: Project;
  onDeleted?: (id: string) => void;
}

const ProjectCard = ({ project, onDeleted }: Props) => {
  const [deleting, setDeleting] = React.useState(false);
  const start = format(new Date(project.startTime), "PPpp");
  const end = format(new Date(project.endTime), "PPpp");
  const update = format(new Date(project.updatedAt), "PPpp");
  
  const [enrollmentKey, setEnrollmentKey] = useState("");
  const [openEnroll, setOpenEnroll] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [role,setRole] = React.useState(auth.getUserRole() || "");

  const onEnroll = async () => {
      setEnrolling(true);
      try {
        // Prepare payload according to v1/contests API
        const payload = {
          contestId: project.id || "",
          enrollmentKey: enrollmentKey || "",
        } as any;
  
        const res = await post<any>("/v1/contests/enroll", payload);
        if (res.ok) {
          // Use server name when available, otherwise fallback to provided title
          const serverData = res.data?.data || res.data || payload;
          setEnrollmentKey("");
          setOpenEnroll(false);
          toast({ title: "Enrolled", description: "Enrolled to the contest successfully." });
          // After Enrollment


        } else {
          toast({ title: "Enrolling failed", description: res.error || "Failed to enroll to the contest" });
        }
      } catch (err) {
        toast({ title: "Error", description: String(err) });
      } finally {
        setEnrolling(false);
      }
    };

  return (
    <Card className="transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{project.name}</span>
          <div className="flex items-center gap-2">
            <Link to={`/project/${project.id}`}>
              <Button size="sm">Open</Button>
            </Link>
            <Dialog open={openEnroll} onOpenChange={setOpenEnroll}>
          <DialogTrigger asChild>
            <Button>Enroll</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Enrollment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2">
              <Input placeholder="Enrollment key" value={enrollmentKey} onChange={(e) => setEnrollmentKey(e.target.value)} />
            </div>
            <DialogFooter>
              <Button 
              onClick={onEnroll} 
              disabled={enrolling}>{enrolling ? "Enrolling" : "Enroll"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
            {role !== "student" && (<button
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
            </button>)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <CalendarDays className="h-4 w-4" />
          <time>Starting : {start}</time>
        </div>
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <CalendarDays className="h-4 w-4" />
          <time>Ending : {end}</time>
        </div>
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <CalendarDays className="h-4 w-4" />
          <time>Last Update : {update}</time>
        </div>
        <p>{project.description}</p>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
