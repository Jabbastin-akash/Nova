export interface AgentInput {
    type: string;
    data: any;
}

export interface AgentOutput {
    success: boolean;
    data: any;
    message?: string;
}

export interface Agent {
    name: string;
    process(input: AgentInput): Promise<AgentOutput>;
}
