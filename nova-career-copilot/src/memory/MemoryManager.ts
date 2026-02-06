import { CompanyProfile, companyProfiles } from "@/config/companyProfiles";

export interface StudentProfile {
    resumeText: string;
    declaredSkills: string[];
    academicYear: string;
    targetCompany: string;
    resumeScore?: number;
    technicalMaturityScore?: number;
    missingCoreAreas?: string[];
    inferredStrengths?: string[];
}

export interface SkillGapData {
    readinessPercentage: number;
    priorityGaps: string[];
    secondaryGaps: string[];
    alignmentScore: number;
}

export interface InterviewResult {
    id: string;
    question: string;
    topic: string;
    answer: string;
    evaluation: {
        technicalDepth: number;
        clarity: number;
        structure: number;
    };
    feedback: string;
    timestamp: Date;
}

export interface AgentState {
    studentProfile?: StudentProfile;
    skillGapData?: SkillGapData;
    interviewHistory: InterviewResult[];
    weakAreas: string[];
    strengths: string[];
    readinessScore: number;
    targetCompany?: CompanyProfile;
    sessionStage: "PROFILE_ANALYSIS" | "SKILL_GAP" | "INTERVIEW" | "PLANNING" | "COMPLETED";
}

export class MemoryManager {
    private static instance: MemoryManager;
    private state: AgentState;

    private constructor() {
        this.state = {
            interviewHistory: [],
            weakAreas: [],
            strengths: [],
            readinessScore: 0,
            sessionStage: "PROFILE_ANALYSIS",
        };
    }

    public static getInstance(): MemoryManager {
        if (!MemoryManager.instance) {
            MemoryManager.instance = new MemoryManager();
        }
        return MemoryManager.instance;
    }

    public updateProfile(profile: StudentProfile): void {
        this.state.studentProfile = profile;
        if (profile.targetCompany && companyProfiles[profile.targetCompany.toLowerCase()]) {
            this.state.targetCompany = companyProfiles[profile.targetCompany.toLowerCase()];
        }
        this.state.weakAreas = profile.missingCoreAreas || [];
        this.state.strengths = profile.inferredStrengths || [];
    }

    public updateSkillGap(data: SkillGapData): void {
        this.state.skillGapData = data;
        this.state.weakAreas = [...this.state.weakAreas, ...data.priorityGaps];
    }

    public addInterviewResult(result: InterviewResult): void {
        this.state.interviewHistory.push(result);
        // Dynamic weak area update logic could go here
        if (result.evaluation.technicalDepth < 6) {
            if (!this.state.weakAreas.includes(result.topic)) {
                this.state.weakAreas.push(result.topic);
            }
        }
    }

    public updateReadinessScore(score: number): void {
        this.state.readinessScore = score;
    }

    public setSessionStage(stage: AgentState["sessionStage"]): void {
        this.state.sessionStage = stage;
    }

    public getState(): AgentState {
        return { ...this.state };
    }

    public resetSession(): void {
        this.state = {
            interviewHistory: [],
            weakAreas: [],
            strengths: [],
            readinessScore: 0,
            sessionStage: "PROFILE_ANALYSIS",
        };
    }
}
