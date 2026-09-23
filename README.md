# Signal Garden — prototype brief

## Product concept

Signal Garden helps a small product team turn a pile of customer comments into a reviewable set of recurring needs. The central promise is not “AI knows what to build”; it is “find the repeated signals, see the evidence, and decide what to investigate next.”

The prototype accepts one comment per line, groups comments by a transparent set of product-language patterns, surfaces evidence and friction cues, and drafts a small set of opportunity prompts. All analysis runs in the browser. No customer feedback is sent to a server.

## Intended user and job

- **User:** a product manager, researcher, or founder with unstructured feedback and no time to read it all at once.
- **Job:** “Help me see which problems recur, how much evidence supports them, and what product direction might be worth exploring.”
- **Non-goal:** make roadmap decisions, estimate market size, infer customer identity, or claim statistical significance.

## Workflow

1. Paste feedback or load the built-in sample.
2. Review the number of comments recognized and analyze.
3. Scan themes ordered by frequency; inspect each theme’s count, friction cues, and original comments.
4. Use opportunity prompts as hypotheses for research or product discovery.
5. Copy a concise summary for a team discussion.

## First-pass logic

The prototype normalizes text, matches whole words and phrases against a small product-area taxonomy, and allows a comment to match multiple themes. Theme counts are evidence counts, not unique-customer counts. Pain cues are simple lexical indicators and are intentionally described as “friction signals,” not reliable sentiment or severity judgments. Opportunity prompts are stable templates attached to observed pain-bearing themes. The interface makes these limits visible.

## Evaluation criteria

Use a small, human-labeled set of feedback comments and review each result against the original evidence.

| Criterion | How to evaluate | First iteration target |
|---|---|---|
| Theme precision | Of comments assigned to a theme, how many belong there on human review? | ≥ 80% on the seed set |
| Theme recall | Of comments humans assign to a taxonomy area, how many are found? | ≥ 70% on the seed set |
| Evidence traceability | Can a reviewer inspect a source comment for every surfaced theme? | 100% |
| Unsupported claims | Does an opportunity imply a fix or outcome absent from the comments? | 0 material unsupported claims |
| Usability | Can a first-time user get to evidence-backed themes without help? | Under 2 minutes |
| Privacy | Does feedback leave the browser in this prototype? | No |

These are prototype gates, not a claim that the initial rules already meet the targets. Track false positives and missed themes by taxonomy category before expanding the taxonomy.

## Iteration plan

1. **Prototype 01 — transparent baseline:** local keyword-and-phrase groups, source quotes, counts, friction cues, and template opportunities. Surface weak coverage and avoid overclaiming.
2. **Prototype 02 — better evidence handling:** support CSV headers, duplicate detection, optional source/date metadata, and examples for themes with little evidence. Add a human correction step.
3. **Prototype 03 — semantic assistance:** optionally use an LLM or embedding model to suggest clusters, while retaining source quotes, reviewer edits, privacy controls, and the same evaluation set. Compare against Prototype 01 before replacing any baseline behavior.
4. **Prototype 04 — team workflow:** save analyses, compare periods, and share reviewed themes. Only add trend claims once dated, deduplicated inputs support them.

## Run

Open `index.html` in a modern browser. The prototype uses no build step or backend. A network connection is only needed to load the optional Google Fonts; the app itself works with system font fallbacks and analyzes locally.
