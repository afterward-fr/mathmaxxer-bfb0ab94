import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bug, Send } from "lucide-react";

interface BugReport {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
}

const BugReport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadReports();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from("bug_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load bug reports",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("bug_reports")
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          priority,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Bug report submitted successfully",
      });

      setTitle("");
      setDescription("");
      setPriority("medium");
      loadReports();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit bug report",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-yellow-500/10 text-yellow-500";
      case "in_progress": return "bg-blue-500/10 text-blue-500";
      case "resolved": return "bg-green-500/10 text-green-500";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-green-500/10 text-green-500";
      case "medium": return "bg-yellow-500/10 text-yellow-500";
      case "high": return "bg-red-500/10 text-red-500";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--gradient-primary)" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate("/")} variant="outline" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bug className="w-8 h-8 text-primary" />
              Bug Reports
            </h1>
            <p className="text-muted-foreground">Report issues and track your submissions</p>
          </div>
        </div>

        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle>Submit a Bug Report</CardTitle>
            <CardDescription>Help us improve by reporting any issues you encounter</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the bug"
                  maxLength={200}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the issue, steps to reproduce, etc."
                  rows={5}
                  maxLength={2000}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Minor issue</SelectItem>
                    <SelectItem value="medium">Medium - Affects functionality</SelectItem>
                    <SelectItem value="high">High - Critical bug</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Submitting..." : "Submit Bug Report"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card style={{ boxShadow: "var(--shadow-game)" }}>
          <CardHeader>
            <CardTitle>Your Reports</CardTitle>
            <CardDescription>Track the status of your submitted bug reports</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No bug reports yet</p>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id} className="p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{report.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(report.status)}`}>
                            {report.status.replace("_", " ").toUpperCase()}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(report.priority)}`}>
                            {report.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BugReport;
