interface StepUsage {
  step: string;
  promptTokens: number;
  completionTokens: number;
}

interface TokenSummary {
  totalPrompt: number;
  totalCompletion: number;
  total: number;
  byStep: StepUsage[];
}

export class TokenTracker {
  private usage: StepUsage[] = [];

  record(step: string, promptTokens: number, completionTokens: number): void {
    this.usage.push({ step, promptTokens, completionTokens });
  }

  getSummary(): TokenSummary {
    const totalPrompt = this.usage.reduce((sum, u) => sum + u.promptTokens, 0);
    const totalCompletion = this.usage.reduce((sum, u) => sum + u.completionTokens, 0);
    return {
      totalPrompt,
      totalCompletion,
      total: totalPrompt + totalCompletion,
      byStep: [...this.usage],
    };
  }

  reset(): void {
    this.usage = [];
  }
}

export const tokenTracker = new TokenTracker();
