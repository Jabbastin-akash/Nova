"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface DashboardProps {
    state: any;
}

export function Dashboard({ state }: DashboardProps) {
    // Determine data source keys (handle snake_case vs camelCase)
    const profile = state.studentProfile || {};
    const readiness = state.readinessScore || profile.resume_score || profile.resumeScore || 0;

    // Gaps: handle 'missing_core_areas' from Agent or 'priorityGaps' from Orchestrator logic
    const gaps = state.skillGapData?.priorityGaps || profile.missing_core_areas || profile.missingCoreAreas || [];

    // Strengths: handle 'inferred_strengths' from Agent
    const strengths = profile.inferred_strengths || profile.inferredStrengths || [];

    // Mock data for radar chart if real data isn't fully granulated yet
    const radarData = [
        { subject: 'DSA', A: profile.technical_maturity_score ? profile.technical_maturity_score * 10 : 50, fullMark: 100 },
        { subject: 'System Design', A: 40, fullMark: 100 },
        { subject: 'Communication', A: 70, fullMark: 100 },
        { subject: 'Projects', A: profile.project_depth_score ? profile.project_depth_score * 10 : 60, fullMark: 100 },
        { subject: 'Knowledge', A: 80, fullMark: 100 },
        { subject: 'Resume', A: profile.resume_score ? profile.resume_score * 10 : 60, fullMark: 100 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Readiness Score */}
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
                    <div className="glass-card h-full p-6 relative overflow-hidden flex flex-col items-center justify-center">
                        <div className="absolute inset-0 bg-primary/5 lazy-blob" />
                        <h3 className="text-lg font-bold text-muted-foreground z-10">Readiness Score</h3>

                        <div className="relative size-48 my-6 flex items-center justify-center">
                            {/* Liquid Ring Animation Mockup */}
                            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                            <div className="absolute inset-0 rounded-full border-4 border-primary/50 border-t-transparent animate-spin duration-[3s]" />
                            <div className="absolute inset-4 rounded-full border-4 border-secondary/30 border-b-transparent animate-spin duration-[5s] direction-reverse" />

                            <div className="text-center z-10">
                                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">{readiness}</span>
                                <span className="text-xl text-muted-foreground">%</span>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground z-10 bg-white/5 px-3 py-1 rounded-full border border-white/5">Target: {profile.targetCompany || "Unknown"}</p>
                    </div>
                </motion.div>

                {/* Radar Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold mb-4">Skill Analysis</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Skills" dataKey="A" stroke="#289BFF" strokeWidth={3} fill="#289BFF" fillOpacity={0.2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weak Areas */}
                <div className="glass-card p-6 border-l-4 border-l-red-500/50">
                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                        <span>⚠️</span> Priority Focus Areas
                    </h3>
                    <ul className="space-y-3">
                        {gaps.length > 0 ? gaps.map((gap: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-colors">
                                <span className="text-red-500 mt-1">›</span>
                                <span className="text-sm font-medium text-white/90">{gap}</span>
                            </li>
                        )) : <p className="text-muted-foreground italic">Analysis in progress...</p>}
                    </ul>
                </div>

                {/* Strengths */}
                <div className="glass-card p-6 border-l-4 border-l-green-500/50">
                    <h3 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                        <span>💪</span> Your Strengths
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {strengths.length > 0 ? strengths.map((str: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-sm px-4 py-2 border-green-500/30 text-green-400 bg-green-500/5 hover:bg-green-500/10">
                                {str}
                            </Badge>
                        )) : <p className="text-muted-foreground italic">Analysis in progress...</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
