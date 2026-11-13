# Trading Workbench – framework map

**Live site:** https://lawliet73.github.io/trading-workbench-showcase/

Trading Workbench is a personal side project and an ongoing learning exercise. I use it to explore quantitative trading, systematic strategy research and software engineering. This repository holds a public snapshot of the project's interactive **framework map**. The code and research notes are in a separate private repository.

Nothing here is investment advice. No strategy in this project has shown that it makes money.

## What the project explores

The main question is how to test a trading idea honestly, and how to tell a real effect from luck, overfitting or look-ahead bias. Trading is the subject. Much of the work is the engineering around it: reproducible data, tracking every experiment, statistical checks, and safety rules for anything that might one day place orders.

## Why I started it

I wanted to learn how systematic trading research is done by building the tools myself, rather than by reading about it or relying on backtest numbers I couldn't check. Writing the system forces each assumption to be stated, tested and recorded.

## Approach

- **Ideas are hypotheses.** Every idea starts in a research registry, with a reason it might work and the evidence that would count against it.
- **Each backtest is recorded.** Every parameter combination tried is counted, so later statistics can account for how much searching took place.
- **Evidence comes in stages.** An exact re-run and look-ahead checks, walk-forward testing, stress tests, then statistics that correct for multiple testing: the probabilistic and deflated Sharpe ratio, and the probability of backtest overfitting. Last comes a single "holdout" look at untouched data.
- **Implemented, validated and approved are separate claims.** Code that exists is not evidence that a strategy works. A strategy that passes the tests still needs an explicit decision before paper trading.
- **Paper trading only.** The planned execution path uses a broker's paper-trading account. Real-money trading is not part of the plan.

## How the parts fit together

The map groups about 120 components under ten questions in three parts:

- **Foundation:** scope, market data, records and infrastructure.
- **Research lifecycle:** ideas → backtests → validation evidence → a decision about paper trading.
- **Operational lifecycle:** the daily path from approved strategies through a risk gate to paper orders, reconciliation and monitoring.

Five diagrams show the system from different angles: functional architecture, the daily decision workflow, information flow, the research lifecycle, and a proposed structure.

## What is implemented

Built and tested in the private repository:

- local infrastructure: a database with migrations, a job queue and worker, logging, backups with a tested restore, a dashboard and a command-line tool
- versioned historical price data with availability times, so a backtest only uses data it could have had at the time
- a backtest adapter, parameter sweeps and a registry of every trial
- the validation tools listed under Approach (Phase 2; that work is still being reviewed)
- one simple example strategy (a moving-average crossover with a trend filter), used to exercise the pipeline. It **did not** pass the deflated-Sharpe test.

## What is still exploratory or planned

- **Planned, not built:** the daily trading pipeline, the risk gate, the paper-broker connection, order reconciliation, monitoring, and comparing a current strategy against challengers.
- **Research candidates:** about 40 ideas from the literature, such as momentum, earnings drift and insider purchases. None has been tested here, and listing them does not mean they work.
- **Proposed or unresolved:** architecture changes that are still under discussion, and open design decisions. The map marks these separately.

Every component on the site has a status: Implemented, Planned, Proposed, Research candidate, Rejected, or Unresolved. Each one also has an explanation in plain language.

## About this repository

- The site is a static export. It needs no backend and no installation, and it works on desktop and mobile.
- It is a **snapshot** I publish by hand. It doesn't update with changes to the private project. The date of the evidence is shown at the top of the page.
- Source references in the map name the private documents but don't link to them.
- The diagrams were made with [Archify](https://github.com/tt-a1i/archify). The map's content was put together with AI assistance (Claude and Codex), from the project's own records.

## Research companion

The public English/German tutor explains this website's components, diagrams, relationships and quantitative research concepts. Project-specific claims come only from published site content; general explanations are labelled separately. No private repository access is available.

Every Pages build generates `knowledge.json` from the site's existing component data, lessons, glossary, diagram labels and guides. The Worker retrieves that public file directly with a 60-second cache. There is no separate knowledge database, sync credential or per-finding approval list. New educational content becomes available after its normal website deployment and cache refresh.

Cloudflare Workers AI uses Llama 3.1 8B FP8 Fast. Existing D1 is used only for atomic daily usage limits (60 total / 10 per client). Keep the account on Workers Free; no paid fallback is configured. Answers may be wrong; check the linked website sources. Model instructions redirect unrelated topics but are not an absolute topic-security boundary.

To preview the derived content: `node scripts/build-knowledge.mjs .`. The generated file is deployed with the site, not maintained by hand. To deploy the Worker: `npx wrangler deploy --config assistant-worker/wrangler.jsonc`. Credentials stay in Wrangler's credential store, never in site files. Disable inference by setting `ENABLED` to `false` in that configuration and redeploying.
