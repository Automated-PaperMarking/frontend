import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArchiveX, CalendarDays, Delete, Trash2, Eye } from "lucide-react";
import { del, post } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { auth } from "@/utils/storage";

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

interface Props {
  problem: Problem;
  onDeleted?: (id: string) => void;
  contestId?: string;
}

const ProblemCard = ({ problem, onDeleted, contestId }: Props) => {
  const [deleting, setDeleting] = React.useState(false);
  const navigate = useNavigate();
  const createdAt = format(new Date(problem.createdAt), "PPpp");
  const updatedAt = format(new Date(problem.updatedAt), "PPpp");
  const [role, setRole] = React.useState(auth.getUserRole() || "");
  const resolvedContestId = contestId || problem.contestId || "unknown";

  const onDelete = async () => {
    if (!confirm("Delete this problem? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await del<any>(`/v1/problems/${problem.id}`);
      if (res.ok) {
        toast.success("Problem deleted successfully");
        onDeleted?.(problem.id);
      } else {
        toast.error(res.error || "Failed to delete problem");
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold">{problem.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="inline-block bg-slate-100 px-2 py-1 rounded">{problem.difficultyLevel}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/problem-submission/${resolvedContestId}/${problem.id}`)}
              className="h-8"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
            {role !== "student" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={deleting}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground line-clamp-2">{problem.statement}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>Created: {createdAt}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>Updated: {updatedAt}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium">{problem.testCases.length}</span> test cases
          {problem.testCases.filter(tc => tc.type === "SAMPLE").length > 0 && (
            <span className="ml-2">
              ({problem.testCases.filter(tc => tc.type === "SAMPLE").length} sample,{" "}
              {problem.testCases.filter(tc => tc.type === "HIDDEN").length} hidden)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProblemCard;
