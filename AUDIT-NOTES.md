# Audit Notes — Out-of-scope issues spotted during Phase execution
> Format: FILE:LINE — SEVERITY — one-sentence description
> Severity: BLOCKING | WORTH FIXING SOON | COSMETIC

- `backend/src/models/Question.ts:13` — COSMETIC — Comment references `/api/admin/migrate-question-roles` route that does not exist in admin-portal (confirmed by Phase 0 audit); dead reference with no runtime effect.
- `dashboard/student-portal/app/(app)/companies/[name]/page.tsx:279-285` — COSMETIC — Hardcoded fallback percentages (DSA 55%, SysDesign 25%, Behavioral 15%, Domain 5%) shown in the Overview round-breakdown chart when `company.roundStructure` is empty; commented "Last resort: proportional defaults". The Trends chart on the same page now uses a real API (`/api/companies/[slug]/trends`) with a correct honest empty state — that part is resolved. This fallback will self-correct once companies carry `roundStructure` data; accept as known limitation until then.
