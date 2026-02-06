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
    const readiness = state.readinessScore || 0;
    const profile = state.studentProfile || {};
    const gaps = state.message ? [] : (state.skillGapData?.priorityGaps || []);
    const strengths = state.studentProfile?.inferredStrengths || [];

    // Mock data for radar chart if real data isn't fully granulated yet
    const radarData = [
        { subject: 'DSA', A: profile.technicalMaturityScore ? profile.technicalMaturityScore * 10 : 50, fullMark: 100 },
        { subject: 'System Design', A: 40, fullMark: 100 },
        { subject: 'Communication', A: 70, fullMark: 100 },
        { subject: 'Projects', A: profile.project_depth_score ? profile.project_depth_score * 10 : 60, fullMark: 100 },
        { subject: 'Knowledge', A: 80, fullMark: 100 },
        { subject: 'Resume', A: profile.resumeScore ? profile.resumeScore * 10 : 60, fullMark: 100 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Readiness Score */}
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
                    <Card className="h-full border-primary/20 bg-gradient-to-br from-background to-secondary/10">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                                Readiness Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center p-6">
                            <div className="relative size-40 flex items-center justify-center rounded-full border-8 border-primary/30">
                                <span className="text-5xl font-extrabold">{readiness}%</span>
                            </div>
                            <p className="mt-4 text-muted-foreground">Target: {profile.targetCompany || "Unknown"}</p>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Radar Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Skill Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis />
                                <Radar name="Skills" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weak Areas */}
                <Card className="border-red-200 bg-red-50/10">
                    <CardHeader>
                        <CardTitle className="text-red-500">Priority Focus Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2">
                            {gaps.length > 0 ? gaps.map((gap: string) => (
                                <li key={gap} className="font-medium">{gap}</li>
                            )) : <p>Analysis in progress...</p>}
                        </ul>
                    </CardContent>
                </Card>

                {/* Strengths */}
                <Card className="border-green-200 bg-green-50/10">
                    <CardHeader>
                        <CardTitle className="text-green-600">Your Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {strengths.length > 0 ? strengths.map((str: string) => (
                                <Badge key={str} variant="outline" className="text-sm px-3 py-1">{str}</Badge>
                            )) : <p>Analysis in progress...</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
