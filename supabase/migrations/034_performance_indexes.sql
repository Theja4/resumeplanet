-- CORE USER LOOKUPS
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- POLAR BILLING RELIABILITY
-- Speeds up webhook processing and customer portal lookups.
-- The partial index (WHERE ... IS NOT NULL) keeps the index small and fast.
CREATE INDEX IF NOT EXISTS profiles_polar_subscription_id_idx ON public.profiles (polar_subscription_id) WHERE polar_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_polar_customer_id_idx ON public.profiles (polar_customer_id) WHERE polar_customer_id IS NOT NULL;

-- DASHBOARD PERFORMANCE
-- Speeds up the Resume Library, Job Tracker, and ATS Scorer.
CREATE INDEX IF NOT EXISTS resumes_user_updated_idx ON public.resumes (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS ats_scores_resume_created_idx ON public.ats_scores (resume_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tracked_jobs_user_updated_idx ON public.tracked_jobs (user_id, updated_at DESC);

-- CLEANUP AND AUDITING
CREATE INDEX IF NOT EXISTS ats_scores_user_id_idx ON public.ats_scores (user_id);
CREATE INDEX IF NOT EXISTS tracked_jobs_job_id_idx ON public.tracked_jobs (job_id);
