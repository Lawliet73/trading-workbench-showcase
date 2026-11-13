# Public tutor evaluation

Ten scenarios / twelve turns cover arithmetic and multiple testing, architecture/status, cross-component reasoning, research interpretation, ambiguity, three-turn follow-ups, German explanations, unrelated requests, and two held-out questions. `cases.json` contains the questions and review rubric; `comparison.json` preserves baseline and selected-system answers, sources, latency and measured usage. No visitor conversations are stored.

## Findings

- Baseline: Llama 3.1 8B, substring retrieval, 1,800-character chunks, 8KB context, one prior turn, rigid headings, 512 output tokens. It drifted from the user's twenty candidates to its own two-strategy example, gave a repetitive bootstrap explanation, and attached irrelevant project sources to general theory.
- Complete passages, explicit forward/reverse dependencies, BM25-style ranking, graph-neighbor expansion and up to four retained turns improved context independently of model changes (original-model ablation saved locally).
- Qwen3 30B improved breadth but invented “Discard Sharpe Ratio”, mishandled a delisting example and answered the unrelated story request in the single-stage screen. GPT-OSS 120B was verbose, sometimes truncated, invented citation formatting and expanded DSR incorrectly. Neither was selected.
- Llama 3.3 70B FP8 Fast produced clearer, shorter answers and better status distinctions. It retained the twenty-candidate conversation, explained why blocks preserve serial dependence, answered both held-out questions, and redirected unrelated requests. The stronger model also handles intent/query rewriting; the small-model router had prematurely refused valid follow-ups.
- General theory can bypass website retrieval; project answers use numbered evidence and only cited source links. No mandatory headings. Ambiguity is allowed through for clarification. One cross-component answer still describes survivorship less clearly than the source lesson; explanations remain fallible. This small manual comparison is evidence of improvement, not proof of universal correctness.
- Final semantic knowledge version: `242af2fb137deb5b`. A subsequent build-time search-index optimization preserves evidence text/ranking (regression checked), with approximately 25ms → 4ms local retrieval time. Minute-aligned cache preserves automatic website updates.

## Reproduce (opt-in live calls)

Set `WRANGLER_BIN` to the installed Wrangler JS entry and `CLOUDFLARE_ACCOUNT_ID` to the authorized account. Run from repository root:

```
node --test test/tutor.test.mjs
node eval/run.mjs baseline
node eval/run.mjs improved @cf/meta/llama-3.3-70b-instruct-fp8-fast
```

Each invocation permits at most 24 inference calls. Results are saved after each answer under ignored `eval/results/`, keyed by code/model/knowledge version; matching successful requests are reused. Credentials are obtained through Wrangler in memory and never written to results. Baseline code comes from commit `8c45f5b`. Evaluation is not run by CI; normal Pages builds run eleven offline tests. Provider load affects latency; the stronger model can take tens of seconds. Production remains on Workers Free with 25 global / 10 client requests per UTC day, a 1,000-token answer ceiling and no paid fallback. The account-wide free allowance may stop requests earlier.
