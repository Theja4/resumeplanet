-- The resumes_updated_at trigger bumped updated_at on EVERY update, including
-- server-side metadata writes (ats_score sync, AI-insights cache columns).
-- The builder uses updated_at as its optimistic-concurrency token, so those
-- metadata writes made an open builder tab believe another tab/device had
-- edited the resume and permanently blocked saving ("edited from another tab"
-- banner) even with a single tab open.
--
-- Only bump the token when user-visible resume content actually changes.

drop trigger if exists resumes_updated_at on resumes;

create trigger resumes_updated_at
  before update on resumes
  for each row
  when (
    old.title is distinct from new.title
    or old.raw_text is distinct from new.raw_text
    or old.parsed_data is distinct from new.parsed_data
    or old.original_file_url is distinct from new.original_file_url
    or old.builder_visibility is distinct from new.builder_visibility
    or old.template_config is distinct from new.template_config
  )
  execute procedure set_updated_at();
