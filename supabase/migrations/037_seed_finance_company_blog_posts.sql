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
  'How to Get a Job at JPMorgan Chase: Resume Example, Application Strategy, and Interview Prep',
  'how-to-land-a-job-at-jpmorgan-chase',
  'How to get a job at JPMorgan Chase in 2026: role targeting, resume strategy, banking proof, a JPMorgan Chase-ready resume example, and interview prep.',
  $post$
# How to Get a Job at JPMorgan Chase

This company guide is generated from Rezoomed's structured company job guide data.
$post$,
  'Job Search',
  'Rezoomed Editorial Team',
  'published',
  '2026-05-09T09:00:00Z'
),
(
  'How to Get a Job at Goldman Sachs: Resume Example, Application Strategy, and Interview Prep',
  'how-to-land-a-job-at-goldman-sachs',
  'How to get a job at Goldman Sachs in 2026: application timing, resume positioning, deal and markets proof, a Goldman Sachs-ready resume example, and interview prep.',
  $post$
# How to Get a Job at Goldman Sachs

This company guide is generated from Rezoomed's structured company job guide data.
$post$,
  'Job Search',
  'Rezoomed Editorial Team',
  'published',
  '2026-05-09T08:55:00Z'
),
(
  'How to Get a Job at Morgan Stanley: Resume Example, Application Strategy, and Interview Prep',
  'how-to-land-a-job-at-morgan-stanley',
  'How to get a job at Morgan Stanley in 2026: resume targeting, interview preparation, wealth and investment banking proof, a resume example, and application strategy.',
  $post$
# How to Get a Job at Morgan Stanley

This company guide is generated from Rezoomed's structured company job guide data.
$post$,
  'Job Search',
  'Rezoomed Editorial Team',
  'published',
  '2026-05-09T08:50:00Z'
),
(
  'How to Get a Job at BlackRock: Resume Example, Application Strategy, and Interview Prep',
  'how-to-land-a-job-at-blackrock',
  'How to get a job at BlackRock in 2026: asset management targeting, Aladdin and portfolio proof, a BlackRock-ready resume example, and interview prep.',
  $post$
# How to Get a Job at BlackRock

This company guide is generated from Rezoomed's structured company job guide data.
$post$,
  'Job Search',
  'Rezoomed Editorial Team',
  'published',
  '2026-05-09T08:45:00Z'
),
(
  'How to Get a Job at Bank of America: Resume Example, Application Strategy, and Interview Prep',
  'how-to-land-a-job-at-bank-of-america',
  'How to get a job at Bank of America in 2026: student and professional application strategy, banking resume proof, a Bank of America-ready resume example, and interview prep.',
  $post$
# How to Get a Job at Bank of America

This company guide is generated from Rezoomed's structured company job guide data.
$post$,
  'Job Search',
  'Rezoomed Editorial Team',
  'published',
  '2026-05-09T08:40:00Z'
),
(
  'How to Get a Job at Citi: Resume Example, Application Strategy, and Interview Prep',
  'how-to-land-a-job-at-citi',
  'How to get a job at Citi in 2026: early career process, markets and banking resume targeting, a Citi-ready resume example, and interview prep.',
  $post$
# How to Get a Job at Citi

This company guide is generated from Rezoomed's structured company job guide data.
$post$,
  'Job Search',
  'Rezoomed Editorial Team',
  'published',
  '2026-05-09T08:35:00Z'
),
(
  'How to Get a Job at Barclays: Resume Example, Application Strategy, and Interview Prep',
  'how-to-land-a-job-at-barclays',
  'How to get a job at Barclays in 2026: graduate application process, assessment prep, banking resume strategy, a Barclays-ready resume example, and interview prep.',
  $post$
# How to Get a Job at Barclays

This company guide is generated from Rezoomed's structured company job guide data.
$post$,
  'Job Search',
  'Rezoomed Editorial Team',
  'published',
  '2026-05-09T08:30:00Z'
),
(
  'How to Get a Job at UBS: Resume Example, Application Strategy, and Interview Prep',
  'how-to-land-a-job-at-ubs',
  'How to get a job at UBS in 2026: early careers targeting, wealth and investment banking resume proof, a UBS-ready resume example, and interview prep.',
  $post$
# How to Get a Job at UBS

This company guide is generated from Rezoomed's structured company job guide data.
$post$,
  'Job Search',
  'Rezoomed Editorial Team',
  'published',
  '2026-05-09T08:25:00Z'
),
(
  'How to Get a Job at Deutsche Bank: Resume Example, Application Strategy, and Interview Prep',
  'how-to-land-a-job-at-deutsche-bank',
  'How to get a job at Deutsche Bank in 2026: student and graduate targeting, CV strategy, banking and technology proof, a Deutsche Bank-ready resume example, and interview prep.',
  $post$
# How to Get a Job at Deutsche Bank

This company guide is generated from Rezoomed's structured company job guide data.
$post$,
  'Job Search',
  'Rezoomed Editorial Team',
  'published',
  '2026-05-09T08:20:00Z'
),
(
  'How to Get a Job at HSBC: Resume Example, Application Strategy, and Interview Prep',
  'how-to-land-a-job-at-hsbc',
  'How to get a job at HSBC in 2026: application guide, assessment prep, global banking resume strategy, a HSBC-ready resume example, and interview prep.',
  $post$
# How to Get a Job at HSBC

This company guide is generated from Rezoomed's structured company job guide data.
$post$,
  'Job Search',
  'Rezoomed Editorial Team',
  'published',
  '2026-05-09T08:15:00Z'
)
on conflict (slug) do update
set title = excluded.title,
    excerpt = excluded.excerpt,
    content = excluded.content,
    category = excluded.category,
    author_name = excluded.author_name,
    status = excluded.status,
    published_at = excluded.published_at,
    updated_at = now();
