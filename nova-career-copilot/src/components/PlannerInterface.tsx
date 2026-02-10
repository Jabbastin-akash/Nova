"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface PlannerInterfaceProps {
    plan: any;
}

export function PlannerInterface({ plan }: PlannerInterfaceProps) {
    const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "resume">("daily");

    if (!plan) return (
        <div className="glass-card gradient-border p-12 text-center">
            <p className="text-2xl text-muted-foreground">No plan generated yet.</p>
            <p className="text-sm text-white/30 mt-2">Complete your analysis and interview first.</p>
        </div>
    );

    const dailyPlan = plan.daily_plan || [];
    const weeklySchedule = plan.weekly_mock_schedule || [];
    const resumeActions = plan.resume_improvement_actions || [];
    const projectSuggestions = plan.project_upgrade_suggestions || [];

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight neon-underline">Your Personalized Roadmap</h2>
                <p className="text-muted-foreground mt-4">
                    Expected Readiness Score: <span className="text-primary font-bold text-lg">{plan.expected_readiness_after_plan || "85%"}</span>
                </p>
            </div>

            {/* Custom Tab Buttons — liquid glass style */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1.5 backdrop-blur-md">
                {[
                    { key: "daily" as const, label: "Daily Plan", count: dailyPlan.length + " days" },
                    { key: "weekly" as const, label: "Weekly Schedule", count: String(weeklySchedule.length) },
                    { key: "resume" as const, label: "Resume Actions", count: String(resumeActions.length) },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${activeTab === tab.key
                                ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-[0_0_15px_rgba(40,155,255,0.2)] border border-primary/30"
                                : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
                            }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">

                {/* Daily Plan */}
                {activeTab === "daily" && (
                    <div className="space-y-4">
                        {dailyPlan.length > 0 ? dailyPlan.map((day: any, idx: number) => (
                            <div key={idx} className="glass-card-hover gradient-border p-5 transition-all duration-300">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30 shrink-0">
                                            <span className="text-primary font-bold text-sm">{day.day}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base">{day.focus}</h4>
                                        </div>
                                    </div>
                                    <Badge className="bg-accent/20 text-accent border-accent/30 text-xs shrink-0">
                                        {day.expected_outcome}
                                    </Badge>
                                </div>
                                <div className="ml-13 space-y-2">
                                    {(day.tasks || []).map((task: string, i: number) => (
                                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-white/5">
                                            <span className="text-primary text-sm mt-0.5 shrink-0">›</span>
                                            <span className="text-sm text-white/85">{typeof task === 'string' ? task : JSON.stringify(task)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="glass-card p-8 text-center text-muted-foreground">
                                No daily plan items available.
                            </div>
                        )}
                    </div>
                )}

                {/* Weekly Schedule */}
                {activeTab === "weekly" && (
                    <div className="space-y-4">
                        <div className="glass-card gradient-border p-6">
                            <h3 className="font-bold text-lg mb-4 neon-underline">Weekly Mock Schedule</h3>
                            <div className="space-y-3 mt-4">
                                {weeklySchedule.length > 0 ? weeklySchedule.map((item: any, i: number) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 hover:bg-white/8 transition-all duration-300"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30 shrink-0">
                                            <span className="text-primary text-xs font-bold">{i + 1}</span>
                                        </div>
                                        <span className="text-sm text-white/85 pt-1.5">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground italic">No weekly schedule available.</p>
                                )}
                            </div>
                        </div>

                        {/* Project Upgrade Suggestions */}
                        {projectSuggestions.length > 0 && (
                            <div className="glass-card gradient-border p-6">
                                <h3 className="font-bold text-lg mb-4 neon-underline">Project Upgrade Ideas</h3>
                                <div className="space-y-3 mt-4">
                                    {projectSuggestions.map((item: any, i: number) => (
                                        <div
                                            key={i}
                                            className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors border border-transparent hover:border-accent/20"
                                        >
                                            <span className="text-accent mt-0.5 font-bold">+</span>
                                            <span className="text-sm text-white/85">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Resume Actions */}
                {activeTab === "resume" && (
                    <div className="glass-card gradient-border p-6">
                        <h3 className="font-bold text-lg mb-4 neon-underline">Resume Improvements</h3>
                        <div className="space-y-3 mt-4">
                            {resumeActions.length > 0 ? resumeActions.map((item: any, i: number) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3 p-4 rounded-xl bg-secondary/5 border border-secondary/10 hover:bg-secondary/10 hover:border-secondary/20 transition-all duration-300"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center border border-secondary/30 shrink-0">
                                        <span className="text-secondary text-xs font-bold">{i + 1}</span>
                                    </div>
                                    <span className="text-sm text-white/85 pt-1.5">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                                </div>
                            )) : (
                                <p className="text-muted-foreground italic">No resume actions available.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
