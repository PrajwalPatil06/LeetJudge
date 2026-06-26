# General Coding Guidelines

1. **Readability over cleverness**: Code should be readable and clear. Do not write one-liners just to be cool. If it takes more than one line but is more clear and readable, do that.
2. **Commenting**: If a chunk of code needs explanation or its role isn't immediately obvious, add comments using "//" and simple English text (no emojis or fancy decorations).
3. **Architecture and Design**: Follow SOLID principles as much as possible and use design patterns as needed. Mention the design patterns used in the comments.
4. **Function creation**: Be intelligent about the decision to add a new function. Add one if it makes the code better.
5. **Testing**: Add relevant tests alongside the code.

# Agent Behavioral Guidelines

## 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
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
- If you notice unrelated dead code, mention it - don't delete it.
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
For multi-step tasks, state a brief plan:
`1. [Step] → verify: [check]`
`2. [Step] → verify: [check]`
`3. [Step] → verify: [check]`
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
