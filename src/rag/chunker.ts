import type { TenderChunk, SectionType } from "./types.js";

const CHUNK_SIZE = 3200;
const CHUNK_OVERLAP = 200;
const SHORT_DOC_THRESHOLD = 5000;

const SECTION_BOUNDARY = /^(?:#{1,4}\s+.+|(?:\d+\.)+\s+.+|[A-Z][A-Z\s]{4,}$|(?:Section|Article|Part|Appendix|Annex|Schedule)\s+[\dA-Z])/m;

const SECTION_TYPE_KEYWORDS: Record<string, SectionType> = {
  overview: "overview",
  introduction: "overview",
  background: "overview",
  scope: "scope",
  "scope of work": "scope",
  technical: "technical_requirements",
  specification: "technical_requirements",
  requirement: "technical_requirements",
  qualification: "qualifications",
  eligibility: "qualifications",
  certification: "qualifications",
  experience: "qualifications",
  timeline: "timeline",
  schedule: "timeline",
  deadline: "timeline",
  milestone: "timeline",
  delivery: "timeline",
  price: "pricing",
  pricing: "pricing",
  cost: "pricing",
  financial: "pricing",
  budget: "pricing",
  legal: "legal_terms",
  terms: "legal_terms",
  condition: "legal_terms",
  liability: "legal_terms",
  indemnif: "legal_terms",
  penalty: "penalties",
  liquidated: "penalties",
  damage: "penalties",
  sla: "sla",
  "service level": "sla",
  uptime: "sla",
  availability: "sla",
  evaluation: "evaluation_criteria",
  criteria: "evaluation_criteria",
  scoring: "evaluation_criteria",
  submission: "submission_requirements",
  proposal: "submission_requirements",
  format: "submission_requirements",
};

function inferSectionType(title: string): SectionType {
  const lower = title.toLowerCase();
  for (const [keyword, type] of Object.entries(SECTION_TYPE_KEYWORDS)) {
    if (lower.includes(keyword)) return type;
  }
  return "general";
}

interface Section {
  title: string;
  content: string;
  sectionType: SectionType;
}

function splitIntoSections(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let currentTitle = "Document Start";
  let currentLines: string[] = [];

  for (const line of lines) {
    if (SECTION_BOUNDARY.test(line.trim()) && currentLines.length > 0) {
      sections.push({
        title: currentTitle,
        content: currentLines.join("\n").trim(),
        sectionType: inferSectionType(currentTitle),
      });
      currentTitle = line.trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentLines.join("\n").trim(),
      sectionType: inferSectionType(currentTitle),
    });
  }

  return sections.filter((s) => s.content.length > 0);
}

function chunkText(text: string, size: number, overlap: number): string[] {
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + size));
    start += size - overlap;
  }
  return chunks;
}

export interface ChunkOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  shortDocThreshold?: number;
}

export function chunkTenderDocument(
  text: string,
  tenderId: string,
  options?: ChunkOptions,
): TenderChunk[] {
  const size = options?.chunkSize ?? CHUNK_SIZE;
  const overlap = options?.chunkOverlap ?? CHUNK_OVERLAP;
  const threshold = options?.shortDocThreshold ?? SHORT_DOC_THRESHOLD;

  if (text.length < threshold) {
    return [
      {
        id: `${tenderId}-0`,
        content: text,
        metadata: {
          tenderId,
          sectionType: "general",
          sectionTitle: "Full Document",
          chunkIndex: 0,
        },
      },
    ];
  }

  const sections = splitIntoSections(text);
  const chunks: TenderChunk[] = [];
  let globalIndex = 0;

  for (const section of sections) {
    const textChunks = chunkText(section.content, size, overlap);
    for (const content of textChunks) {
      chunks.push({
        id: `${tenderId}-${globalIndex}`,
        content,
        metadata: {
          tenderId,
          sectionType: section.sectionType,
          sectionTitle: section.title,
          chunkIndex: globalIndex,
        },
      });
      globalIndex++;
    }
  }

  return chunks;
}
