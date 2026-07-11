-- Extend the ai_request_cache feature check with new cacheable AI features:
--   jd_requirements  — per-JD requirement extraction shared by match + tailor
--   recruiter_skim   — recruiter first-impression simulation
--   impact_interview — evidence-elicitation questions
-- Also adds linkedin_rewrite, which the app already writes but the original
-- check silently rejected (writeAIRequestCache logs and drops the row).
alter table public.ai_request_cache
  drop constraint if exists ai_request_cache_feature_check;

alter table public.ai_request_cache
  add constraint ai_request_cache_feature_check
  check (feature in (
    'ats_basic',
    'ats_pro',
    'match_pro',
    'cover_letter',
    'linkedin_rewrite',
    'jd_requirements',
    'recruiter_skim',
    'impact_interview'
  ));
