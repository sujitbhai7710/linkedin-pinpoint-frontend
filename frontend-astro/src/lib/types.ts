export interface PinpointPuzzle {
        number: number;
        date: string;
        clues: string[];
        answer: string;
        explanation: string;
        solutions: string[];
        totalSolutions: number;
}

export interface PinpointSummary {
        number: number;
        date: string;
        clues: string[];
}

export interface PaginatedResponse {
        puzzles: PinpointSummary[];
        total: number;
        page: number;
        limit: number;
}

export interface CheckResult {
        exists: boolean;
        word: string;
}

export interface SolutionsResponse {
        solutions: string[];
        offset: number;
        limit: number;
        total: number;
        number: number;
}
