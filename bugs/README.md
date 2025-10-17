# Bug Tracking

**CONFIDENTIAL - Internal Use Only**

This directory tracks bugs, issues, and their resolutions during WebinarWins MVP development.

## Directory Structure

```
bugs/
├── README.md          # This file
├── active/            # Current bugs being investigated or fixed
├── resolved/          # Fixed bugs with solutions documented
└── known-issues.md    # Known limitations and workarounds
```

## Bug Documentation Template

When documenting a bug, create a file in `active/` with this format:

```markdown
# Bug: [Short Description]

**Date Reported:** YYYY-MM-DD
**Reporter:** [Name]
**Severity:** Critical | High | Medium | Low
**Component:** Frontend | Backend | Database | Integration

## Description

Clear description of the bug and its impact.

## Steps to Reproduce

1. Step 1
2. Step 2
3. Step 3

## Expected Behavior

What should happen.

## Actual Behavior

What actually happens.

## Environment

- OS: [e.g., macOS 14.0]
- Browser: [if applicable]
- Python version: [if backend]
- Node version: [if frontend]

## Error Messages/Logs

```
Paste relevant error messages or logs here
```

## Possible Cause

Initial hypothesis about the cause.

## Solution

[To be filled when bug is fixed]

## Files Changed

- `path/to/file1.py`
- `path/to/file2.jsx`

## Testing

How the fix was tested and verified.
```

## Workflow

1. **New Bug Discovered:**
   - Create file in `active/` using template above
   - Name format: `YYYY-MM-DD-short-description.md`

2. **Bug Fixed:**
   - Update the bug file with solution details
   - Move file from `active/` to `resolved/`
   - Add entry to `known-issues.md` if it represents a limitation

3. **Known Issues:**
   - Document in `known-issues.md`
   - Include workarounds for users

## Severity Levels

- **Critical:** Application crashes, data loss, security vulnerability
- **High:** Major feature broken, significant UX degradation
- **Medium:** Feature works but with issues, minor UX problems
- **Low:** Cosmetic issues, minor inconveniences

## Bug Prevention

- Write unit tests for all new functionality
- Test edge cases (empty data, large files, invalid inputs)
- Review PRD requirements before marking complete
- Manual testing checklist before each phase completion

## Contact

For bug reports or questions:
- Team Slack channel: #webinarwins-dev
- Email: dev@webinarwins.com

