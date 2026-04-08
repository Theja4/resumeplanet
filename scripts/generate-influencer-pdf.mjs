import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 40px 50px; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; font-size: 11px; line-height: 1.5; }

  .cover { page-break-after: always; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 90vh; text-align: center; }
  .cover h1 { font-size: 32px; font-weight: 700; color: #4f46e5; margin-bottom: 8px; }
  .cover .subtitle { font-size: 16px; color: #64748b; margin-bottom: 4px; }
  .cover .date { font-size: 13px; color: #94a3b8; margin-top: 16px; }
  .cover .tag { display: inline-block; background: #eef2ff; color: #4f46e5; padding: 4px 14px; border-radius: 20px; font-size: 11px; margin-top: 12px; font-weight: 600; }

  .toc { page-break-after: always; padding-top: 40px; }
  .toc h2 { font-size: 20px; color: #4f46e5; margin-bottom: 20px; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; }
  .toc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .toc-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #e2e8f0; }
  .toc-item .name { font-weight: 600; color: #1e293b; }
  .toc-item .platform { color: #64748b; font-size: 10px; }

  .summary-page { page-break-after: always; padding-top: 30px; }
  .summary-page h2 { font-size: 18px; color: #4f46e5; margin-bottom: 16px; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; }
  .summary-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  .summary-table th { background: #4f46e5; color: white; padding: 8px 6px; text-align: left; font-weight: 600; }
  .summary-table td { padding: 7px 6px; border-bottom: 1px solid #e2e8f0; }
  .summary-table tr:nth-child(even) { background: #f8fafc; }
  .summary-table .followers { font-weight: 600; color: #4f46e5; }

  .section { page-break-inside: avoid; margin-bottom: 28px; }
  .card { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
  .card-header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
  .card-header h3 { font-size: 15px; font-weight: 700; }
  .card-header .num { background: rgba(255,255,255,0.2); padding: 2px 10px; border-radius: 12px; font-size: 11px; }
  .card-body { padding: 16px 18px; }

  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .meta-item { }
  .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600; margin-bottom: 2px; }
  .meta-value { font-size: 11px; color: #1e293b; font-weight: 500; }

  .tag-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .tag { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 9px; font-weight: 600; }
  .tag-platform { background: #dbeafe; color: #1d4ed8; }
  .tag-audience { background: #dcfce7; color: #15803d; }
  .tag-size { background: #fef3c7; color: #b45309; }

  .why-box { background: #f0fdf4; border-left: 3px solid #22c55e; padding: 10px 14px; border-radius: 0 6px 6px 0; margin-top: 10px; }
  .why-box .why-title { font-size: 10px; text-transform: uppercase; color: #15803d; font-weight: 700; margin-bottom: 4px; }
  .why-box p { font-size: 10.5px; color: #1e293b; line-height: 1.55; }

  .outreach-box { background: #eff6ff; border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 0 6px 6px 0; margin-top: 8px; }
  .outreach-box .outreach-title { font-size: 10px; text-transform: uppercase; color: #1d4ed8; font-weight: 700; margin-bottom: 4px; }
  .outreach-box p { font-size: 10.5px; color: #1e293b; line-height: 1.55; }

  .strategy-page { padding-top: 30px; }
  .strategy-page h2 { font-size: 18px; color: #4f46e5; margin-bottom: 16px; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; }
  .strategy-section { margin-bottom: 18px; }
  .strategy-section h4 { font-size: 13px; color: #1e293b; margin-bottom: 6px; }
  .strategy-section ul { padding-left: 18px; }
  .strategy-section li { margin-bottom: 4px; font-size: 11px; color: #334155; }

  .priority-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; margin-left: 6px; }
  .priority-1 { background: #fee2e2; color: #dc2626; }
  .priority-2 { background: #fef3c7; color: #b45309; }
  .priority-3 { background: #dbeafe; color: #2563eb; }

  .page-break { page-break-before: always; }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <h1>ResumePlanet</h1>
  <div class="subtitle">Influencer Partnership Targets</div>
  <div class="subtitle" style="font-size:13px; color:#94a3b8;">15 Career Creators for Affiliate Revenue-Split Deals</div>
  <div class="tag">NA & EU Audiences</div>
  <div class="date">Prepared April 2026 &bull; Confidential</div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc">
  <h2>Influencer Directory</h2>
  <div class="toc-grid">
    <div class="toc-item"><span class="name">1. Mandy Tang</span><span class="platform">TikTok 151K</span></div>
    <div class="toc-item"><span class="name">2. Samara Elkins</span><span class="platform">IG 129K</span></div>
    <div class="toc-item"><span class="name">3. Chelsea Stokes</span><span class="platform">TikTok 42K</span></div>
    <div class="toc-item"><span class="name">4. Farah Sharghi</span><span class="platform">TikTok 165K</span></div>
    <div class="toc-item"><span class="name">5. Emily Rezkalla</span><span class="platform">TikTok 160K</span></div>
    <div class="toc-item"><span class="name">6. Tiffany Uman</span><span class="platform">IG 180K</span></div>
    <div class="toc-item"><span class="name">7. Chanelle Howell</span><span class="platform">TikTok 78K</span></div>
    <div class="toc-item"><span class="name">8. Eliana Goldstein</span><span class="platform">IG 210K</span></div>
    <div class="toc-item"><span class="name">9. Bryan Creely</span><span class="platform">YT 250K+</span></div>
    <div class="toc-item"><span class="name">10. Anna Belyaeva</span><span class="platform">IG 199K</span></div>
    <div class="toc-item"><span class="name">11. Liora Alvarez</span><span class="platform">TikTok 32K</span></div>
    <div class="toc-item"><span class="name">12. Kelsey Wat</span><span class="platform">TikTok 22K</span></div>
    <div class="toc-item"><span class="name">13. Daphne Gomez</span><span class="platform">IG 85K</span></div>
    <div class="toc-item"><span class="name">14. Rosie McCarthy</span><span class="platform">IG 173K</span></div>
    <div class="toc-item"><span class="name">15. Andrew LaCivita</span><span class="platform">YT 250K+</span></div>
  </div>

  <div style="margin-top: 30px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
    <h4 style="font-size: 12px; color: #4f46e5; margin-bottom: 8px;">Deal Structure: Revenue-Split Affiliate</h4>
    <ul style="padding-left: 16px; font-size: 11px; color: #475569;">
      <li><strong>Commission:</strong> 30-40% recurring on all conversions</li>
      <li><strong>Tracking:</strong> Unique promo codes per influencer (e.g., MANDY50, BRYAN30)</li>
      <li><strong>Plans promoted:</strong> Monthly ($12/mo), Annual ($99/yr)</li>
      <li><strong>First-month offer:</strong> $6 first month (50% off) via existing promo system</li>
      <li><strong>Cookie window:</strong> 30-day attribution</li>
    </ul>
  </div>
</div>

<!-- SUMMARY TABLE -->
<div class="summary-page">
  <h2>At-a-Glance Summary</h2>
  <table class="summary-table">
    <tr>
      <th>#</th><th>Name</th><th>Handle</th><th>Platform</th><th>Followers</th><th>Niche</th><th>Region</th><th>Priority</th>
    </tr>
    <tr><td>1</td><td>Mandy Tang</td><td>@careercoachmandy</td><td>TikTok</td><td class="followers">151K</td><td>Career transitions</td><td>US</td><td><span class="priority-badge priority-1">Tier 1</span></td></tr>
    <tr><td>2</td><td>Samara Elkins</td><td>@coachingbysamara</td><td>IG / TikTok</td><td class="followers">129K / 30K</td><td>Resume writing</td><td>US</td><td><span class="priority-badge priority-1">Tier 1</span></td></tr>
    <tr><td>3</td><td>Chelsea Stokes</td><td>@chelseastokes_</td><td>TikTok / IG</td><td class="followers">42K / 25K</td><td>6-figure jobs</td><td>US</td><td><span class="priority-badge priority-1">Tier 1</span></td></tr>
    <tr><td>4</td><td>Farah Sharghi</td><td>@farahsharghi</td><td>TikTok / IG</td><td class="followers">165K / 46K</td><td>FAANG recruiting</td><td>US</td><td><span class="priority-badge priority-1">Tier 1</span></td></tr>
    <tr><td>5</td><td>Emily Rezkalla</td><td>@emrezkalla</td><td>TikTok</td><td class="followers">160K+</td><td>Resume & salary</td><td>Canada</td><td><span class="priority-badge priority-2">Tier 2</span></td></tr>
    <tr><td>6</td><td>Tiffany Uman</td><td>@tiffany.uman</td><td>IG / TikTok</td><td class="followers">180K / 95K</td><td>Senior women careers</td><td>US/EU</td><td><span class="priority-badge priority-2">Tier 2</span></td></tr>
    <tr><td>7</td><td>Chanelle Howell</td><td>@chanelle.howell</td><td>TikTok</td><td class="followers">78K</td><td>Remote jobs</td><td>US</td><td><span class="priority-badge priority-2">Tier 2</span></td></tr>
    <tr><td>8</td><td>Eliana Goldstein</td><td>@eliana_goldstein</td><td>IG / TikTok</td><td class="followers">210K / 67K</td><td>Career pivots</td><td>US</td><td><span class="priority-badge priority-2">Tier 2</span></td></tr>
    <tr><td>9</td><td>Bryan Creely</td><td>@alifeafterlayoff</td><td>YT / TikTok</td><td class="followers">250K+ / 73K</td><td>Layoff recovery</td><td>US</td><td><span class="priority-badge priority-1">Tier 1</span></td></tr>
    <tr><td>10</td><td>Anna Belyaeva</td><td>@thecareerdiet</td><td>IG / TikTok</td><td class="followers">199K / 80K</td><td>Corporate advancement</td><td>US</td><td><span class="priority-badge priority-2">Tier 2</span></td></tr>
    <tr><td>11</td><td>Liora Alvarez</td><td>@ohheyitsliora</td><td>TikTok</td><td class="followers">32K</td><td>Neurodivergent careers</td><td>US</td><td><span class="priority-badge priority-3">Tier 3</span></td></tr>
    <tr><td>12</td><td>Kelsey Wat</td><td>@tgimcareers</td><td>TikTok</td><td class="followers">22K</td><td>Career clarity</td><td>US</td><td><span class="priority-badge priority-3">Tier 3</span></td></tr>
    <tr><td>13</td><td>Daphne Gomez</td><td>@teachercareercoach</td><td>IG / Podcast</td><td class="followers">85K + 85K email</td><td>Teacher transitions</td><td>US</td><td><span class="priority-badge priority-1">Tier 1</span></td></tr>
    <tr><td>14</td><td>Rosie McCarthy</td><td>@badasscareers</td><td>IG / LinkedIn</td><td class="followers">173K</td><td>Personal branding</td><td>NZ/EU</td><td><span class="priority-badge priority-2">Tier 2</span></td></tr>
    <tr><td>15</td><td>Andrew LaCivita</td><td>@andrewlacivita</td><td>YouTube</td><td class="followers">250K+</td><td>Experienced professionals</td><td>US</td><td><span class="priority-badge priority-2">Tier 2</span></td></tr>
  </table>
</div>

<!-- INFLUENCER PROFILES -->
<div class="page-break"></div>

<!-- 1. Mandy Tang -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Mandy Tang</h3><span class="num">#1</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">TikTok 151K</span>
        <span class="tag tag-platform">Instagram</span>
        <span class="tag tag-audience">US Audience</span>
        <span class="tag tag-size">Mid-Tier</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@careercoachmandy</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">mandytang.co</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">American Express, Ogilvy, Conde Nast; Columbia MBA</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Career transitions, resume/cover letter kits, job search strategies</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Already sells resume and cover letter kits — an ATS checker is a natural upsell. Named one of TikTok's top career coaches by The Muse. Featured in Business Insider, LinkedIn, and Today. Her audience is actively seeking practical job search tools.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Position ResumePlanet as a complement to her existing resume kits. Offer a co-branded promo code (e.g., MANDY50) that gives her audience $6 first month. She earns recurring commission on every conversion — passive income on top of her kit sales.</p>
      </div>
    </div>
  </div>
</div>

<!-- 2. Samara Elkins -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Samara Elkins</h3><span class="num">#2</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">Instagram 129K</span>
        <span class="tag tag-platform">TikTok 30K</span>
        <span class="tag tag-audience">US Audience</span>
        <span class="tag tag-size">Micro</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@coachingbysamara</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">coachingbysamara.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">M.Ed. from Vanderbilt, resume writer & career strategist</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Resume writing, interview prep, 1:1 coaching (entry to C-suite)</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Her entire brand IS resume writing. Micro TikTok but strong Instagram. Her audience is already buying resume services — an ATS tool is a perfect complement to her coaching business, not a competitor.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Frame as "recommend to clients between coaching sessions." Her clients can self-serve ATS checks while she focuses on high-value 1:1 work. Win-win: she earns commission without cannibalizing her coaching revenue.</p>
      </div>
    </div>
  </div>
</div>

<!-- 3. Chelsea Stokes -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Chelsea Stokes</h3><span class="num">#3</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">TikTok 42K</span>
        <span class="tag tag-platform">Instagram 25K</span>
        <span class="tag tag-audience">US Audience</span>
        <span class="tag tag-size">Micro</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@chelseastokes_</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">chelseastokes.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">Former recruiter at major media company; podcast "Rich and Hired"</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Landing 6-figure jobs, salary negotiation, resume optimization</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Micro-influencer with highly engaged job-seeker audience. Former recruiter gives ATS recommendations credibility. Her "Rich and Hired" brand aligns perfectly with a tool that helps people get past ATS screens. Small enough to value affiliate revenue highly.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Podcast sponsorship + TikTok content combo. She can demo the ATS checker on her podcast and create before/after score TikToks. Her recruiter background lets her authentically explain why ATS matters.</p>
      </div>
    </div>
  </div>
</div>

<!-- 4. Farah Sharghi -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Farah Sharghi</h3><span class="num">#4</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">TikTok 165K</span>
        <span class="tag tag-platform">Instagram 46K</span>
        <span class="tag tag-audience">US Audience</span>
        <span class="tag tag-size">Mid-Tier</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@farahsharghi</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">farahsharghi.com / stan.store/farahsharghi</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">Former recruiter at Google, Uber, TikTok, Lyft, NYT</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">LinkedIn optimization, ATS tips, FAANG recruiting, resume rewriting</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Already covers ATS optimization and resume writing for tech roles. Sells coaching through Stan Store so she understands digital monetization. FAANG recruiting background gives massive credibility to ATS tool recommendations. Her audience is literally searching for ATS help.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Offer to add ResumePlanet to her Stan Store link-in-bio as an affiliate product. She can create "I scanned a FAANG resume through this ATS checker" content — her audience will eat it up.</p>
      </div>
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- 5. Emily Rezkalla -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Emily Rezkalla</h3><span class="num">#5</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">TikTok 160K+</span>
        <span class="tag tag-platform">Instagram</span>
        <span class="tag tag-platform">YouTube</span>
        <span class="tag tag-audience">Canada</span>
        <span class="tag tag-size">Mid-Tier</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@emrezkalla</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">emilyrezkalla.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">10-year corporate pro; Payscale Top Career Coach 2023</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Job search, resume writing, interview prep, salary negotiation</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Award-winning career coach. Featured in Elle Canada, Business Insider, Yahoo. Canadian audience provides strong NA reach. Already does 1:1 coaching — an ATS affiliate tool fits naturally as a self-serve recommendation for her audience.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Position as "the tool I recommend to everyone who can't afford 1:1 coaching." She can monetize her broader audience without taking more coaching calls.</p>
      </div>
    </div>
  </div>
</div>

<!-- 6. Tiffany Uman -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Tiffany Uman</h3><span class="num">#6</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">Instagram 180K</span>
        <span class="tag tag-platform">TikTok 95K</span>
        <span class="tag tag-platform">LinkedIn 870K</span>
        <span class="tag tag-audience">US / EU</span>
        <span class="tag tag-size">Mid-Tier</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@tiffany.uman</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">tiffanyuman.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">Ex-L'Oreal Sr. Director (US, Canada, France); Forbes Coaches Council</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Career strategy for mid-to-senior women, $150K-$450K+ roles</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Audience of ambitious women actively hunting for high-paying roles — exactly the demographic willing to pay for ATS optimization. Cross-platform presence (IG + TikTok + LinkedIn) amplifies reach. EU work experience means genuine NA + EU audience blend. Already runs coaching business, understands affiliate economics.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Her audience is high-value ($150K+ earners). Pitch the annual plan ($99/yr) — her followers won't blink at that price. Position as "the tool my clients use before our coaching sessions."</p>
      </div>
    </div>
  </div>
</div>

<!-- 7. Chanelle Howell -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Chanelle Howell</h3><span class="num">#7</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">TikTok 78K</span>
        <span class="tag tag-platform">Instagram</span>
        <span class="tag tag-audience">US Audience</span>
        <span class="tag tag-size">Micro</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@chanelle.howell</div></div>
        <div class="meta-item"><div class="meta-label">Contact</div><div class="meta-value">chanellehowellcollabs@gmail.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">7-year banking recruiter; Survivor 42 & The Challenge USA 2</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Remote job hunting, interview tips, salary negotiation, DEI recruiting</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Dedicated collab email = actively seeking brand partnerships. TV appearances give broader name recognition than follower count suggests. Recruiter background makes ATS recommendations credible. Remote job focus aligns with a tool that helps people apply online.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Direct outreach via chanellehowellcollabs@gmail.com. She's clearly open to deals. Pitch: "Your remote job audience is applying through ATS systems every day — here's the tool to get them through."</p>
      </div>
    </div>
  </div>
</div>

<!-- 8. Eliana Goldstein -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Eliana Goldstein</h3><span class="num">#8</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">Instagram 210K</span>
        <span class="tag tag-platform">TikTok 67K</span>
        <span class="tag tag-audience">US Audience</span>
        <span class="tag tag-size">Mid-Tier</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@eliana_goldstein</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">elianagoldsteincoaching.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">9 years tech/media; CBS NY Career Coach; Forbes Coaches Council</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Career pivots for millennials, mid-career advancement, #CareerTok</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Strong #CareerTok presence with mid-career audience actively job searching. Featured on MSNBC, Business Insider, Fast Company. Runs a "Career Accelerator Academy" — an ATS tool complements her existing product ecosystem. Her audience invests in their careers.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Integrate into her Career Accelerator Academy as a recommended tool. Her students are already paying for career help — ResumePlanet becomes part of their toolkit with her earning commission on every signup.</p>
      </div>
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- 9. Bryan Creely -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Bryan Creely</h3><span class="num">#9</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">YouTube 250K+</span>
        <span class="tag tag-platform">TikTok 73K</span>
        <span class="tag tag-platform">LinkedIn 113K</span>
        <span class="tag tag-audience">US Audience</span>
        <span class="tag tag-size">Mid-Tier</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@alifeafterlayoff</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">alifeafterlayoff.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">Former Amazon, Ford, FedEx recruiter; 20+ years; #7 nationally in Career Coaching (Favikon)</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Post-layoff recovery, resume writing, LinkedIn strategy, interview training</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>His audience is people who've been laid off and are urgently job searching — the highest-intent audience possible. Already sells "Resume Rocketfuel" course on Teachable, so he deeply understands the resume space. 1.1M monthly YouTube views = massive organic reach. Weekly live office hours provide natural integration points.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Position ResumePlanet as a companion to his Resume Rocketfuel course: "Build with Bryan's framework, then score and optimize with ResumePlanet." Non-competing, additive value. Demo during his weekly YouTube live office hours.</p>
      </div>
    </div>
  </div>
</div>

<!-- 10. Anna Belyaeva -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Anna Belyaeva</h3><span class="num">#10</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">Instagram 199K</span>
        <span class="tag tag-platform">TikTok 80K</span>
        <span class="tag tag-audience">US Audience</span>
        <span class="tag tag-size">Mid-Tier</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@thecareerdiet</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">thecareerdiet.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">Stanford-certified; LinkedIn Learning instructor; 7-figure business</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Communication skills, corporate advancement, networking, personal branding</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>320K+ community across platforms. The Career Diet is already a 7-figure business — she understands monetization and affiliate economics deeply. Her corporate audience applies through ATS systems daily. Stanford certification adds credibility to tool recommendations.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Appeal to her business acumen: "You're leaving money on the table. Your audience needs ATS help, you're not offering it, and 30% recurring commission means passive revenue from content you're already making."</p>
      </div>
    </div>
  </div>
</div>

<!-- 11. Liora Alvarez -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Liora Alvarez</h3><span class="num">#11</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">TikTok 32K</span>
        <span class="tag tag-platform">Instagram</span>
        <span class="tag tag-audience">US Audience</span>
        <span class="tag tag-size">Micro</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@ohheyitsliora</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">colorfulfutures.us</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">7+ years as recruiter; Cornell DEI in HR certificate</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Career advice for neurodivergent & LGBTQ+ professionals, DEI hiring</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Serves an underrepresented niche that faces unique challenges with standardized ATS processes. Micro-influencer size makes affiliate deals very attractive vs. flat-rate sponsorships she can't command yet. Recruiting background gives credibility. Inclusive career coaching is a growing segment.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Lead with the truthfulness angle: "Our AI doesn't fabricate or inflate — it helps your audience present their real selves effectively." Her community values authenticity; ResumePlanet's honesty constraint resonates.</p>
      </div>
    </div>
  </div>
</div>

<!-- 12. Kelsey Wat -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Kelsey Wat</h3><span class="num">#12</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">TikTok 22K+</span>
        <span class="tag tag-audience">NA Audience</span>
        <span class="tag tag-size">Micro</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@tgimcareers</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">Former social worker turned career coach via workforce development</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Career clarity, targeted resume creation, networking, coffee chat tips</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Classic micro-influencer who would be genuinely excited about affiliate revenue. Content specifically covers targeted resume creation — ATS optimization is a natural extension. Small, engaged following means high trust and conversion rates. Lowest barrier to partnership agreement.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Easiest "yes" on the list. Offer free Pro access + 40% commission (higher rate for smaller creators). She becomes an early advocate and case study for your affiliate program.</p>
      </div>
    </div>
  </div>
</div>

<div class="page-break"></div>

<!-- 13. Daphne Gomez -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Daphne Gomez</h3><span class="num">#13</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">Instagram 85K</span>
        <span class="tag tag-platform">Podcast 50K/mo</span>
        <span class="tag tag-platform">Email 85K subs</span>
        <span class="tag tag-audience">US Audience</span>
        <span class="tag tag-size">Mid-Tier</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@teachercareercoach</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">teachercareercoach.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">Former teacher → Fortune 500 instructional designer; built major brand since 2019</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Helping teachers transition to corporate/tech roles, resume writing for career changers</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Teachers transitioning to corporate roles DESPERATELY need ATS help — their education resumes almost always fail ATS scans. Her 85K email list is incredibly valuable for affiliate promotion (email converts 3-5x better than social). Already sells courses and a job board, so an ATS tool fits naturally into her "transition toolkit."</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Create a dedicated "Teacher Resume ATS Guide" landing page on ResumePlanet. She promotes it to her email list as "the tool I wish I'd had when I transitioned." Her audience's pain point (education resume failing ATS) is extremely specific and solvable.</p>
      </div>
    </div>
  </div>
</div>

<!-- 14. Rosie McCarthy -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Rosie McCarthy</h3><span class="num">#14</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">Instagram 173K</span>
        <span class="tag tag-platform">LinkedIn</span>
        <span class="tag tag-audience">NZ / EU</span>
        <span class="tag tag-size">Mid-Tier</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@badasscareers</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">careersrock.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">Ex-recruiter/HR; Sorbonne Master's; L'Oreal, LVMH; 10+ years multinationals</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Personal branding, standout resumes, career vision, salary negotiation</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why She's a Great Fit</div>
        <p>Your primary EU audience creator. European education and multinational corporate background gives genuine EU audience. "Badass Careers" brand has strong personality — affiliate content would feel authentic, not forced. Marketing + recruiting combo makes her uniquely credible for resume tool recs.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>Lead with the EU angle: "Most resume tools are US-only. ResumePlanet works for any market." Her audience spans multiple European countries — she's your gateway to the EU career market.</p>
      </div>
    </div>
  </div>
</div>

<!-- 15. Andrew LaCivita -->
<div class="section">
  <div class="card">
    <div class="card-header"><h3>Andrew LaCivita</h3><span class="num">#15</span></div>
    <div class="card-body">
      <div class="tag-row">
        <span class="tag tag-platform">YouTube 250K+</span>
        <span class="tag tag-platform">TikTok 13K</span>
        <span class="tag tag-platform">LinkedIn</span>
        <span class="tag tag-audience">US / Global</span>
        <span class="tag tag-size">Mid-Tier</span>
      </div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-label">Handle</div><div class="meta-value">@andrewlacivita</div></div>
        <div class="meta-item"><div class="meta-label">Website</div><div class="meta-value">milewalkacademy.com</div></div>
        <div class="meta-item"><div class="meta-label">Background</div><div class="meta-value">Best-selling author; 350+ companies coached; 100K+ individuals; milewalk Academy</div></div>
        <div class="meta-item"><div class="meta-label">Content Focus</div><div class="meta-value">Resume writing, LinkedIn, salary negotiation, experienced/senior professionals</div></div>
      </div>
      <div class="why-box">
        <div class="why-title">Why He's a Great Fit</div>
        <p>YouTube drives massive organic search traffic from people actively searching for resume help. Unlike most creators targeting Gen Z, his audience is mid-career and senior — higher willingness to pay. Already sells courses on Teachable, understands digital monetization. Weekly live streams provide recurring integration points.</p>
      </div>
      <div class="outreach-box">
        <div class="outreach-title">Outreach Angle</div>
        <p>YouTube affiliate link in video descriptions — evergreen passive income on videos that get views for years. His "resume tips" videos rank in Google search and drive high-intent traffic indefinitely. One integration = years of commission.</p>
      </div>
    </div>
  </div>
</div>

<!-- STRATEGY PAGE -->
<div class="page-break strategy-page">
  <h2>Outreach Strategy & Recommended Sequence</h2>

  <div class="strategy-section">
    <h4>Phase 1: Quick Wins (Week 1-2) <span class="priority-badge priority-1">Tier 1</span></h4>
    <p style="font-size:11px; color:#475569; margin-bottom:8px;">Highest likelihood of saying yes. Start here.</p>
    <ul>
      <li><strong>Samara Elkins</strong> — Her business IS resume writing. Easiest alignment.</li>
      <li><strong>Chelsea Stokes</strong> — Micro-influencer, hungry for affiliate revenue.</li>
      <li><strong>Farah Sharghi</strong> — Already talks about ATS. Literally her content.</li>
      <li><strong>Bryan Creely</strong> — Sells Resume Rocketfuel course. Perfect complement.</li>
      <li><strong>Daphne Gomez</strong> — 85K email list of teachers who need ATS help badly.</li>
      <li><strong>Mandy Tang</strong> — Already sells resume kits. Natural upsell.</li>
    </ul>
  </div>

  <div class="strategy-section">
    <h4>Phase 2: Relationship Building (Week 2-3) <span class="priority-badge priority-2">Tier 2</span></h4>
    <p style="font-size:11px; color:#475569; margin-bottom:8px;">Slightly harder sell but high-value audiences.</p>
    <ul>
      <li><strong>Tiffany Uman</strong> — High-earning audience, push annual plan.</li>
      <li><strong>Eliana Goldstein</strong> — Integrate into her Career Accelerator Academy.</li>
      <li><strong>Anna Belyaeva</strong> — 7-figure business, understands affiliate math.</li>
      <li><strong>Emily Rezkalla</strong> — Award-winning coach, strong Canadian reach.</li>
      <li><strong>Chanelle Howell</strong> — Direct collab email available. Easy outreach.</li>
      <li><strong>Rosie McCarthy</strong> — Your EU market entry point.</li>
      <li><strong>Andrew LaCivita</strong> — YouTube SEO = long-tail evergreen commissions.</li>
    </ul>
  </div>

  <div class="strategy-section">
    <h4>Phase 3: Niche Plays (Week 3-4) <span class="priority-badge priority-3">Tier 3</span></h4>
    <p style="font-size:11px; color:#475569; margin-bottom:8px;">Smaller but highly engaged niche audiences.</p>
    <ul>
      <li><strong>Kelsey Wat</strong> — Offer 40% commission (higher rate for micro). Easiest yes.</li>
      <li><strong>Liora Alvarez</strong> — Lead with truthfulness angle for her DEI community.</li>
    </ul>
  </div>

  <div class="strategy-section" style="margin-top: 24px; padding: 16px; background: #fefce8; border: 1px solid #fde68a; border-radius: 8px;">
    <h4 style="color: #92400e;">Suggested Commission Structure</h4>
    <ul>
      <li><strong>Micro (&lt;50K):</strong> 40% recurring + free Pro access</li>
      <li><strong>Mid-Tier (50K-200K):</strong> 35% recurring + free Pro access</li>
      <li><strong>200K+:</strong> 30% recurring + free Pro access + dedicated promo code</li>
      <li><strong>All creators:</strong> Unique promo code giving their audience $6 first month</li>
      <li><strong>Bonus:</strong> $25 bonus per 10 conversions in first 30 days</li>
    </ul>
  </div>

  <div style="margin-top: 20px; padding: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
    <h4 style="color: #15803d; font-size: 12px; margin-bottom: 6px;">Content That Converts for ATS Tools</h4>
    <ul style="font-size: 10.5px; color: #166534;">
      <li>"I scored my resume... then fixed it" — before/after ATS score screen recordings</li>
      <li>"The AI rewrote my bullet points and here's what changed" — side-by-side comparisons</li>
      <li>"I tailored my resume for 5 jobs in 20 minutes" — speed/efficiency demos</li>
      <li>"Why your resume is getting rejected (it's not what you think)" — ATS education + tool demo</li>
    </ul>
  </div>
</div>

</body>
</html>`;

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });

const outputPath = resolve('/Users/thejach/Downloads/ResumePlanet/ResumePlanet_Influencer_Targets.pdf');

await page.pdf({
  path: outputPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '40px', bottom: '40px', left: '50px', right: '50px' },
});

await browser.close();
console.log(`PDF generated: ${outputPath}`);
