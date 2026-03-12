# Evaluation Report

> Evaluation of Tender Analysis System (v1 dataset, 10 test cases, Gemini 2.5 Flash/Pro)

## Dataset

**Version:** v1 (10 test cases)

| Case ID | Category | Description |
|---------|----------|-------------|
| tender-001 | tender-bid-nobid | Home Affairs border management tender (AUD $45-65M) — No-Bid (qualifications gap) |
| tender-002 | tender-bid-nobid | Department of Finance analytics platform (AUD $8-12M) — No-Bid (scale mismatch) |
| tender-003 | tender-bid-nobid | Health EHR integration (AUD $120-180M) — No-Bid (no healthcare experience) |
| tender-004 | tender-bid-nobid | Website redesign (AUD $80-120K) — Conditional Bid (tight timeline) |
| tender-005 | tender-bid-nobid | Digital transformation EOI — Conditional Bid (vague scope/budget) |
| analysis-001 | general-analysis | Software license agreement — comprehensive analysis |
| analysis-002 | general-analysis | IoT SmartGrid controller — technical spec analysis |
| analysis-003 | general-analysis | ARENA annual report — long document (>5000 chars, RAG path) |
| summary-001 | document-summary | Software license agreement — structured summary |
| summary-002 | document-summary | Cybersecurity incident response plan — multi-chapter summary |

### Coverage by Category

| Category | Cases | Edge Cases |
|----------|-------|------------|
| tender-bid-nobid | 5 | Qualification mismatch, short doc, vague/incomplete doc |
| general-analysis | 3 | Technical spec, long document (RAG path) |
| document-summary | 2 | Multi-chapter complex report |

## Baseline Results

**Run:** 2026-03-11 | **Pass rate:** 10/10 (100%) | **Total tokens:** 56,932 | **Total duration:** 214.6s

### Per-Case Scores

| Metric | tender-001 | tender-002 | tender-003 | tender-004 | tender-005 | analysis-001 | analysis-002 | analysis-003 | summary-001 | summary-002 |
|--------|-----------|-----------|-----------|-----------|-----------|-------------|-------------|-------------|-------------|-------------|
| decisionMatch | 1.000 | 1.000 | 1.000 | 1.000 | 1.000 | - | - | - | - | - |
| confidenceInRange | 1.000 | 0.000 | 1.000 | 1.000 | 1.000 | - | - | - | - | - |
| strengthCoverage | 1.000 | 1.000 | 0.000 | 1.000 | 1.000 | - | - | - | - | - |
| weaknessCoverage | 1.000 | 0.500 | 1.000 | 1.000 | 1.000 | - | - | - | - | - |
| riskLevelMatch | 1.000 | 1.000 | 1.000 | 1.000 | 0.500 | - | - | - | - | - |
| deadlineCount | 1.000 | 1.000 | 1.000 | 1.000 | - | - | - | - | - | - |
| mandatoryRequirementsCoverage | 1.000 | 1.000 | 1.000 | - | - | - | - | - | - | - |
| topicCoverage | - | - | - | - | - | 1.000 | 0.800 | 0.800 | 1.000 | 1.000 |
| findingsCount | - | - | - | - | - | 1.000 | 1.000 | 1.000 | - | - |
| keyPointsCount | - | - | - | - | - | - | - | - | 1.000 | 1.000 |

### Average Scores

| Metric | Score | Notes |
|--------|-------|-------|
| decisionMatch | 1.000 | All 5 tender cases got correct decision |
| mandatoryRequirementsCoverage | 1.000 | Fuzzy matching + improved prompt fixed from 0.4 baseline |
| deadlineCount | 1.000 | Consistent deadline extraction |
| findingsCount | 1.000 | Always meets minimum findings threshold |
| keyPointsCount | 1.000 | Always meets minimum key points threshold |
| topicCoverage | 0.920 | Analysis-002/003 miss some topics (0.8 each) |
| riskLevelMatch | 0.900 | tender-005 gets adjacent risk level (0.5) |
| weaknessCoverage | 0.900 | tender-002 partially matches weaknesses |
| confidenceInRange | 0.800 | tender-002 confidence outside expected range |
| strengthCoverage | 0.800 | tender-003 has weak strength mentions for startup |

### Token Usage & Latency

| Case | Tokens | Duration | Tokens/s |
|------|--------|----------|----------|
| tender-001 | 12,536 | 42.0s | 298 |
| tender-002 | 6,402 | 27.5s | 233 |
| tender-003 | 9,581 | 31.8s | 301 |
| tender-004 | 5,845 | 30.0s | 195 |
| tender-005 | 5,655 | 28.9s | 196 |
| analysis-001 | 2,344 | 7.7s | 304 |
| analysis-002 | 3,623 | 15.5s | 234 |
| analysis-003 | 6,322 | 15.6s | 405 |
| summary-001 | 2,111 | 8.0s | 264 |
| summary-002 | 2,513 | 7.7s | 326 |

**Patterns:**
- Tender bid/no-bid cases: 3-4 tool calls, ~30s avg, highest token usage
- General analysis: 2 tool calls, ~13s avg
- Document summary: 2 tool calls, ~8s avg
- Long documents (analysis-003, >5000 chars) trigger RAG path with higher token usage

## Metrics Explanation

### Tender Bid/No-Bid Metrics

| Metric | Description | Matching Method |
|--------|-------------|-----------------|
| `decisionMatch` | Does the decision (bid/no_bid/conditional_bid) exactly match expected? | Exact enum match |
| `confidenceInRange` | Is the confidence score within the expected [min, max] range? | Numeric range check |
| `strengthCoverage` | What fraction of expected strength keywords appear in the output? | Case-insensitive substring match |
| `weaknessCoverage` | What fraction of expected weakness keywords appear in the output? | Case-insensitive substring match |
| `riskLevelMatch` | Does the risk level match? Adjacent levels score 0.5. | Ordinal distance (low < medium < high < critical) |
| `deadlineCount` | Are there at least N deadlines extracted? | Count threshold |
| `mandatoryRequirementsCoverage` | What fraction of expected mandatory requirements are mentioned? | Fuzzy keyword match (60% word overlap) |

### General Analysis Metrics

| Metric | Description |
|--------|-------------|
| `topicCoverage` | Fraction of expected topics found in key findings + summary |
| `findingsCount` | Are there at least N key findings? |

### Document Summary Metrics

| Metric | Description |
|--------|-------------|
| `keyPointsCount` | Are there at least N key points? |
| `topicCoverage` | Fraction of expected topics found in key points + sections + overview |

**Pass threshold:** A case passes if its average score across all metrics >= 0.6.

## What Changed from Initial Baseline

| Change | Before | After | Impact |
|--------|--------|-------|--------|
| mandatoryRequirementsCoverage | 0.333-0.500 | 1.000 | Compliance agent prompt now explicitly targets bidder qualifications; evaluator uses fuzzy keyword matching (60% word overlap) |
| Dataset size | 4 cases | 10 cases | Added edge cases: qualification mismatch, short doc, vague doc, technical spec, long doc, multi-chapter |
| Eval result metadata | No git hash | Git commit hash included | Results are traceable to exact code version |
| Comparator | File paths only | Supports `latest`/`previous` shorthand | Easier to compare runs |
| Tool observability | No execution stages | Real-time `data-tool-stage` via `context.writer` | Frontend renders step-by-step execution progress during tool execution |
| Reproducibility | Default temperature (1.0) | `temperature: 0` on all analysis agents | Deterministic outputs for consistent eval results |

## Known Limitations

1. **Residual variance** — Even with `temperature: 0`, Gemini may produce slightly different outputs across API versions. Expected values are calibrated from multiple runs.
2. **Fuzzy matching tradeoffs** — `fuzzyKeywordMatch` (60% word overlap) can produce false positives for short keywords. Pure keyword matching cannot detect paraphrased mentions.
3. **No semantic similarity** — Coverage metrics use keyword/substring matching, not embedding-based similarity. "insufficient budget history" won't match "$20M threshold".
4. **Variance in tender-002/003** — Confidence scores and weakness mentions fluctuate between runs. These cases may occasionally fail on `confidenceInRange` or `weaknessCoverage`.
5. **Topic coverage ceiling** — analysis-002/003 consistently score 0.8 on topicCoverage, suggesting some expected topics are worded differently than the LLM's output categories.

## Tuning Suggestions

| Issue | Potential Fix | Expected Impact |
|-------|--------------|-----------------|
| topicCoverage at 0.8 for analysis cases | Use fuzzy matching for topic coverage or broaden expected topic keywords | +0.1-0.2 improvement |
| Confidence variance | Widen confidence ranges or add multiple acceptable ranges | Reduce flakiness |
| strengthCoverage for tender-003 | The startup has very few genuine strengths — may need to accept 0 or adjust expected keywords | Reflects reality |
| Token efficiency | Reduce RAG chunk size for medium documents | 10-15% token reduction |
| Semantic matching | Add embedding-based similarity as fallback when keyword match fails | Better recall on paraphrased mentions |
| Multi-run stability | Run each case 3x and use median scores for baseline | More robust expected values |

## How to Use

```bash
# Show help
npm run eval -- --help

# Run full evaluation
npm run eval

# Run single case
npm run eval -- --case tender-001

# Run by tag
npm run eval -- --filter regression

# Compare two runs
npm run eval:compare latest previous

# Compare specific files
npm run eval:compare src/eval/results/run1.json src/eval/results/run2.json
```

Results are saved to `src/eval/results/` with git commit hash and tracked in git for historical comparison.

## How to Extend

### Adding a New Test Case

1. Open `src/eval/datasets/v1/dataset.json`
2. Add a new object to the `cases` array:

```json
{
  "id": "tender-006",
  "category": "tender-bid-nobid",
  "input": {
    "documentText": "Full document text here...",
    "documentTitle": "Document Title",
    "companyProfile": "Optional company context"
  },
  "expected": {
    "decision": "bid",
    "confidenceRange": { "min": 60, "max": 85 },
    "mustMentionStrengths": ["keyword1", "keyword2"],
    "mustMentionWeaknesses": ["keyword3"],
    "expectedRiskLevel": "medium",
    "expectedDeadlineCount": { "min": 2 },
    "expectedMandatoryRequirements": ["requirement phrase"]
  },
  "tags": ["core"]
}
```

3. `category` must be one of: `tender-bid-nobid`, `general-analysis`, `document-summary`
4. `expected` fields vary by category — see the **Expected Fields by Category** table below
5. Run `npm run eval -- --case tender-006` to test the new case in isolation

### Expected Fields by Category

| Field | tender-bid-nobid | general-analysis | document-summary |
|-------|:---:|:---:|:---:|
| `decision` (bid/no_bid/conditional_bid) | required | — | — |
| `confidenceRange` ({ min, max }) | optional | — | — |
| `mustMentionStrengths` (string[]) | optional | — | — |
| `mustMentionWeaknesses` (string[]) | optional | — | — |
| `expectedRiskLevel` (low/medium/high/critical) | optional | — | — |
| `expectedDeadlineCount` ({ min }) | optional | — | — |
| `expectedMandatoryRequirements` (string[]) | optional | — | — |
| `mustCoverTopics` (string[]) | — | optional | optional |
| `minKeyFindings` (number) | — | optional | — |
| `minKeyPoints` (number) | — | — | optional |

For `general-analysis` cases, the `input` also requires an `analysisGoal` field.

### Creating a New Dataset Version (v2)

1. Create `src/eval/datasets/v2/` directory
2. Copy `v1/dataset.json` as a starting point
3. Update the `version` and `description` fields
4. Add, modify, or remove cases as needed
5. Run with: `npm run eval -- --dataset v2`

Dataset versions are independent — v1 results are not compared against v2 results. Use a new version when:
- The schema of `expected` changes (new metrics added)
- Test cases are fundamentally restructured
- You want a clean baseline for a new evaluation round

### Adding a New Evaluation Metric

1. **Schema**: Add the field to `src/eval/schemas/eval-dataset.schema.ts` in the `expected` object
2. **Evaluator**: Add scoring logic in `src/eval/evaluator.ts` in the appropriate `evaluate*` function
3. **Dataset**: Add the expected value to relevant test cases
4. **Docs**: Update the metrics tables in this document
