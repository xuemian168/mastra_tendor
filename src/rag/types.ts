export type SectionType =
  | "overview"
  | "scope"
  | "technical_requirements"
  | "qualifications"
  | "timeline"
  | "pricing"
  | "legal_terms"
  | "penalties"
  | "sla"
  | "evaluation_criteria"
  | "submission_requirements"
  | "general";

export interface TenderChunk {
  id: string;
  content: string;
  metadata: {
    tenderId: string;
    sectionType: SectionType;
    sectionTitle: string;
    chunkIndex: number;
  };
}

export interface HistoricalAnalysis {
  tenderId: string;
  tenderTitle: string;
  decision: "bid" | "no_bid" | "conditional_bid";
  confidenceScore: number;
  summary: string;
  timestamp: number;
}
