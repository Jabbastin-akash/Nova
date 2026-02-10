"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InterviewInterfaceProps {
    initialQuestion: string;
    onRespond: (answer: string) => void;
    history: any[];
    loading: boolean;
    onDifficultyChange?: (difficulty: string) => void;
    selectedTopics?: string[];
    onTopicSelect?: (topics: string[]) => void;
    programmingQuestions?: any[];
    onEndSession?: () => void;
}

const TOPIC_OPTIONS = [
    "Data Structures & Algorithms",
    "System Design",
    "Object-Oriented Programming",
    "Database & SQL",
    "Operating Systems",
    "Networking",
    "Web Development",
    "Machine Learning",
    "Behavioral Questions",
];

export function InterviewInterface({
    initialQuestion,
    onRespond,
    history,
    loading,
    onDifficultyChange,
    selectedTopics = [],
    onTopicSelect,
    programmingQuestions = [],
    onEndSession,
}: InterviewInterfaceProps) {
    const [answer, setAnswer] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [phase, setPhase] = useState<"TOPIC_SELECT" | "INTERVIEWING">(
        selectedTopics.length > 0 ? "INTERVIEWING" : "TOPIC_SELECT"
    );
    const [pickedTopics, setPickedTopics] = useState<string[]>(selectedTopics);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [history, loading]);

    useEffect(() => {
        if (selectedTopics.length > 0) {
            setPhase("INTERVIEWING");
            setPickedTopics(selectedTopics);
        }
    }, [selectedTopics]);

    const toggleTopic = (topic: string) => {
        setPickedTopics((prev) =>
            prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
        );
    };

    const startInterview = () => {
        if (pickedTopics.length === 0) return;
        setPhase("INTERVIEWING");
        if (onTopicSelect) onTopicSelect(pickedTopics);
        onRespond(`I want to focus on: ${pickedTopics.join(", ")}`);
    };

    const handleSubmit = () => {
        if (!answer.trim()) return;
        onRespond(answer);
        setAnswer("");
    };

    const handleDifficulty = (val: string) => {
        setDifficulty(val);
        if (onDifficultyChange) onDifficultyChange(val);
    };

    const handleEndSession = () => {
        if (onEndSession) {
            onEndSession();
        }
    };

    // ---------- TOPIC SELECT PHASE ----------
    if (phase === "TOPIC_SELECT") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
                <div className="glass-card gradient-border p-8 rounded-2xl max-w-2xl w-full text-center space-y-6">
                    <div className="flex justify-center">
                        <Avatar className="w-16 h-16 border-2 border-primary/50">
                            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">AI</AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-glow-blue">
                            What should we focus on today?
                        </h2>
                        <p className="text-muted-foreground">
                            Select one or more topics you'd like me to interview you on.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center">
                        {TOPIC_OPTIONS.map((topic) => {
                            const isSelected = pickedTopics.includes(topic);
                            return (
                                <button
                                    key={topic}
                                    onClick={() => toggleTopic(topic)}
                                    className={`
                                        px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border backdrop-blur-sm
                                        ${isSelected
                                            ? "bg-primary/20 border-primary/50 text-primary shadow-[0_0_15px_rgba(40,155,255,0.3)]"
                                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                                        }
                                    `}
                                >
                                    {isSelected && "✓ "}{topic}
                                </button>
                            );
                        })}
                    </div>

                    {pickedTopics.length > 0 && (
                        <button
                            onClick={startInterview}
                            className="btn-liquid px-8 py-3 text-base font-semibold bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30 hover:border-primary/60"
                        >
                            Start Interview — {pickedTopics.length} topic{pickedTopics.length > 1 ? "s" : ""} selected
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ---------- INTERVIEW PHASE ----------
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[80vh]">
            {/* Main Chat Area */}
            <div className="lg:col-span-5 flex flex-col h-full glass-card gradient-border rounded-2xl overflow-hidden">
                <div className="p-3 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-white/5 to-transparent">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Conceptual Interview
                    </h3>
                    <Select value={difficulty} onValueChange={handleDifficulty}>
                        <SelectTrigger className="h-7 w-22 bg-black/50 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-black/90 border-white/10">
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Initial Question */}
                    {history.length === 0 && initialQuestion && (
                        <div className="flex gap-3">
                            <Avatar className="w-8 h-8 border border-primary/50 shrink-0">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">AI</AvatarFallback>
                            </Avatar>
                            <div className="glass-card p-3 rounded-xl rounded-tl-none max-w-[90%]">
                                <p className="text-primary text-[10px] font-bold mb-1 uppercase tracking-wider">Interviewer</p>
                                <p className="text-sm leading-relaxed">{initialQuestion}</p>
                            </div>
                        </div>
                    )}

                    {/* History */}
                    {history.map((item, idx) => (
                        <div key={idx} className="space-y-4">
                            <div className="flex gap-3">
                                <Avatar className="w-8 h-8 border border-primary/50 shrink-0">
                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">AI</AvatarFallback>
                                </Avatar>
                                <div className="glass-card p-3 rounded-xl rounded-tl-none max-w-[90%]">
                                    <p className="text-primary text-[10px] font-bold mb-1 uppercase tracking-wider">Interviewer</p>
                                    <p className="text-sm leading-relaxed">{item.question}</p>
                                </div>
                            </div>

                            <div className="flex gap-3 flex-row-reverse">
                                <Avatar className="w-8 h-8 border border-white/20 shrink-0">
                                    <AvatarFallback className="bg-white/10 text-xs">ME</AvatarFallback>
                                </Avatar>
                                <div className="bg-primary/20 border border-primary/30 p-3 rounded-xl rounded-tr-none max-w-[90%]">
                                    <p className="text-white/50 text-[10px] font-bold mb-1 uppercase tracking-wider text-right">You</p>
                                    <p className="text-sm leading-relaxed text-white/90">{item.answer}</p>
                                </div>
                            </div>

                            {item.evaluation && (
                                <div className="mx-10 p-2 rounded-lg bg-yellow-500/10 border-l-2 border-yellow-500 text-xs text-yellow-200/80">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-bold">Feedback</span>
                                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 text-[10px]">
                                            Score: {item.evaluation.technicalDepth}/10
                                        </Badge>
                                    </div>
                                    <p>{item.feedback}</p>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Follow-up question */}
                    {history.length > 0 && history[history.length - 1].answer && initialQuestion && (
                        <div className="flex gap-3">
                            <Avatar className="w-8 h-8 border border-primary/50 shrink-0">
                                <AvatarFallback className="bg-primary/20 text-primary text-xs">AI</AvatarFallback>
                            </Avatar>
                            <div className="glass-card p-3 rounded-xl rounded-tl-none max-w-[90%] animate-in fade-in slide-in-from-left-2">
                                <p className="text-primary text-[10px] font-bold mb-1 uppercase tracking-wider">Interviewer</p>
                                <p className="text-sm leading-relaxed">{initialQuestion}</p>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center gap-2 text-muted-foreground animate-pulse ml-10">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-75" />
                            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-150" />
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-3 border-t border-white/10 bg-black/20">
                    <div className="relative">
                        <Textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type your answer..."
                            className="bg-black/50 border-white/10 focus:border-primary/50 text-sm min-h-[60px] p-3 pr-24 resize-none rounded-xl"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="absolute bottom-2 right-2 btn-liquid px-4 h-8 text-sm font-medium disabled:opacity-50"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>

            {/* Programming Column */}
            <div className="lg:col-span-4 flex flex-col h-full glass-card gradient-border rounded-2xl overflow-hidden">
                <div className="p-3 border-b border-white/10 bg-gradient-to-r from-secondary/10 to-transparent">
                    <h3 className="font-bold text-sm flex items-center gap-2 text-secondary">
                        &lt;/&gt; Programming Challenge
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1">Code version of the same concepts</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {programmingQuestions.length > 0 ? (
                        programmingQuestions.map((pq, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="glass-card p-4 rounded-xl border-l-2 border-l-secondary/50">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-secondary/20 text-secondary border-secondary/30 text-[10px]">
                                            Q{idx + 1}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] border-white/10">
                                            {pq.difficulty || difficulty}
                                        </Badge>
                                    </div>
                                    <p className="text-sm font-medium mb-3">{pq.question || pq}</p>
                                    {pq.hint && (
                                        <div className="bg-white/5 rounded-lg p-2 text-xs text-white/60 border border-white/5">
                                            <span className="font-medium">Hint:</span> {pq.hint}
                                        </div>
                                    )}
                                    {pq.example && (
                                        <pre className="mt-2 bg-black/40 rounded-lg p-3 text-xs text-green-400/80 font-mono overflow-x-auto border border-white/5">
                                            {pq.example}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-muted-foreground">
                            <div className="text-4xl opacity-30 font-mono">&lt;/&gt;</div>
                            <p className="text-sm">Programming questions will appear here as you answer conceptual questions.</p>
                            <p className="text-xs text-white/30">Each topic gets a coding challenge.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Stats */}
            <div className="lg:col-span-3 glass-card gradient-border p-4 rounded-2xl h-fit space-y-5">
                <h3 className="font-bold text-sm mb-3 neon-underline">Session Stats</h3>

                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Questions Answered</p>
                    <p className="text-3xl font-bold">{history.length}</p>
                </div>

                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Difficulty</p>
                    <Badge className={
                        difficulty === 'Hard' ? "bg-red-500/20 text-red-400 border-red-500/50"
                            : difficulty === 'Medium' ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                : "bg-green-500/20 text-green-400 border-green-500/50"
                    }>
                        {difficulty}
                    </Badge>
                </div>

                <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Focus Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                        {pickedTopics.length > 0 ? (
                            pickedTopics.map((topic, i) => (
                                <Badge key={i} variant="outline" className="border-primary/30 text-primary text-[10px]">
                                    {topic}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-xs text-white/50">All Topics</p>
                        )}
                    </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                    <button
                        onClick={() => {
                            setPhase("TOPIC_SELECT");
                            setPickedTopics([]);
                        }}
                        className="w-full btn-liquid py-2 text-xs font-medium"
                    >
                        Change Topics
                    </button>
                    <button
                        onClick={handleEndSession}
                        className="w-full btn-liquid-orange py-2 text-xs font-medium text-secondary"
                    >
                        End Session
                    </button>
                </div>
            </div>
        </div>
    );
}
