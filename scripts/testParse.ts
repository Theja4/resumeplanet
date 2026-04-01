// scripts/testParse.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { parseResume } from '../lib/parsers/index';
import fs from 'fs';

async function main() {
  const sampleText = `John Doe
john@example.com
+1 555-123-4567
San Francisco, CA

Summary
Seasoned software engineer with 5 years experience...

Work Experience
Acme Corp – Senior Engineer (Jan 2020 - Present)
- Led a team of 5 engineers to build a platform.
- Improved performance by 30%

Skills
TypeScript, React, Node.js`;
  const buffer = Buffer.from(sampleText, 'utf-8');
  const result = await parseResume(buffer, 'text/plain');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
