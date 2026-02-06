"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface InterviewInterfaceProps {
    initialQuestion: string;
    onRespond: (answer: string) => void;
    history: any[];
    loading: boolean;
}

export function InterviewInterface({ initialQuestion, onRespond, history, loading }: InterviewInterfaceProps) {
    const [answer, setAnswer] = useState("");

    const handleSubmit = () => {
        if (!answer.trim()) return;
        onRespond(answer);
        setAnswer("");
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
            {/* Chat Area */}
            <Card className="lg:col-span-2 flex flex-col h-full">
                <CardHeader>
                    <CardTitle>Interview Session - Adaptive Mode</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full p-4 space-y-4">
                        {/* History */}
                        {history.map((item, idx) => (
                            <div key={idx} className="space-y-4 mb-6">
                                {/* Agent Question */}
                                <div className="flex gap-4">
                                    <Avatar>
                                        <AvatarFallback>AI</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted p-3 rounded-lg max-w-[80%]">
                                        <p className="text-sm font-semibold mb-1">Interviewer</p>
                                        <p>{item.question}</p>
                                    </div>
                                </div>
                                {/* User Answer */}
                                <div className="flex gap-4 flex-row-reverse">
                                    <Avatar>
                                        <AvatarFallback>ME</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-[80%]">
                                        <p className="text-sm font-semibold mb-1 opacity-70">You</p>
                                        <p>{item.answer}</p>
                                    </div>
                                </div>
                                {/* Feedback */}
                                {item.evaluation && (
                                    <div className="ml-12 border-l-2 border-yellow-400 pl-4 py-2 bg-yellow-50/50 text-sm text-muted-foreground">
                                        <p className="font-bold text-yellow-600">Feedback:</p>
                                        <p>Tech Depth: {item.evaluation.technicalDepth}/10</p>
                                        <p>{item.feedback}</p>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Current Question */}
                        {history.length === 0 || history[history.length - 1].answer ? (
                            <div className="flex gap-4 mt-4">
                                <Avatar><AvatarFallback>AI</AvatarFallback></Avatar>
                                <div className="bg-muted p-3 rounded-lg max-w-[80%] animate-in fade-in slide-in-from-bottom-2">
                                    <p className="text-sm font-semibold mb-1">Interviewer</p>
                                    <p className="text-lg">{initialQuestion}</p>
                                </div>
                            </div>
                        ) : null}

                        {loading && <div className="text-center text-sm text-muted-foreground animate-pulse">Thinking...</div>}
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-4 border-t">
                    <div className="w-full flex gap-4">
                        <Textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            className="resize-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <Button onClick={handleSubmit} disabled={loading} className="h-auto px-6">
                            Send
                        </Button>
                    </div>
                </CardFooter>
            </Card>

            {/* Sidebar / Stats */}
            <div className="hidden lg:block space-y-4">
                <Card>
                    <CardHeader><CardTitle>Session Stats</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Questions Answered</p>
                                <p className="text-2xl font-bold">{history.length}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Current Difficulty</p>
                                <Badge variant="secondary">Medium</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
