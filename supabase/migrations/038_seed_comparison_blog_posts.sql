insert into public.blog_posts (
  title,
  slug,
  excerpt,
  content,
  category,
  author_name,
  status,
  published_at
)
values
(
  'Rezoomed vs Jobscan: Which ATS Resume Tool Is Better in 2026?',
  'rezoomed-vs-jobscan',
  'An honest comparison of Rezoomed and Jobscan — what each tool checks, where each one falls short, and which is better for your resume workflow.',
  $post$Placeholder — content is overridden at runtime by optimized-posts.ts$post$,
  'ATS',
  'Sarah Chen',
  'published',
  now()
),
(
  'Rezoomed vs Resume Worded: AI Resume Tools Compared for 2026',
  'rezoomed-vs-resume-worded',
  'A detailed comparison of Rezoomed and Resume Worded — scoring depth, ATS checking, content feedback, and which tool gives you more actionable resume fixes.',
  $post$Placeholder — content is overridden at runtime by optimized-posts.ts$post$,
  'ATS',
  'Sarah Chen',
  'published',
  now()
),
(
  'Rezoomed vs Zety: Which Resume Builder Is Better for Getting Interviews?',
  'rezoomed-vs-zety',
  'Comparing Rezoomed and Zety on templates, ATS compliance, content scoring, and which resume builder actually helps you get past applicant tracking systems.',
  $post$Placeholder — content is overridden at runtime by optimized-posts.ts$post$,
  'Resume Building',
  'Sarah Chen',
  'published',
  now()
),
(
  'Rezoomed vs Rezi: AI Resume Builders Compared for 2026',
  'rezoomed-vs-rezi',
  'Comparing Rezoomed and Rezi — two ATS-focused resume builders with different strengths in AI content generation, diagnostics, and job-specific tailoring.',
  $post$Placeholder — content is overridden at runtime by optimized-posts.ts$post$,
  'Resume Building',
  'Sarah Chen',
  'published',
  now()
),
(
  'Rezoomed vs Enhancv: Resume Builders Compared for ATS and Design',
  'rezoomed-vs-enhancv',
  'Comparing Rezoomed and Enhancv — where visual templates help, where they hurt ATS parsing, and which builder is better for getting past applicant tracking systems.',
  $post$Placeholder — content is overridden at runtime by optimized-posts.ts$post$,
  'Resume Building',
  'Sarah Chen',
  'published',
  now()
),
(
  'Rezoomed vs Canva for Resumes: Why Design Tools Fail ATS Systems',
  'rezoomed-vs-canva',
  'Why Canva resume templates usually fail ATS parsing, what Rezoomed does differently, and when each tool is the right choice for job applications.',
  $post$Placeholder — content is overridden at runtime by optimized-posts.ts$post$,
  'Resume Building',
  'Sarah Chen',
  'published',
  now()
)
on conflict (slug) do nothing;
