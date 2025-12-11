import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { get } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, Trophy, Zap, Download } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  studentName: string;
  totalScore: number;
  rank: number;
  problemsSolved: number;
  lastSubmissionTime: string;
}

interface LeaderboardResponse {
  page: number;
  totalPages: number;
  data: LeaderboardEntry[];
}

interface Props {
  contestId: string;
}

export default function Leaderboard({ contestId }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    loadLeaderboard();
  }, [contestId, page, search]);

  const loadLeaderboard = async () => {
    if (!contestId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("contestId", contestId);
      if (search.trim()) params.set("search", search.trim());
      params.set("page", String(page));
      params.set("size", String(pageSize));
      params.append("sort", "rank,asc");

      const res = await get<any>(`/v1/leaderboard?${params.toString()}`);
      if (res.ok && res.data?.data) {
        const responseData = res.data.data as LeaderboardResponse;
        setEntries(responseData.data || []);
        setTotalPages(responseData.totalPages || 1);
      } else {
        toast.error(res.error || "Failed to load leaderboard");
        setEntries([]);
      }
    } catch (err) {
      toast.error(String(err));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const getMedalColor = (rank: number): string => {
    if (rank === 1) return "text-yellow-500";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-orange-600";
    return "text-muted-foreground";
  };

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  const exportToCSV = () => {
    if (entries.length === 0) {
      toast.error("No leaderboard data to export");
      return;
    }

    const escapeCSV = (value: string | number) => {
      const stringValue = String(value ?? "");
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const header = ["Rank", "Student Name", "Score", "Problems Solved", "Last Submission"];
    const rows = entries.map((entry) => [
      entry.rank,
      entry.studentName,
      entry.totalScore.toFixed(1),
      entry.problemsSolved,
      format(new Date(entry.lastSubmissionTime), "yyyy-MM-dd HH:mm"),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leaderboard-${contestId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student name"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" onClick={exportToCSV} disabled={loading || entries.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Contest Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading leaderboard…</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No submissions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-center">
                      <Zap className="h-4 w-4 inline mr-1" />
                      Solved
                    </TableHead>
                    <TableHead className="text-right">Last Submission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id} className={entry.rank <= 3 ? "bg-amber-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg ${getMedalColor(entry.rank)}`}>
                            {getMedalEmoji(entry.rank)}
                          </span>
                          <span className="font-semibold">{entry.rank}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{entry.studentName}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-lg">{entry.totalScore.toFixed(1)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                          {entry.problemsSolved}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {format(new Date(entry.lastSubmissionTime), "MMM dd, HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page === totalPages - 1 || loading}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
