"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface PlannerInterfaceProps {
    plan: any;
}

export function PlannerInterface({ plan }: PlannerInterfaceProps) {
    if (!plan) return <div>No plan generated yet.</div>;

    const dailyPlan = plan.daily_plan || [];

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Your Personalized Roadmap</h2>
                <p className="text-muted-foreground">Expected Readiness Score: <span className="text-primary font-bold">{plan.expected_readiness_after_plan || "85%"}</span></p>
            </div>

            <Tabs defaultValue="daily" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="daily">Daily Plan</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
                    <TabsTrigger value="resume">Resume Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="daily" className="mt-6 space-y-4">
                    {dailyPlan.map((day: any) => (
                        <Card key={day.day}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>Day {day.day}: {day.focus}</CardTitle>
                                    <Badge>{day.expected_outcome}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc pl-5 space-y-1">
                                    {day.tasks.map((task: string, i: number) => (
                                        <li key={i}>{task}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="weekly">
                    <Card>
                        <CardHeader><CardTitle>Weekly Mock Schedule</CardTitle></CardHeader>
                        <CardContent>
                            {plan.weekly_mock_schedule?.map((item: any, i: number) => (
                                <div key={i} className="mb-2 p-2 bg-muted rounded">
                                    {item}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="resume">
                    <Card>
                        <CardHeader><CardTitle>Resume Improvements</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5">
                                {plan.resume_improvement_actions?.map((item: any, i: number) => (
                                    <li key={i} className="mb-2">{item}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
