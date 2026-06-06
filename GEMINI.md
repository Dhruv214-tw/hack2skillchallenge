# Project Behavioral Guidelines
# Adapted from: https://github.com/multica-ai/andrej-karpathy-skills/blob/main/CLAUDE.md
# Original format: CLAUDE.md (Claude Code) → adapted for Antigravity (GEMINI.md)

These guidelines apply to every task in this project. They bias toward caution over speed.
For trivial tasks, use judgment — don't apply ceremony to a one-liner fix.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing anything:
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan before executing:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria allow independent looping. Weak criteria ("make it work") require constant clarification.

---

## Superpowers Skills (Antigravity)

This project includes the Superpowers skills library at `.agents/skills/superpowers/`.
Load the skills index before any non-trivial task:

@./.agents/skills/superpowers/skills/using-superpowers/SKILL.md
@./.agents/skills/superpowers/skills/using-superpowers/references/gemini-tools.md

### Skill → Task Mapping

| Task type | Skill to load first |
|---|---|
| New feature / component | `brainstorming` |
| Bug fix | `systematic-debugging` |
| Writing implementation plan | `writing-plans` |
| Executing a plan | `executing-plans` |
| Any implementation | `test-driven-development` |
| Code review request | `requesting-code-review` |
| Responding to review | `receiving-code-review` |
| Parallel / multi-agent work | `dispatching-parallel-agents` |
| Finishing a branch | `finishing-a-development-branch` |
| Before marking anything done | `verification-before-completion` |

To load a skill, use:
```
view_file .agents/skills/superpowers/skills/<skill-name>/SKILL.md
```

---

**These guidelines are working if:** diffs contain fewer unnecessary changes, rewrites due to overcomplication decrease, and clarifying questions come before implementation rather than after mistakes.

---

## 5. Hackathon Challenge & Submission Rules

**CRITICAL: Follow these rules strictly for every code change and implementation.**

### Hard Constraints
- **Repository Size Limit:** Must remain **under 10 MB**. Avoid committing large assets, massive dependencies, or generated files (keep `.gitignore` robust, e.g., node_modules, build outputs, media).
- **Submission Limit:** Maximum **3 submission attempts**. Verify everything rigorously before attempting a submission.

### Evaluation & Review Criteria
- **Smart, Dynamic Assistant:** Build intelligent, context-aware logic with dynamic decision-making.
- **Security:** Safe, responsible data handling, input validation, and secure execution.
- **Efficiency:** Optimize resource utilization.
- **Testing:** Validate logic and features thoroughly with automated tests.
- **Accessibility:** Use semantic elements and inclusive design.
- **Code Quality:** Highly structured, clean, readable, and maintainable.
- **Problem Statement Alignment:** Match the selected vertical precisely.

### Required Documentation (README.md)
The final `README.md` must clearly explain:
1. Chosen vertical
2. Approach and logic
3. How the solution works
4. Any assumptions made

