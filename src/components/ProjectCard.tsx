import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Project } from "@/types";

interface Props {
  project: Project;
}

const ProjectCard = ({ project }: Props) => {
  const date = format(new Date(project.createdAt), "PPpp");
  return (
    <Card className="transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{project.title}</span>
          <Link to={`/project/${project.id}`}>
            <Button size="sm">Open</Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground gap-2">
          <CalendarDays className="h-4 w-4" />
          <time dateTime={project.createdAt}>{date}</time>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
