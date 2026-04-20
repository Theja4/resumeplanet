create table if not exists public.blog_resume_examples (
  id text primary key,
  blog_slug text not null,
  title text not null,
  source_label text not null default '',
  source_url text not null default '',
  source_note text not null default '',
  analysis_points jsonb not null default '[]'::jsonb,
  resume_data jsonb not null default '{}'::jsonb,
  template_config jsonb not null default '{}'::jsonb,
  builder_visibility jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_resume_examples_analysis_points_is_array
    check (jsonb_typeof(analysis_points) = 'array'),
  constraint blog_resume_examples_resume_data_is_object
    check (jsonb_typeof(resume_data) = 'object'),
  constraint blog_resume_examples_template_config_is_object
    check (jsonb_typeof(template_config) = 'object'),
  constraint blog_resume_examples_builder_visibility_is_object
    check (jsonb_typeof(builder_visibility) = 'object')
);

alter table public.blog_resume_examples enable row level security;

drop policy if exists "Active blog resume examples are public" on public.blog_resume_examples;

create policy "Active blog resume examples are public"
  on public.blog_resume_examples for select
  using (is_active = true);

drop trigger if exists blog_resume_examples_updated_at on public.blog_resume_examples;

create trigger blog_resume_examples_updated_at
  before update on public.blog_resume_examples
  for each row execute procedure public.set_updated_at();

create index if not exists blog_resume_examples_blog_slug_idx
  on public.blog_resume_examples(blog_slug);

insert into public.blog_resume_examples (
  id,
  blog_slug,
  title,
  source_label,
  source_url,
  source_note,
  analysis_points,
  resume_data,
  template_config,
  builder_visibility,
  is_active
)
values (
  'google-team-leader',
  'how-to-land-a-google-job',
  'Google Team Leader Resume Example',
  'Kickresume',
  'https://www.kickresume.com/en/help-center/google-team-leader-resume-sample/',
  $$Adapted from a public Google-hired resume sample shared by Kickresume. The layout was tightened for readability inside Rezoomed, while the underlying role history, scope, and outcomes stay aligned with the published example.$$,
  $$[
    "The role target is obvious in the first screen, so the recruiter does not need to infer what the candidate wants.",
    "The bullets prove scope with numbers: 16 staff, audiences up to 500, 35%+ footfall growth, GBP 450K+ pipeline, and GBP 620K conversion lift.",
    "The experience reads like ownership and outcomes, not a job-description dump.",
    "Skills are grouped by function, which is cleaner for both recruiter scanning and ATS parsing."
  ]$$::jsonb,
  $${
    "name": "Peter Fernando",
    "email": "hello@kickresume.com",
    "phone": "9999 999 999",
    "location": "Birmingham, UK",
    "linkedin": "",
    "website": "",
    "summary": "Digital marketing leader with 16+ years of experience building growth programs, mentoring teams, and turning training, content, and performance marketing into measurable business outcomes. Led Google Digital Garage programming in Birmingham, partnered with local organizations, and scaled community reach through practical digital-skills education.",
    "currentRole": "Team Leader",
    "experience": [
      {
        "company": "Google Digital Garage",
        "title": "Team Leader",
        "location": "Birmingham, UK",
        "startDate": "Jun 2017",
        "endDate": "Present",
        "bullets": [
          "Managed and mentored a 16-person team, coordinating workshops, coaching sessions, and local partnership programs across Birmingham.",
          "Delivered 7 digital marketing courses to audiences ranging from 1:1 mentoring to 500 attendees, helping businesses and job seekers build practical skills.",
          "Opened new training channels with organizations including Birmingham Job Centre, Birmingham Chamber of Commerce, and Business First Network.",
          "Trained and onboarded 5 team members on new course delivery and audience-support workflows.",
          "Worked with management to target new geographic areas, increasing Digital Garage footfall by 35%+."
        ]
      },
      {
        "company": "UBT (EU) Ltd.",
        "title": "Senior Digital Marketing Manager",
        "location": "Birmingham, UK",
        "startDate": "Nov 2015",
        "endDate": "Dec 2016",
        "bullets": [
          "Built a digital sales pipeline worth GBP 450K+ within 7 months while leading SEO, PPC, email, content, and web-delivery work.",
          "Grew email lists by 53%+ within 6 months while launching 3 new websites and marketing automation workflows.",
          "Increased website conversion value by GBP 620K within 6 months for the Providore brand, finishing 27% above target.",
          "Unified 30 fragmented databases into a master marketing dataset and delivered social media training to 60+ participants."
        ]
      },
      {
        "company": "Enquiniti",
        "title": "Campaign Manager",
        "location": "Birmingham, UK",
        "startDate": "Mar 2017",
        "endDate": "Jun 2017",
        "bullets": [
          "Advised the internal marketing team on communication strategy and customer-journey optimization for savings and investment plan experiences.",
          "Developed a website engagement strategy that increased average visitor duration by more than 8 minutes.",
          "Prototyped a mobile-compatible account-management concept to improve customer usability."
        ]
      }
    ],
    "education": [
      {
        "institution": "Aston University",
        "degree": "BSc",
        "field": "Computing for Business",
        "startDate": "",
        "endDate": "",
        "graduationDate": "",
        "gpa": ""
      }
    ],
    "skills": [
      "Team Leadership",
      "Workshop Facilitation",
      "Stakeholder Management",
      "Partnership Development",
      "SEO",
      "PPC",
      "Email Marketing",
      "Content Marketing",
      "Marketing Automation",
      "Lead Nurturing",
      "CRM Integration",
      "Conversion Optimization",
      "Shopify",
      "Magento",
      "WooCommerce",
      "HubSpot",
      "Mailchimp",
      "Balsamiq",
      "HTML/CSS"
    ],
    "skillSections": [
      {
        "title": "Leadership & Delivery",
        "skills": [
          "Team Leadership",
          "Workshop Facilitation",
          "Stakeholder Management",
          "Partnership Development"
        ]
      },
      {
        "title": "Growth & Marketing",
        "skills": [
          "SEO",
          "PPC",
          "Email Marketing",
          "Content Marketing",
          "Marketing Automation",
          "Lead Nurturing",
          "CRM Integration",
          "Conversion Optimization"
        ]
      },
      {
        "title": "Platforms & Tools",
        "skills": [
          "Shopify",
          "Magento",
          "WooCommerce",
          "HubSpot",
          "Mailchimp",
          "Balsamiq",
          "HTML/CSS"
        ]
      }
    ],
    "certifications": [],
    "projects": [],
    "languages": [],
    "volunteer": [],
    "interests": [],
    "awards": [],
    "publications": [],
    "references": [],
    "customSections": []
  }$$::jsonb,
  $${
    "layout": "single-column",
    "headerStyle": "classic",
    "bulletStyle": "plain",
    "skillsStyle": "inline",
    "sectionHeadingStyle": "rule",
    "contactStyle": "inline",
    "dateLayout": "right",
    "nameSize": "large",
    "accentColor": "#0F6B3A",
    "fontFamily": "Helvetica, Arial, sans-serif",
    "density": "compressed"
  }$$::jsonb,
  $${
    "sections": {
      "contact": true,
      "summary": true,
      "skills": true,
      "languages": false,
      "experience": true,
      "education": true,
      "projects": false,
      "certifications": false,
      "volunteer": false,
      "interests": false,
      "awards": false,
      "publications": false,
      "references": false
    },
    "items": {
      "experience": [true, true, true],
      "education": [true],
      "projects": [],
      "certifications": []
    },
    "sectionOrder": ["summary", "experience", "education"],
    "sidebarSectionOrder": ["skills"],
    "density": "compressed"
  }$$::jsonb,
  true
)
on conflict (id) do update
set
  blog_slug = excluded.blog_slug,
  title = excluded.title,
  source_label = excluded.source_label,
  source_url = excluded.source_url,
  source_note = excluded.source_note,
  analysis_points = excluded.analysis_points,
  resume_data = excluded.resume_data,
  template_config = excluded.template_config,
  builder_visibility = excluded.builder_visibility,
  is_active = excluded.is_active,
  updated_at = now();
