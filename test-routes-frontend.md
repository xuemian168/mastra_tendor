# Frontend Route Testing Prompts

> Open http://localhost:3000 (frontend) with Mastra running on http://localhost:4111
> The frontend now directly connects to Mastra via `chatRoute` — no API proxy
> Paste each section's content into the chat, or use file upload for document tests

---

## Test 0: General Conversation (no tools, flexibility check)

**Expected:** Direct text response, NO tool calls. Verifies the assistant can hold open-ended conversation without forcing document analysis.

**Paste this:**

What are the key differences between fixed-price and time-and-materials contracts? Which is better for software projects?

---

## Test 1: Open-Ended Goal (decompose-goal route)

**Expected tool cards:** Document Ingestion → Goal Decomposition (numbered sub-tasks) → Document Analysis xN (findings with importance badges)

**Paste this:**

Please thoroughly evaluate the following software license agreement. I want a comprehensive analysis covering all important aspects.

SOFTWARE LICENSE AGREEMENT

This Software License Agreement (the "Agreement") is entered into as of March 1, 2026 between TechCorp Pty Ltd (ABN 12 345 678 901) ("Licensor") and DataFlow Solutions Ltd (ABN 98 765 432 109) ("Licensee").

1. GRANT OF LICENSE
Licensor grants Licensee a non-exclusive, non-transferable license to use the CloudAnalytics Platform (the "Software") for internal business purposes. The license covers up to 500 named users across 3 geographic regions (APAC, EMEA, Americas). Licensee may not sublicense, modify, or reverse-engineer the Software.

2. TERM AND RENEWAL
Initial term: 3 years from the Effective Date. Auto-renewal for successive 1-year periods unless either party gives 90 days written notice. Early termination fee: 50% of remaining contract value.

3. FEES AND PAYMENT
Annual license fee: AUD 850,000 (Year 1), AUD 935,000 (Year 2), AUD 1,028,500 (Year 3), representing 10% annual escalation. Implementation fee: AUD 200,000 (one-time). Payment terms: Net 30 days. Late payment interest: 1.5% per month compounded.

4. SERVICE LEVELS
Availability: 99.9% uptime measured monthly. Support response times: P1 (Critical) within 1 hour, P2 (High) within 4 hours, P3 (Medium) within 8 hours. Service credits: 5% of monthly fee per 0.1% below availability target, capped at 25%.

5. DATA PROTECTION
Licensor shall process Licensee data in compliance with the Privacy Act 1988 (Cth) and Australian Privacy Principles. Data stored exclusively within Australian data centres. Licensor shall notify Licensee of any data breach within 24 hours. Upon termination, Licensor shall return or destroy all Licensee data within 30 days.

6. INTELLECTUAL PROPERTY
All IP in the Software remains with Licensor. Any customisations developed for Licensee shall be jointly owned. Licensor grants Licensee a perpetual license to use customisations even after termination.

7. LIABILITY AND INDEMNIFICATION
Licensor liability capped at 12 months of fees paid. Exclusion of consequential, indirect, and punitive damages. Licensor indemnifies Licensee against third-party IP infringement claims. Neither party liable for force majeure events exceeding 60 days.

8. TERMINATION
Either party may terminate for material breach with 30 days cure period. Licensor may suspend access for non-payment exceeding 45 days. Upon termination: data return within 30 days, transition assistance for up to 90 days at standard rates.

9. GOVERNING LAW
Governed by the laws of New South Wales, Australia. Disputes resolved via mediation then arbitration under ACICA Rules.

10. INSURANCE
Licensor shall maintain: Professional Indemnity AUD 10M, Public Liability AUD 10M, Cyber Liability AUD 5M.

---

## Test 2: Narrow Goal (direct analyze-document route, skip decompose)

**Expected tool cards:** Document Ingestion → Document Analysis (x1, findings focused on financial terms)

**Paste this:**

Identify the financial terms and payment obligations in the following contract.

SOFTWARE LICENSE AGREEMENT

This Software License Agreement (the "Agreement") is entered into as of March 1, 2026 between TechCorp Pty Ltd (ABN 12 345 678 901) ("Licensor") and DataFlow Solutions Ltd (ABN 98 765 432 109) ("Licensee").

1. GRANT OF LICENSE
Licensor grants Licensee a non-exclusive, non-transferable license to use the CloudAnalytics Platform for internal business purposes. Up to 500 named users across 3 regions.

2. TERM AND RENEWAL
Initial term: 3 years. Auto-renewal for 1-year periods unless 90 days written notice. Early termination fee: 50% of remaining contract value.

3. FEES AND PAYMENT
Annual license fee: AUD 850,000 (Year 1), AUD 935,000 (Year 2), AUD 1,028,500 (Year 3), representing 10% annual escalation. Implementation fee: AUD 200,000 (one-time). Payment terms: Net 30 days. Late payment interest: 1.5% per month compounded.

4. SERVICE LEVELS
Availability: 99.9% uptime. Service credits: 5% of monthly fee per 0.1% below target, capped at 25%.

5. LIABILITY
Licensor liability capped at 12 months of fees paid. Exclusion of consequential damages.

6. TERMINATION
Material breach with 30 days cure. Suspension for non-payment exceeding 45 days.

---

## Test 3: Tender Bid/No-Bid (specialized tender tools)

**Expected tool cards:** Document Ingestion → Compliance Analysis + Risk Assessment → Strategy Recommendation (prominent decision card)

**Paste this:**

Please analyze this tender document and give me a bid/no-bid recommendation.

Our company: Small Australian IT firm, 50 employees, ISO 27001 certified, IRAP PROTECTED assessment, 5 years government experience, expertise in Kubernetes and AWS. No prior analytics platform projects of this scale.

INVITATION TO TENDER

Tender Reference: GOV-2026-IT-0512
Title: Enterprise Data Analytics Platform
Issuing Agency: Department of Finance
Closing Date: 30 April 2026

1. SCOPE
The Department seeks proposals for an enterprise data analytics platform capable of processing 10TB+ daily data ingestion from 50+ source systems. Must include real-time dashboards, ML model deployment pipeline, and natural language query interface.

2. MANDATORY REQUIREMENTS
a) ISO 27001 certification
b) Minimum 3 years experience delivering analytics platforms for Australian Government
c) IRAP assessment at PROTECTED level
d) Demonstrated Kubernetes and cloud-native deployment expertise
e) Minimum 2 reference sites processing similar data volumes

3. TIMELINE
- Tender Close: 30 April 2026
- Evaluation: May 2026
- Contract Award: 1 July 2026
- Platform Delivery: 31 December 2026

4. BUDGET
Estimated value: AUD 8-12 million over 3 years.

5. EVALUATION CRITERIA
- Technical capability (40%)
- Past performance (25%)
- Value for money (20%)
- Implementation plan (15%)

6. PENALTIES
- Late delivery: AUD 10,000 per business day
- SLA breach (availability below 99.95%): 3% monthly fee rebate per 0.01% below target
- Cumulative LD cap: 10% of contract value

---

## Test 4: Document Summary (summarize-document route)

**Expected tool cards:** Document Ingestion → Document Summary (title + key points + collapsible sections)

**Paste this:**

Give me a quick summary of the following document.

SOFTWARE LICENSE AGREEMENT

This Software License Agreement (the "Agreement") is entered into as of March 1, 2026 between TechCorp Pty Ltd (ABN 12 345 678 901) ("Licensor") and DataFlow Solutions Ltd (ABN 98 765 432 109) ("Licensee").

1. GRANT OF LICENSE
Licensor grants Licensee a non-exclusive, non-transferable license to use the CloudAnalytics Platform for internal business purposes. Up to 500 named users across 3 geographic regions (APAC, EMEA, Americas).

2. TERM AND RENEWAL
Initial term: 3 years. Auto-renewal for 1-year periods unless 90 days written notice. Early termination fee: 50% of remaining contract value.

3. FEES AND PAYMENT
Annual license fee: AUD 850,000 (Year 1), AUD 935,000 (Year 2), AUD 1,028,500 (Year 3), 10% annual escalation. Implementation fee: AUD 200,000. Net 30 days. Late interest: 1.5% per month.

4. SERVICE LEVELS
99.9% availability. P1 response within 1 hour, P2 within 4 hours. Service credits: 5% per 0.1% below target, capped at 25%.

5. DATA PROTECTION
Privacy Act 1988 compliance. Australian data centres only. Breach notification within 24 hours. Data return/destruction within 30 days of termination.

6. INTELLECTUAL PROPERTY
Software IP remains with Licensor. Customisations jointly owned. Perpetual license for customisations post-termination.

7. LIABILITY
Capped at 12 months fees. No consequential damages. IP indemnification. Force majeure up to 60 days.

8. TERMINATION
Material breach with 30 days cure. Non-payment suspension after 45 days. 90-day transition assistance.

9. GOVERNING LAW
New South Wales, Australia. Mediation then ACICA arbitration.

10. INSURANCE
PI AUD 10M, PL AUD 10M, Cyber AUD 5M.

---

## Rendering Checklist

After each test, verify:

- [ ] **Test 0**: No tool calls, direct conversational response
- [ ] **ingest-document**: Shows document name + chunk count (chunkCount > 0 if RAG triggered)
- [ ] **decompose-goal** (Test 1 only): Shows numbered sub-tasks with goals and rationale
- [ ] **analyze-document** (Tests 1 & 2): Shows analysis type + findings with colored importance badges (low/medium/high/critical) + recommendations
- [ ] **summarize-document** (Test 4 only): Shows title + overview + key points + collapsible sections
- [ ] **analyze-compliance** (Test 3 only): Shows summary + 4-grid (specs/deadlines/requirements/qualifications)
- [ ] **assess-risk** (Test 3 only): Shows risk level badge + difficulty badges + lists
- [ ] **recommend-strategy** (Test 3 only): Prominent card with BID/NO-BID decision, confidence score, strengths/weaknesses
- [ ] All completed tool cards are expandable with structured content
- [ ] Running tool cards show spinner animation
- [ ] ActionBar visible on assistant messages (Copy, Refresh, Export as Markdown)
- [ ] Company profile button in header works, profile injected as system prompt
- [ ] File upload (.pdf, .docx, .txt) shows file tag, sends document text on submit
