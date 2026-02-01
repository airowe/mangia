# Ralph Wiggum Prompt Templates

Reusable prompts for the Ralph Wiggum iterative development loop, tailored to Mangia's CLAUDE.md guidelines.

## Quick Start

```bash
# Feature development
/ralph-loop "$(cat .claude/ralph-prompts/feature.md)" --max-iterations 15 --completion-promise "FEATURE COMPLETE"

# Bug fix
/ralph-loop "$(cat .claude/ralph-prompts/bugfix.md)" --max-iterations 10 --completion-promise "BUG FIXED"

# UI component
/ralph-loop "$(cat .claude/ralph-prompts/ui-component.md)" --max-iterations 12 --completion-promise "UI COMPLETE"

# Refactoring
/ralph-loop "$(cat .claude/ralph-prompts/refactor.md)" --max-iterations 10 --completion-promise "REFACTOR COMPLETE"

# Security-focused work
/ralph-loop "$(cat .claude/ralph-prompts/security.md)" --max-iterations 10 --completion-promise "SECURITY VERIFIED"
```

## Templates

| Template          | Use Case                    | Recommended Iterations |
| ----------------- | --------------------------- | ---------------------- |
| `feature.md`      | New features, API endpoints | 15-20                  |
| `bugfix.md`       | Bug fixes, regressions      | 8-10                   |
| `ui-component.md` | React Native components     | 12-15                  |
| `security.md`     | Security-sensitive changes  | 10-12                  |
| `refactor.md`     | Code refactoring            | 10-15                  |

## Workflow Phases

Each template follows these phases:

1. **QPLAN** - Analyze codebase, plan minimal changes
2. **TDD Cycle** - Stub -> Failing test -> Implement -> Green
3. **Quality Gates** - typecheck, lint
4. **Security Review** - OWASP checks, input validation
5. **Code Review** - Enhanced QCHECK (target >= 92)
6. **Commit** - Conventional Commits format (with user approval)

## Customization

Replace `[TASK]` placeholders in templates with your specific task description before running.

## Exit Conditions

Ralph loops exit when:

- All quality gates pass (0 errors)
- QCHECK score >= 92/100
- Security review passes
- The `<promise>` tag is output
