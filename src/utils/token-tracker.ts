interface StepUsage {
  step: string;
  promptTokens: number;
  completionTokens: number;
}

interface StepTiming {
  step: string;
  durationMs: number;
}

interface TokenSummary {
  totalPrompt: number;
  totalCompletion: number;
  total: number;
  byStep: StepUsage[];
}

export class TokenTracker {
  private usage: StepUsage[] = [];
  private timings: Map<string, { start: number; end?: number }> = new Map();

  record(step: string, promptTokens: number, completionTokens: number): void {
    this.usage.push({ step, promptTokens, completionTokens });
  }

  startStep(step: string): void {
    this.timings.set(step, { start: Date.now() });
  }

  completeStep(step: string): void {
    const t = this.timings.get(step);
    if (t) t.end = Date.now();
  }

  getTimings(): StepTiming[] {
    const result: StepTiming[] = [];
    for (const [step, t] of this.timings) {
      if (t.end != null) {
        result.push({ step, durationMs: t.end - t.start });
      }
    }
    return result;
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
    this.timings.clear();
  }
}

export const tokenTracker = new TokenTracker();
