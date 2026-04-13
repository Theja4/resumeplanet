import re

import os

files = [
    'supabase/migrations/014_seed_seo_blog_posts.sql',
    'supabase/migrations/026_seed_growth_blog_posts.sql'
]

injection = """## See the difference: The XYZ Formula

Recruiters at top tech companies look for the exact framework Google popularized: "Accomplished [X] as measured by [Y], by doing [Z]."

| Before | After |
| --- | --- |
| Managed cloud infrastructure and updated servers. | Reduced server downtime by 14% (Y) by migrating 50+ legacy applications to AWS EC2 (Z), saving $120k annually (X). |

"""

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We want to identify the boundary of a single post block to safely inject.
    # Posts are wrapped in $post$ ... $post$ or $job_search_...$ ... etc.
    # But all these SQL queries are basically `insert into public.blog_posts ... values (...)`
    # The titles we care about always begin with '# How to Land a'.
    
    # Let's split the file by $post$ and other tags if possible, or just use regex to find `# How to Land a` and the nearest `## Final takeaway`.
    
    # Actually, a regex substitution with a lookahead or a custom parser is safer.
    blocks = re.split(r'(\$[a-zA-Z0-9_]+\$)', content)
    
    out_blocks = []
    
    for i, block in enumerate(blocks):
        if block.startswith('\n# How to Land a'):
            # It's a company post!
            # Replace the first instance of '## Final takeaway'
            
            # Don't double-inject
            if '## See the difference: The XYZ Formula' not in block:
                if '## Common mistakes' in block:
                    block = block.replace('## Common mistakes', injection + '## Common mistakes')
                elif '## Mistakes to avoid' in block:
                    block = block.replace('## Mistakes to avoid', injection + '## Mistakes to avoid')
                elif '## Final takeaway' in block:
                     block = block.replace('## Final takeaway', injection + '## Final takeaway')
            
        out_blocks.append(block)
        
    new_content = "".join(out_blocks)
    
    with open(filepath, 'w') as f:
        f.write(new_content)

for f in files:
    process_file(f)
    print(f"Processed {f}")
