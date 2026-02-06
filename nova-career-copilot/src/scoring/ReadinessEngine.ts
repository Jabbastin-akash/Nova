import { MemoryManager } from "@/memory/MemoryManager";

export class ReadinessEngine {
    public static calculateReadiness(): number {
        const memory = MemoryManager.getInstance();
        const state = memory.getState();
        const company = state.targetCompany;

        if (!company) return 0;

        const interviewHistory = state.interviewHistory;
        const resumeScore = state.studentProfile?.resumeScore || 0;

        if (interviewHistory.length === 0) {
            // Initial score based purely on resume and gap analysis if available
            return (resumeScore * 10); // Simple start
        }

        let totalTech = 0;
        let totalBehav = 0;
        let techCount = 0;
        let behavCount = 0;

        interviewHistory.forEach((interview) => {
            // Simple heuristic: if structure/clarity is highly weighted, it might be behavioral or mixed. 
            // For now, let's assume we tag questions or infer type. 
            // As a simplification > user didn't specify question type property, so we'll use structure+clarity vs technicalDepth

            // This is a simplified logic. In a real app we'd have explicit question types.
            const techScore = interview.evaluation.technicalDepth;
            const behavScore = (interview.evaluation.clarity + interview.evaluation.structure) / 2;

            totalTech += techScore;
            techCount++;

            totalBehav += behavScore;
            behavCount++;
        });

        const avgTech = techCount > 0 ? totalTech / techCount : 0;
        const avgBehav = behavCount > 0 ? totalBehav / behavCount : 0;

        // Formula: (averageTechnical × technicalWeight) + (averageBehavioral × behavioralWeight) + (resumeScore * 0.2)
        // Adjusting weights to sum meaningful to 100 or 10 scale.
        // Let's stick to 0-100 scale.
        // Weights in company config sum to 1.0 usually (0.6 + 0.4).
        // Let's treat resumeScore as a base booster (max 20 points).
        // The interview part contributes max 80 points.

        const interviewPart = ((avgTech * company.technicalWeight) + (avgBehav * company.behavioralWeight)) * 10;
        // Example: (8 * 0.6) + (7 * 0.4) = 4.8 + 2.8 = 7.6. * 10 = 76.

        const resumePart = resumeScore * 2; // Max 20.

        // Weighted Average
        // Let's follow user formula strictly:
        // (averageTechnical × technicalWeight) + (averageBehavioral × behavioralWeight) + (resumeScore * 0.2)
        // If scores are 1-10, result is e.g. 4.8 + 2.8 + 1.6 = 9.2 (out of 10)

        const readiness = (avgTech * company.technicalWeight) + (avgBehav * company.behavioralWeight) + (resumeScore * 0.2);

        // Normalize to 100 for display? Or keep 1-10. User used 1-10 in examples.
        // "Readiness Score (large display)" usually implies percentage or 100 scale.
        // Let's return 0-100.

        return Math.min(Math.round(readiness * 10), 100);
    }
}
