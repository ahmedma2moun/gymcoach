---
description: "Audit and clean up project documentation — remove stale files, consolidate scattered docs"
allowed-tools: ["Bash", "Read", "Write"]
---
# Documentation Cleanup

Audit all documentation in this project and clean up stale/orphan files.

## Scope

Target: $ARGUMENTS (default: all docs/, and root .md files)

## Procedure

1. **Inventory**: List all .md files with last-modified date (git log), size, and 1-line summary
2. **Classify**: Mark each as:
   - Active — referenced by code, CI/CD, or other docs; maintain
   - Stale — outdated but contains useful content; consolidate into docs/architecture/
   - Orphan — one-off logs, superseded plans, AI-generated reports; delete
3. **Consolidate**: Merge useful stale content into canonical `docs/architecture/` documents
4. **Archive/Delete**: Move orphans to `docs/.archive/` or delete. **ASK before deleting**
5. **Verify links**: Check all remaining docs for broken internal references
6. **Report**: Show files kept / consolidated / removed and size savings

## Orphan Detection Patterns

- `*_SUMMARY.md`, `*_REVIEW.md`, `*_STATUS.md` describing completed work
- Multiple versions of same doc — keep only latest
- AI-generated implementation logs
- Resolved bug/feature notes

## Safety

Never auto-delete: `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `LICENSE`, `AGENTS.md`, or any file in `docs/architecture/`
