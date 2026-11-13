# Codex instructions — public Trading Workbench

This repository is the public website. Preserve its public-only content boundary and existing tutor endpoint; never copy private documents or credentials here.

## Git and verification
- Develop substantial milestones on a feature branch, commit verified work incrementally, and open a PR against main. Merge only with explicit user approval for that change.
- Use the PR as the durable implementation/review record; do not add a second project log. Check the existing Pages build and tutor tests when relevant. For interface changes, visually check desktop and mobile, including navigation, diagrams and assistant.

## Checkpoint and resume workflow

These instructions apply automatically to every Codex session in this repository.

- Small, single-step tasks need no checkpoint. Split substantial work into independently verifiable milestones; verify and commit completed milestones using the existing branch/PR policy. Never label unfinished work complete or merge without the required approval.
- Keep one temporary root `.checkpoint.md` (about 40 lines maximum). Overwrite it at significant milestones, before expensive operations, and before context/usage limits or handoff when possible. Do not rely on getting a final turn before an interruption.
- Use sections **Objective**, **Progress**, **Done and verified**, **Unfinished / known issues**, **Relevant files and outputs**, **Exact next action**. Include the last completed milestone and commit, branch/PR, checks actually run, remaining work, blockers, output locations and the exact next command/action. Reference the existing project log rather than duplicating it; do not create separate handoff reports.
- For computations, save completed batches and results incrementally in the established output location, with enough input/configuration/version information to identify valid results. Resume missing or failed batches; do not repeat successful work unless inputs changed or verification found a problem. Never commit sensitive data, credentials or large generated results.
- At the start of a resumed session, read `.checkpoint.md`, `git status`, relevant `git diff`, recent commits and referenced saved outputs before running work. Continue from the last verified milestone. Treat interrupted commands as unverified until their outputs and process state are checked.
- Preserve unrelated staged, unstaged and untracked work. Stage only task-owned changes; never reset, overwrite or discard existing work. Follow existing branch and approval policies. If an older checkpoint contains unrelated unfinished work, preserve that concise handoff until resolved.
- Record durable decisions and verified implementation in the established project log or PR record. Remove the temporary checkpoint when its work is complete; retain any unrelated unfinished handoff. Prefer built-in session resume over custom recovery infrastructure.
