export interface CompanyProfile {
  id: string;
  name: string;
  technicalWeight: number;
  behavioralWeight: number;
  focusAreas: string[];
  difficultyBias: number; // 1.0 = neutral, >1.0 = harder
}

export const companyProfiles: Record<string, CompanyProfile> = {
  amazon: {
    id: "amazon",
    name: "Amazon",
    technicalWeight: 0.6,
    behavioralWeight: 0.4,
    focusAreas: ["DSA", "Object-Oriented Programming", "Leadership Principles", "Scalability"],
    difficultyBias: 1.0, 
  },
  google: {
    id: "google",
    name: "Google",
    technicalWeight: 0.8,
    behavioralWeight: 0.2,
    focusAreas: ["Algorithms", "System Design", "Graph Theory", "Concurrency"],
    difficultyBias: 1.2, 
  },
  microsoft: {
    id: "microsoft",
    name: "Microsoft",
    technicalWeight: 0.7,
    behavioralWeight: 0.3,
    focusAreas: ["System Design", "Testing", "DSA", "Distributed Systems"],
    difficultyBias: 1.0,
  },
  startup: {
    id: "startup",
    name: "High Growth Startup",
    technicalWeight: 0.5,
    behavioralWeight: 0.5,
    focusAreas: ["Full Stack Development", "Product Sense", "Speed of Execution", "Database Design"],
    difficultyBias: 0.9,
  }
};
