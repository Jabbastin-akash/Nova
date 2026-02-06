"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dashboard } from "@/components/Dashboard";
import { InterviewInterface } from "@/components/InterviewInterface";
import { PlannerInterface } from "@/components/PlannerInterface";
import { useToast } from "@/hooks/use-toast"; // Assuming shadcn added toast
import { motion } from "framer-motion";

export default function Home() {
  const [view, setView] = useState<"LANDING" | "DASHBOARD" | "INTERVIEW" | "PLANNER">("LANDING");
  const [loading, setLoading] = useState(false);

  // App State
  const [profile, setProfile] = useState({
    name: "Alex",
    resumeText: "Experienced React Developer...",
    declaredSkills: "React, Node.js",
    academicYear: "Final Year",
    targetCompany: "Google"
  });

  const [appState, setAppState] = useState<any>({});

  const handleStart = async () => {
    setLoading(true);
    try {
      // 1. Profile Analysis
      const res = await callOrchestrator("ANALYZE_PROFILE", {
        resumeText: profile.resumeText,
        declaredSkills: profile.declaredSkills.split(","),
        academicYear: profile.academicYear,
        targetCompany: profile.targetCompany
      });

      if (res.decision.agent === "SkillGapAgent") {
        // 2. Auto-proceed to Skill Gap
        const res2 = await callOrchestrator("ANALYZE_GAPS", {});
        setAppState(prevState => ({ ...prevState, ...res2.output.data }));
        setView("DASHBOARD");
      } else {
        setAppState(prevState => ({ ...prevState, ...res.output.data }));
        setView("DASHBOARD"); // Default to dashboard if logic differs
      }

    } catch (e) {
      console.error(e);
      alert("Error starting session");
    }
    setLoading(false);
  };

  const handleStartInterview = async () => {
    setLoading(true);
    const res = await callOrchestrator("START_INTERVIEW", {});
    setAppState(prev => ({
      ...prev,
      interviewHistory: [],
      currentQuestion: res.output.data.question
    }));
    setView("INTERVIEW");
    setLoading(false);
  };

  const handleInterviewResponse = async (answer: string) => {
    setLoading(true);
    // Send answer and get eval + next question
    const res = await callOrchestrator("ANSWER_QUESTION", {
      lastAnswer: answer,
      lastQuestionId: "123" // Mock ID
    });

    const evalData = res.output.data.evaluation;
    const newHistoryItem = {
      question: appState.currentQuestion,
      answer: answer,
      evaluation: evalData,
      feedback: res.output.data.feedback_summary
    };

    setAppState(prev => ({
      ...prev,
      interviewHistory: [...(prev.interviewHistory || []), newHistoryItem],
      currentQuestion: res.output.data.question
    }));
    setLoading(false);
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    const res = await callOrchestrator("GENERATE_PLAN", { timeHorizon: "30 days" });
    setAppState(prev => ({ ...prev, plan: res.output.data }));
    setView("PLANNER");
    setLoading(false);
  };

  async function callOrchestrator(action: string, data: any) {
    const req = await fetch("/api/orchestrate", {
      method: "POST",
      body: JSON.stringify({ action, ...data })
    });
    return await req.json();
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <nav className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
          Nova Career Copilot
        </h1>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => setView("DASHBOARD")} disabled={view === "LANDING"}>Dashboard</Button>
          <Button variant="ghost" onClick={() => setView("INTERVIEW")} disabled={view === "LANDING"}>Interview</Button>
          <Button variant="ghost" onClick={() => setView("PLANNER")} disabled={view === "LANDING"}>Plan</Button>
        </div>
      </nav>

      {/* LANDING VIEW */}
      {view === "LANDING" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">Your AI Career Coach</h2>
            <p className="text-muted-foreground text-lg">
              Build a personalized roadmap, practice adaptive interviews, and track your readiness for top tech companies.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Start Your Journey</CardTitle>
              <CardDescription>Tell us about yourself to generate a baseline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Academic Year</label>
                  <Select onValueChange={v => setProfile({ ...profile, academicYear: v })} defaultValue={profile.academicYear}>
                    <SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Final Year">Final Year</SelectItem>
                      <SelectItem value="Third Year">Third Year</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Company</label>
                <Select onValueChange={v => setProfile({ ...profile, targetCompany: v })} defaultValue={profile.targetCompany}>
                  <SelectTrigger><SelectValue placeholder="Select Company" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Amazon">Amazon</SelectItem>
                    <SelectItem value="Microsoft">Microsoft</SelectItem>
                    <SelectItem value="Startup">High Growth Startup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Declared Skills</label>
                <Input value={profile.declaredSkills} onChange={e => setProfile({ ...profile, declaredSkills: e.target.value })} placeholder="e.g. Java, Spring Boot, React" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Paste Resume Content</label>
                <Textarea
                  className="h-32"
                  placeholder="Paste your resume text here for analysis..."
                  value={profile.resumeText}
                  onChange={e => setProfile({ ...profile, resumeText: e.target.value })}
                />
              </div>

              <Button className="w-full text-lg h-12" onClick={handleStart} disabled={loading}>
                {loading ? "Analyzing..." : "Analyze Profile & Get Started"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* DASHBOARD VIEW */}
      {view === "DASHBOARD" && (
        <div className="space-y-8">
          <Dashboard state={appState} />
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={handleStartInterview}>Start Adaptive Interview</Button>
            <Button size="lg" variant="outline" onClick={handleGeneratePlan}>Generate Career Plan</Button>
          </div>
        </div>
      )}

      {/* INTERVIEW VIEW */}
      {view === "INTERVIEW" && (
        <InterviewInterface
          initialQuestion={appState.currentQuestion}
          history={appState.interviewHistory || []}
          onRespond={handleInterviewResponse}
          loading={loading}
        />
      )}

      {/* PLANNER VIEW */}
      {view === "PLANNER" && (
        <PlannerInterface plan={appState.plan} />
      )}

    </main>
  );
}
