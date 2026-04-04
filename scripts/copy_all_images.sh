cp /Users/thejach/.gemini/antigravity/brain/54818598-6cae-4335-a5ea-24d05be30b04/rezoomed_real_hero_edited_1775334673848.png /Users/thejach/Downloads/ResumePlanet/public/product-hero.png

# Also copy the blog images while we're at it
SRC="/Users/thejach/.gemini/antigravity/brain/54818598-6cae-4335-a5ea-24d05be30b04"
DEST="/Users/thejach/Downloads/ResumePlanet/public/blog"

mkdir -p "$DEST"
cp "$SRC/follow_up_guide_cover_1775310016718.png"    "$DEST/follow-up-hero.png"
cp "$SRC/us_resume_format_cover_1775310048228.png"   "$DEST/us-resume-format-hero.png"
cp "$SRC/overeducated_jobs_cover_1775310076565.png"  "$DEST/overeducated-jobs-hero.png"
cp "$SRC/google_job_guide_cover_1775310103388.png"   "$DEST/google-job-hero.png"
cp "$SRC/job_search_2026_workflow_1775310134045.png" "$DEST/search-2026-workflow.png"
cp "$SRC/follow_up_template_1775310167766.png"       "$DEST/follow-up-template.png"
cp "$SRC/us_resume_layout_1775310196272.png"         "$DEST/us-resume-format-layout.png"
cp "$SRC/overeducated_jobs_map_1775310231051.png"    "$DEST/overeducated-jobs-map.png"
cp "$SRC/google_job_strategy_1775310269119.png"      "$DEST/google-job-strategy.png"

echo "All images copied!"
ls /Users/thejach/Downloads/ResumePlanet/public/product-hero.png
ls "$DEST"
