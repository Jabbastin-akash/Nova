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
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
// Lazy-load pdfjs inside browser-only function to avoid server-side DOM references
// Helper function to extract text from PDF
async function extractTextFromPDF(file: File): Promise<string> {
  // Import inside function so this code only runs in the browser (avoids DOMMatrix server errors)
  let pdfjsLib: any;
  try {
    // Use legacy build for better compatibility with Next.js/Turbopack
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch (e) {
    console.error('Failed to load pdfjs-dist:', e);
    throw e;
  }

  // Set worker source to CDN matching installed version (legacy build)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }

  return fullText.trim();
}

export default function Home() {
  const { toast } = useToast();
  const [view, setView] = useState<"LANDING" | "DASHBOARD" | "INTERVIEW" | "PLANNER">("LANDING");
  const [loading, setLoading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [interviewDifficulty, setInterviewDifficulty] = useState("Medium");
  const [programmingQuestions, setProgrammingQuestions] = useState<any[]>([]);
  const [interviewPhase, setInterviewPhase] = useState<string>("warmup");
  const [questionsAsked, setQuestionsAsked] = useState(0);

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
    if (!profile.resumeText || profile.resumeText.length < 20) {
      toast({
        title: "Resume Required",
        description: "Please enter your resume text (at least 20 characters)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    toast({
      title: "Analyzing Your Profile",
      description: "AI is analyzing your resume and skills..."
    });

    try {
      const res = await callOrchestrator("ANALYZE_PROFILE", {
        resumeText: profile.resumeText,
        declaredSkills: profile.declaredSkills.split(",").map(s => s.trim()),
        academicYear: profile.academicYear,
        targetCompany: profile.targetCompany
      });

      if (res.error) {
        toast({
          title: "Analysis Failed",
          description: res.error,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (res.output?.success) {
        // Prefer the orchestrator-provided normalized profile if available
        const out = res.output.data || {};
        const serverProfile = out.studentProfile || null;

        let studentProfile: any;
        if (serverProfile) {
          // Ensure both camelCase and snake_case keys are available for UI
          studentProfile = {
            ...serverProfile,
            resumeScore: serverProfile.resumeScore ?? serverProfile.resume_score ?? serverProfile.score?.resume ?? undefined,
            resume_score: serverProfile.resume_score ?? serverProfile.resumeScore ?? serverProfile.score?.resume ?? undefined,
            projectDepthScore: serverProfile.projectDepthScore ?? serverProfile.project_depth_score ?? serverProfile.score?.projects ?? undefined,
            project_depth_score: serverProfile.project_depth_score ?? serverProfile.projectDepthScore ?? serverProfile.score?.projects ?? undefined,
            technicalMaturityScore: serverProfile.technicalMaturityScore ?? serverProfile.technical_maturity_score ?? serverProfile.score?.maturity ?? undefined,
            technical_maturity_score: serverProfile.technical_maturity_score ?? serverProfile.technicalMaturityScore ?? serverProfile.score?.maturity ?? undefined,
            inferredStrengths: serverProfile.inferredStrengths ?? serverProfile.inferred_strengths ?? [],
            inferred_strengths: serverProfile.inferred_strengths ?? serverProfile.inferredStrengths ?? [],
            missingCoreAreas: (() => {
              const m = serverProfile.missingCoreAreas ?? serverProfile.missing_core_areas ?? serverProfile.weaknesses ?? serverProfile.missing_fundamentals ?? serverProfile.priority_gaps ?? [];
              if (Array.isArray(m)) return m;
              if (m && typeof m === 'object') return Object.values(m).flat();
              return [];
            })()
          };
        } else {
          const data = res.output.data;
          console.log("Profile Analyzer raw response:", JSON.stringify(data, null, 2));

          // Flatten skills if it's an object (e.g. {languages: [...], frameworks: [...]})
          let inferredStrengths: string[] = [];
          if (Array.isArray(data.inferred_strengths)) {
            inferredStrengths = data.inferred_strengths;
          } else if (Array.isArray(data.recommendations)) {
            inferredStrengths = data.recommendations;
          } else if (data.skills && typeof data.skills === 'object' && !Array.isArray(data.skills)) {
            Object.values(data.skills).forEach((v: any) => {
              if (Array.isArray(v)) inferredStrengths.push(...v);
              else if (typeof v === 'string') inferredStrengths.push(v);
            });
          } else if (Array.isArray(data.skills)) {
            inferredStrengths = data.skills;
          }

          // Flatten missing areas
          let missingCoreAreas: string[] = [];
          const rawMissing = data.missing_core_areas || data.weaknesses || data.priority_gaps || data.missing_fundamentals || [];
          if (Array.isArray(rawMissing)) {
            missingCoreAreas = rawMissing;
          } else if (rawMissing && typeof rawMissing === 'object') {
            Object.values(rawMissing).forEach((v: any) => {
              if (Array.isArray(v)) missingCoreAreas.push(...v);
              else if (typeof v === 'string') missingCoreAreas.push(v);
            });
          }

          studentProfile = {
            name: profile.name,
            resumeText: profile.resumeText,
            declaredSkills: profile.declaredSkills.split(",").map(s => s.trim()),
            academicYear: profile.academicYear,
            targetCompany: profile.targetCompany,
            resumeScore: data.resume_score ?? data.score?.resume ?? 0,
            resume_score: data.resume_score ?? data.score?.resume ?? 0,
            projectDepthScore: data.project_depth_score ?? data.score?.projects ?? 0,
            technicalMaturityScore: data.technical_maturity_score ?? data.score?.maturity ?? 0,
            missingCoreAreas,
            missing_core_areas: missingCoreAreas,
            inferredStrengths,
            inferred_strengths: inferredStrengths,
          };
        }

        // Compute readiness from available fields (prefer readiness from server)
        const readiness = out.readinessScore ?? (studentProfile.resumeScore ? studentProfile.resumeScore * 10 : 50);

        setAppState((prevState: any) => ({
          ...prevState,
          studentProfile,
          readinessScore: readiness,
          skillGapData: { priorityGaps: Array.isArray(studentProfile.missingCoreAreas) ? studentProfile.missingCoreAreas : (studentProfile.missingCoreAreas ? Object.values(studentProfile.missingCoreAreas).flat() : []) }
        }));

        toast({
          title: "Analysis Complete",
          description: `Resume Score: ${studentProfile.resumeScore ?? studentProfile.resume_score}/10 | Found ${(Array.isArray(studentProfile.missingCoreAreas) ? studentProfile.missingCoreAreas.length : (studentProfile.missingCoreAreas ? Object.values(studentProfile.missingCoreAreas).flat().length : 0))} areas to improve`
        });

        setView("DASHBOARD");
      } else {
        toast({
          title: "Analysis Failed",
          description: res.output?.message || "Unable to analyze profile. Please try again.",
          variant: "destructive"
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Network error. Please check your connection and try again.",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleStartInterview = async () => {
    // Just switch to the interview view — the InterviewInterface
    // will handle topic selection first, then call handleInterviewResponse
    setAppState((prev: any) => ({
      ...prev,
      interviewHistory: [],
      currentQuestion: "",
      selectedTopics: []
    }));
    setProgrammingQuestions([]);
    setInterviewPhase("warmup");
    setQuestionsAsked(0);
    setView("INTERVIEW");
  };

  const handleTopicSelect = async (topics: string[]) => {
    setSelectedTopics(topics);
    setAppState((prev: any) => ({
      ...prev,
      selectedTopics: topics
    }));
  };

  const handleInterviewResponse = async (answer: string) => {
    setLoading(true);
    try {
      const res = await callOrchestrator("ANSWER_QUESTION", {
        lastAnswer: answer,
        lastQuestionId: "123",
        difficulty: interviewDifficulty,
        topics: selectedTopics,
        phase: interviewPhase,
        questionsAsked: questionsAsked,
      });

      if (res.output?.data) {
        const evalData = res.output.data.evaluation;
        const newHistoryItem = {
          question: appState.currentQuestion || "Tell me about your approach.",
          answer: answer,
          evaluation: evalData,
          feedback: res.output.data.feedback_summary
        };

        // Add programming question if present
        if (res.output.data.programming_question) {
          setProgrammingQuestions(prev => [...prev, res.output.data.programming_question]);
        } else {
          // Generate a programming version automatically
          const topic = selectedTopics[programmingQuestions.length % Math.max(selectedTopics.length, 1)] || "General";
          setProgrammingQuestions(prev => [...prev, {
            question: `Write code to implement the concept discussed: ${res.output.data.question || "Implement a solution"}`,
            difficulty: interviewDifficulty,
            hint: `Think about the ${topic} approach`,
            example: `// Your solution here\nfunction solve(input) {\n  // implement\n}`
          }]);
        }

        // Update agentic state from response
        if (res.output.data.phase) setInterviewPhase(res.output.data.phase);
        if (res.output.data.questionsAsked) setQuestionsAsked(res.output.data.questionsAsked);

        setAppState((prev: any) => ({
          ...prev,
          interviewHistory: [...(prev.interviewHistory || []), newHistoryItem],
          currentQuestion: res.output.data.question
        }));
      }
    } catch (e: any) {
      toast({
        title: "Interview Error",
        description: e.message || "Failed to process response",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleGeneratePlan = async () => {
    setLoading(true);
    toast({
      title: "Generating Career Plan",
      description: "Creating personalized learning roadmap..."
    });

    const res = await callOrchestrator("GENERATE_PLAN", { timeHorizon: "30 days" });

    if (res.output?.data) {
      // Normalize plan: make tasks human-readable strings
      const planRaw: any = res.output.data;
      const daily = (planRaw.daily_plan || []).map((day: any) => ({
        day: day.day,
        focus: day.focus || day.goal || `Day ${day.day}`,
        expected_outcome: day.expected_outcome || day.goal || "",
        tasks: (day.tasks || []).map((t: any) => typeof t === 'string' ? t : (t.task ? `${t.task}${t.time ? ` (${t.time}h)` : ''}` : JSON.stringify(t)))
      }));

      const planNormalized = {
        ...planRaw,
        daily_plan: daily,
        weekly_mock_schedule: planRaw.weekly_mock_schedule || planRaw.weekly_schedule || [],
        resume_improvement_actions: planRaw.resume_improvement_actions || planRaw.resume_actions || []
      };

      setAppState((prev: any) => ({ ...prev, plan: planNormalized }));
      toast({
        title: "Career Plan Ready",
        description: "Your personalized learning path has been created."
      });
      setView("PLANNER");
    } else {
      toast({
        title: "Failed to Generate Plan",
        description: "Please try again.",
        variant: "destructive"
      });
    }
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
    <>
      <Toaster />
      <main className="flex h-screen bg-background text-foreground overflow-hidden font-sans">

        {/* SIDEBAR - Aurea Style */}
        <aside className="w-64 hidden lg:flex flex-col p-6 border-r border-white/5 bg-[#050505]/50 backdrop-blur-xl relative z-20">
          <div className="flex items-center gap-3 mb-10 pl-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-white font-bold text-lg">✦</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Nova<span className="text-primary">Copilot</span></h1>
          </div>

          <nav className="space-y-2 flex-1">
            <SidebarItem
              icon="◆" label="Overview"
              active={view === "LANDING"} onClick={() => setView("LANDING")}
            />
            <SidebarItem
              icon="▣" label="Dashboard"
              active={view === "DASHBOARD"} onClick={() => setView("DASHBOARD")} disabled={view === "LANDING"}
            />
            <SidebarItem
              icon="●" label="AI Interview"
              active={view === "INTERVIEW"} onClick={() => setView("INTERVIEW")} disabled={view === "LANDING"}
              badge="New"
            />
            <SidebarItem
              icon="▸" label="Career Plan"
              active={view === "PLANNER"} onClick={() => setView("PLANNER")} disabled={view === "LANDING"}
            />
          </nav>

          <div className="mt-auto">
            <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-pink-500 overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`} alt="Avatar" />
              </div>
              <div>
                <p className="text-sm font-bold">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate w-24">{profile.academicYear}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Top Gradient Line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />

          {/* Mobile Header */}
          <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-background/50 backdrop-blur-md z-30">
            <span className="font-bold">Nova Copilot</span>
            <Button size="sm" variant="ghost" onClick={() => setView("LANDING")}>Menu</Button>
          </header>

          <ScrollArea className="flex-1 p-6 lg:p-10 relative z-10">

            {/* VIEW: LANDING / OVERVIEW */}
            {view === "LANDING" && (
              <div className="max-w-5xl mx-auto space-y-10">
                <div className="space-y-2">
                  <h2 className="text-4xl lg:text-5xl font-bold">Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{profile.name}!</span></h2>
                  <p className="text-muted-foreground text-lg">Ready to accelerate your career journey today?</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Action Card */}
                  <div className="lg:col-span-2 glass-card rounded-[2rem] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                      <div className="w-64 h-64 bg-primary blur-[100px] rounded-full" />
                    </div>

                    <h3 className="text-2xl font-bold mb-6">Start New Analysis</h3>

                    <div className="space-y-6 relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Resume / CV</label>

                          {/* File Upload Area */}
                          <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="glass-input h-20 rounded-xl flex items-center justify-center border-dashed border-2 border-white/20 hover:border-primary/50 cursor-pointer transition-colors relative z-10 gap-3">
                              <input
                                type="file"
                                accept=".txt,.pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  try {
                                    let text = "";

                                    if (file.name.toLowerCase().endsWith('.pdf')) {
                                      // PDF file - extract text
                                      setLoading(true);
                                      text = await extractTextFromPDF(file);
                                      setLoading(false);
                                    } else {
                                      // Text file - read directly
                                      text = await new Promise((resolve, reject) => {
                                        const reader = new FileReader();
                                        reader.onload = (event) => resolve(event.target?.result as string || "");
                                        reader.onerror = () => reject(new Error("Failed to read file"));
                                        reader.readAsText(file);
                                      });
                                    }

                                    if (text && text.length > 0) {
                                      setProfile({ ...profile, resumeText: text });
                                    } else {
                                      alert("Could not extract text from the file. Please paste your resume text manually.");
                                    }
                                  } catch (error) {
                                    console.error("File read error:", error);
                                    setLoading(false);
                                    alert("Error reading file. Please paste your resume text manually.");
                                  }
                                }}
                              />
                              <span className="text-xl font-mono text-primary">&lt;/&gt;</span>
                              <div>
                                <p className="text-sm font-medium text-white/70">Upload PDF or TXT</p>
                                <p className="text-xs text-white/40">Or paste text below</p>
                              </div>
                            </div>
                          </div>

                          {/* Always show textarea for pasting */}
                          <Textarea
                            value={profile.resumeText}
                            onChange={e => setProfile({ ...profile, resumeText: e.target.value })}
                            placeholder="Paste your resume text here...

Example:
John Doe - Software Engineer
Skills: React, Node.js, Python, SQL
Experience: 2 years at XYZ Corp
Projects: Built a real-time chat app..."
                            className="glass-input text-sm h-40 resize-none focus:ring-primary/50 focus:border-primary/50 rounded-xl"
                          />
                          {profile.resumeText && (
                            <p className="text-xs text-green-400">✓ Resume loaded ({profile.resumeText.length} characters)</p>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Your Name</label>
                            <Input
                              value={profile.name}
                              onChange={e => setProfile({ ...profile, name: e.target.value })}
                              placeholder="Enter your name"
                              className="glass-input rounded-xl h-12"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Target Company</label>
                            <Select onValueChange={v => setProfile({ ...profile, targetCompany: v })} defaultValue={profile.targetCompany}>
                              <SelectTrigger className="glass-input rounded-xl h-12"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                <SelectItem value="Google">Google</SelectItem>
                                <SelectItem value="Amazon">Amazon</SelectItem>
                                <SelectItem value="Microsoft">Microsoft</SelectItem>
                                <SelectItem value="Meta">Meta</SelectItem>
                                <SelectItem value="Apple">Apple</SelectItem>
                                <SelectItem value="Startup">Startup</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Your Skills</label>
                            <Input
                              value={profile.declaredSkills}
                              onChange={e => setProfile({ ...profile, declaredSkills: e.target.value })}
                              placeholder="React, Node.js, Python..."
                              className="glass-input rounded-xl h-12"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={handleStart}
                        className="btn-liquid w-full h-14 text-lg font-bold text-white group-hover:text-primary transition-colors flex items-center justify-center gap-2"
                        disabled={loading}
                      >
                        {loading ? "Analyzing..." : <>Analyze Profile <span className="text-xl">→</span></>}
                      </Button>
                    </div>
                  </div>

                  {/* Recent Stats / Info */}
                  <div className="glass-card rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-secondary/10 to-transparent" />
                    <div>
                      <h4 className="text-lg font-bold mb-4">Quick Stats</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-sm text-muted-foreground">Resume Score</span>
                          <span className="font-bold text-primary">{appState.studentProfile?.resumeScore || "--"}/10</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-sm text-muted-foreground">Mock Interviews</span>
                          <span className="font-bold">{appState.interviewHistory?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 text-center">
                      <div className="w-32 h-32 mx-auto rounded-full border-4 border-white/5 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rotate-45" />
                        <span className="text-2xl font-bold">Ready</span>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground">System Online</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* OTHER VIEWS - Wrapped in Animation */}
            {view !== "LANDING" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">

                {view === "DASHBOARD" && (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold mb-6">Analytical Dashboard</h2>
                    <Dashboard state={appState} />

                    {/* Interview Topic Selection */}
                    <div className="glass-card p-6 rounded-2xl mt-6">
                      <h3 className="text-lg font-bold mb-4">Select Interview Topics</h3>
                      <div className="flex flex-wrap gap-3">
                        {["DSA", "System Design", "OOP", "Databases", "APIs", "React", "Node.js", "Python", "DevOps"].map(topic => (
                          <button
                            key={topic}
                            onClick={() => {
                              setSelectedTopics(prev =>
                                prev.includes(topic)
                                  ? prev.filter(t => t !== topic)
                                  : [...prev, topic]
                              );
                            }}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedTopics.includes(topic)
                              ? 'bg-primary text-white border-2 border-primary shadow-lg shadow-primary/30'
                              : 'bg-white/5 text-white/60 border-2 border-white/10 hover:border-white/30 hover:text-white'
                              }`}
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">Selected: {selectedTopics.join(', ') || 'None'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <Button
                        className="btn-liquid h-16 text-lg font-semibold"
                        onClick={handleStartInterview}
                        disabled={loading || selectedTopics.length === 0}
                      >
                        {loading ? "Starting..." : "Start Adaptive Interview"}
                      </Button>
                      <Button className="btn-liquid h-16 text-lg font-semibold" onClick={handleGeneratePlan} disabled={loading}>
                        {loading ? "Generating..." : "Generate Career Plan"}
                      </Button>
                    </div>
                  </div>
                )}

                {view === "INTERVIEW" && (
                  <InterviewInterface
                    initialQuestion={appState.currentQuestion}
                    history={appState.interviewHistory || []}
                    onRespond={handleInterviewResponse}
                    loading={loading}
                    onDifficultyChange={(diff) => setInterviewDifficulty(diff)}
                    selectedTopics={appState.selectedTopics || selectedTopics}
                    onTopicSelect={handleTopicSelect}
                    programmingQuestions={programmingQuestions}
                    onEndSession={() => setView("DASHBOARD")}
                    interviewPhase={interviewPhase}
                    questionsAsked={questionsAsked}
                  />
                )}

                {view === "PLANNER" && (
                  <PlannerInterface plan={appState.plan} />
                )}
              </motion.div>
            )}

          </ScrollArea>
        </div>
      </main>
    </>
  );
}

function SidebarItem({ icon, label, active, onClick, disabled, badge }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group ${active ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_20px_rgba(40,155,255,0.15)]' : 'text-muted-foreground hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      {badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-white shadow-lg shadow-secondary/40">{badge}</span>}
      {active && <motion.div layoutId="sidebar-glow" className="absolute left-0 w-1 h-8 bg-primary rounded-r-full blur-[2px]" />}
    </button>
  )
}
