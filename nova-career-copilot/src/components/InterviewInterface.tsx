"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Ensure import

interface InterviewInterfaceProps {
    initialQuestion: string;
    onRespond: (answer: string) => void;
    history: any[];
    loading: boolean;
    onDifficultyChange?: (difficulty: string) => void;
    selectedTopics?: string[];
}

export function InterviewInterface({ initialQuestion, onRespond, history, loading, onDifficultyChange, selectedTopics = [] }: InterviewInterfaceProps) {
    const [answer, setAnswer] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");

    const handleSubmit = () => {
        if (!answer.trim()) return;
        onRespond(answer);
        setAnswer("");
    };

    const handleDifficulty = (val: string) => {
        setDifficulty(val);
        if (onDifficultyChange) onDifficultyChange(val);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
            {/* Chat Area */}
            <div className="lg:col-span-2 flex flex-col h-full glass-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Adaptive Interview
                    </h3>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Difficulty:</label>
                        <Select value={difficulty} onValueChange={handleDifficulty}>
                            <SelectTrigger className="h-8 w-24 bg-black/50 border-white/10 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-black/90 border-white/10">
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex-1 p-0 overflow-hidden relative">
                    <ScrollArea className="h-full p-6 space-y-6">
                        {/* Initial Greeting / Question */}
                        {history.length === 0 && initialQuestion && (
                            <div className="flex gap-4">
                                <Avatar className="w-10 h-10 border border-primary/50"><AvatarFallback className="bg-primary/20 text-primary">AI</AvatarFallback></Avatar>
                                <div className="glass-card p-4 rounded-xl rounded-tl-none max-w-[85%] animate-in fade-in slide-in-from-left-2">
                                    <p className="text-primary text-xs font-bold mb-1 uppercase tracking-wider">Interviewer</p>
                                    <p className="text-lg leading-relaxed">{initialQuestion}</p>
                                </div>
                            </div>
                        )}

                        {/* History */}
                        {history.map((item, idx) => (
                            <div key={idx} className="space-y-6">
                                {/* Agent Question */}
                                <div className="flex gap-4">
                                    <Avatar className="w-10 h-10 border border-primary/50"><AvatarFallback className="bg-primary/20 text-primary">AI</AvatarFallback></Avatar>
                                    <div className="glass-card p-4 rounded-xl rounded-tl-none max-w-[85%]">
                                        <p className="text-primary text-xs font-bold mb-1 uppercase tracking-wider">Interviewer</p>
                                        <p className="text-lg leading-relaxed">{item.question}</p>
                                    </div>
                                </div>
                                {/* User Answer */}
                                <div className="flex gap-4 flex-row-reverse">
                                    <Avatar className="w-10 h-10 border border-white/20"><AvatarFallback className="bg-white/10">ME</AvatarFallback></Avatar>
                                    <div className="bg-primary/20 border border-primary/30 p-4 rounded-xl rounded-tr-none max-w-[85%] backdrop-blur-sm">
                                        <p className="text-white/50 text-xs font-bold mb-1 uppercase tracking-wider text-right">You</p>
                                        <p className="text-lg leading-relaxed text-white/90">{item.answer}</p>
                                    </div>
                                </div>
                                {/* Feedback */}
                                {item.evaluation && (
                                    <div className="mx-12 p-3 rounded-lg bg-yellow-500/10 border-l-2 border-yellow-500 text-sm text-yellow-200/80">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-bold">Feedback</span>
                                            <Badge variant="outline" className="border-yellow-500/30 text-yellow-500">Score: {item.evaluation.technicalDepth}/10</Badge>
                                        </div>
                                        <p>{item.feedback}</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Current Question (if history exists) */}
                        {history.length > 0 && history[history.length - 1].answer && (
                            <div className="flex gap-4 mt-6">
                                <Avatar className="w-10 h-10 border border-primary/50"><AvatarFallback className="bg-primary/20 text-primary">AI</AvatarFallback></Avatar>
                                <div className="glass-card p-4 rounded-xl rounded-tl-none max-w-[85%] animate-in fade-in slide-in-from-left-2">
                                    <p className="text-primary text-xs font-bold mb-1 uppercase tracking-wider">Interviewer</p>
                                    <p className="text-lg leading-relaxed">{initialQuestion}</p>
                                </div>
                            </div>
                        )}

                        {loading && (
                            <div className="flex items-center gap-3 text-muted-foreground animate-pulse ml-14">
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-75" />
                                <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150" />
                            </div>
                        )}
                        <div className="h-4" /> {/* Spacer */}
                    </ScrollArea>
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
                    <div className="relative">
                        <Textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type your answer..."
                            className="bg-black/50 border-white/10 focus:border-primary/50 text-lg min-h-[80px] p-4 pr-32 resize-none rounded-xl"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="absolute bottom-3 right-3 btn-liquid px-6 h-10"
                        >
                            Send ↵
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sidebar Stats */}
            <div className="glass-card p-6 rounded-2xl h-fit space-y-6">
                <h3 className="font-bold text-lg mb-4">Session Stats</h3>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Questions Answered</p>
                    <p className="text-3xl font-bold">{history.length}</p>
                </div>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Current Difficulty</p>
                    <Badge className={difficulty === 'Hard' ? "bg-red-500/20 text-red-400 border-red-500/50" : difficulty === 'Medium' ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" : "bg-green-500/20 text-green-400 border-green-500/50"}>
                        {difficulty}
                    </Badge>
                </div>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Focus Topics</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedTopics.length > 0 ? (
                            selectedTopics.map((topic, i) => (
                                <Badge key={i} variant="outline" className="border-primary/30 text-primary">
                                    {topic}
                                </Badge>
                            ))
                        ) : (
                            <p className="text-sm text-white/50">All Topics</p>
                        )}
                    </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10">
                    <Button className="btn-liquid w-full">📍 End Session</Button>
                </div>
            </div>
        </div>
    );
}

