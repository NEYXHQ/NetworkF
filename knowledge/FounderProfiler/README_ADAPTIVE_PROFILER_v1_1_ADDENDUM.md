
# Adaptive Profiler — Question Bank v1.1 Addendum

This release expands the bank to **50 items** with alternate phrasings and neutral international wording.
Use **form rotation** so repeat users rarely see the same item twice.

## Rotation Strategy
- Maintain 3 forms (A/B/C), each ~16 items mixing all 7 dimensions.
- On each new session, pick the form not used last time; within a form, select adaptively.
- Mark items shown in the last 90 days and avoid reuse unless necessary.

## Drift Control
- Track `dimension_estimates` across sessions; if variance remains high on a dimension, bias selection toward that dimension next session.
- Add 2–3 **verification items** at the end if posterior confidence < 0.85.

## Privacy/UX
- Remind users why you’re asking, expected length (10–14), and that they can skip items.
