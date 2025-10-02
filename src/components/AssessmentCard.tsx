import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Assessment } from "@/types";

interface Props {
  projectId: string;
  assessment: Assessment;
}

const labelMap: Record<Assessment["type"], string> = {
  mcq: "MCQ",
  essay: "Essay",
  coding: "Coding",
};

const AssessmentCard = ({ projectId, assessment }: Props) => {
  const date = format(new Date(assessment.createdAt), "PPpp");
  return (
    <Card className="transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-lg">{assessment.title}</CardTitle>
        <Badge variant="secondary">{labelMap[assessment.type]}</Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <time className="text-sm text-muted-foreground" dateTime={assessment.createdAt}>{date}</time>
        <Link to={`/project/${projectId}/assessment/${assessment.id}`}>
          <Button size="sm">Open</Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default AssessmentCard;
