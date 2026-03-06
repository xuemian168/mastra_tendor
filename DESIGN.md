# Design Writeup

## What I Built

A multi-agent tender analysis system that reads bid documents and gives a Bid/No-Bid recommendation. The pipeline is: **ingest the document → two agents analyze in parallel (compliance + risk) → a third agent synthesizes a final strategy**.

The interesting part is the RAG layer I added between the document and the agents.

```
Document → [Ingest] → [Compliance ‖ Risk] → [Strategy] → Bid/No-Bid
                           ↑         ↑
                     Vector Store (RAG)
```

## Why These Decisions

**Why RAG instead of just passing the whole document?**

A 100-page tender is about 50K tokens. Without RAG, I'd send that to two agents = 100K tokens. With RAG, each agent gets only the ~20 chunks relevant to its job — about 16K tokens each. That's a 75% cost reduction. And for really long documents (200+ pages), full-text simply won't fit in the context window. RAG makes it work regardless of document length.

**Why did I build my own vector store?**

Honestly, for a project like this, spinning up Postgres or paying for Pinecone felt like overkill. My in-memory implementation is ~80 lines, has zero dependencies, and the interface matches MastraVector exactly — so swapping it out later is a one-line import change. Plus, writing cosine similarity by hand was a good way to show I understand what's happening under the hood, not just calling SDKs.

**Why section-aware chunking?**

Tender documents aren't random text — they have clear sections like "Penalty Clauses", "Technical Requirements", "SLA". A generic splitter would cut right through the middle of a section. My chunker detects these boundaries (markdown headings, numbered sections, keywords like "Section" or "Article") and tags each chunk with its section type. This lets the retriever filter by section — the compliance agent never sees penalty clauses, the risk agent never sees submission format requirements.

**Why do the two agents have different retrieval configs?**

Because they need different information. The compliance analyst cares about deadlines, certifications, and technical specs. The risk analyst cares about penalty clauses, SLA terms, and liability caps. Giving them the same chunks would defeat the purpose of having specialized agents. Each one has 4 tailored queries and a section type filter.

**Why skip RAG for short documents?**

I ran benchmarks and found that for documents under ~10 pages, RAG actually costs more than just passing the full text. The embedding API call alone takes longer than the token savings justify. So documents under 40K characters bypass the entire RAG pipeline — zero embedding calls, the full text goes straight to the agents. Above that threshold, RAG kicks in and the savings grow fast (75% at 100 pages, 87% at 200 pages).

**Why Flash for extraction, Pro for strategy?**

Extracting dates and clauses from text is pattern matching — Flash handles it perfectly well and it's ~10x cheaper. The strategy step needs actual reasoning: weighing conflicting signals, considering the company's strengths against the tender's requirements, making a judgment call. That's where Pro earns its cost.

## Benchmarks

- **Chunker**: 200-page document processes in 1.4ms
- **Vector queries**: 16ms for 100 vectors, 82ms for 500 vectors
- **Token savings**: 75% at 100 pages, 87% at 200 pages, 0% overhead for short docs
- **Tests**: 59 tests across 9 files, all passing in ~900ms

## What I'd Do with More Time

The biggest gap is **hybrid search**. Right now retrieval is pure vector similarity, but some things are better found by exact keywords — like "ISO 27001" or specific clause numbers. Combining BM25 with vector search using reciprocal rank fusion would catch both cases.

I'd also add **adaptive retrieval** — currently each agent always retrieves ~20 chunks regardless of document size. Smarter would be to adjust based on document length and score distribution.

**Streaming** would improve UX a lot. Right now the user waits for everything to finish. Surfacing compliance findings as they come in would feel much more responsive.

And obviously for production, the in-memory vector store would need to become **persistent** (pgvector or similar). The interface is ready for that swap — it's just a matter of changing the import.

Finally, I'd want an **evaluation framework** — a set of annotated tender documents where I can measure retrieval precision/recall and decision accuracy, so I can tune chunk sizes and thresholds with data instead of guesswork.
