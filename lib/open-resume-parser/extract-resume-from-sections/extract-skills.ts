import type { ResumeSkills, FeaturedSkill, ResumeSectionToLines } from "../types";
import { getSectionLinesByKeywords } from "./lib/get-section-lines";
import {
  getBulletPointsFromLines,
  getDescriptionsLineIdx,
} from "./lib/bullet-points";

// Inline the initialFeaturedSkills setup (originally from Redux slice)
const initialFeaturedSkill: FeaturedSkill = { skill: "", rating: 4 };
const initialFeaturedSkills: FeaturedSkill[] = Array(6).fill({
  ...initialFeaturedSkill,
});

// Simple deep clone for small objects
const deepClone = <T>(object: T): T =>
  JSON.parse(JSON.stringify(object));

export const extractSkills = (sections: ResumeSectionToLines) => {
  const lines = getSectionLinesByKeywords(sections, ["skill"]);
  const descriptionsLineIdx = getDescriptionsLineIdx(lines) ?? 0;
  const descriptionsLines = lines.slice(descriptionsLineIdx);
  const descriptions = getBulletPointsFromLines(descriptionsLines);

  const featuredSkills = deepClone(initialFeaturedSkills);
  if (descriptionsLineIdx !== 0) {
    const featuredSkillsLines = lines.slice(0, descriptionsLineIdx);
    const featuredSkillsTextItems = featuredSkillsLines
      .flat()
      .filter((item) => item.text.trim())
      .slice(0, 6);
    for (let i = 0; i < featuredSkillsTextItems.length; i++) {
      featuredSkills[i].skill = featuredSkillsTextItems[i].text;
    }
  }

  const skills: ResumeSkills = {
    featuredSkills,
    descriptions,
  };

  return { skills };
};
