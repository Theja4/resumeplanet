import { absentCheck, experienceEntryText, isUnread, result, unreadCheck } from "../helpers";
import type { Check } from "../types";

export const profilePhoto: Check = (profile) => {
  const label = "Profile photo";
  const max = 6;
  const photoField = profile.hasPhoto;
  if (isUnread(photoField)) return unreadCheck("photo", label, max, "Couldn't read this section.");
  return photoField!.value === true
    ? result("photo", label, max, max, "pass", "Photo signal is present.")
    : absentCheck("photo", label, max, "Add a clear profile photo.");
};

export const profileBanner: Check = (profile) => {
  const label = "Banner image";
  const max = 4;
  const bannerField = profile.hasBanner;
  if (isUnread(bannerField)) return unreadCheck("banner", label, max, "Couldn't read this section.");
  return bannerField!.value === true
    ? result("banner", label, max, max, "pass", "Banner signal is present.")
    : absentCheck("banner", label, max, "Add a banner that reinforces your role or industry.");
};

export const aboutCompleteness: Check = (profile) => {
  const label = "About section depth";
  const max = 12;
  const aboutField = profile.about;
  if (isUnread(aboutField)) return unreadCheck("about-depth", label, max, "Couldn't read this section.");

  const length = (aboutField!.value ?? "").length;
  if (length === 0) {
    return absentCheck("about-depth", label, max, "Write an About section with role, strengths, and evidence.");
  }
  if (length >= 250) return result("about-depth", label, max, max, "pass", "Your About section has enough substance.");
  if (length >= 80) return result("about-depth", label, 7, max, "warn", "Add more proof, scope, and target-role keywords.");
  return result("about-depth", label, 2, max, "fail", "Write a fuller About section with role, strengths, and evidence.");
};

export const experienceCompleteness: Check = (profile) => {
  const label = "Experience entries filled";
  const max = 14;
  const experienceField = profile.experience;
  if (isUnread(experienceField)) {
    return unreadCheck("experience-filled", label, max, "Couldn't read this section.");
  }

  const entries = experienceField!.value ?? [];
  if (!entries.length) {
    return absentCheck("experience-filled", label, max, "Add your relevant experience.");
  }

  const filled = entries.filter((entry) => {
    const hasTitle = !isUnread(entry.title);
    const hasCompany = !isUnread(entry.company);
    const hasBody = experienceEntryText(entry).length >= 80 || (entry.bullets?.value?.length ?? 0) >= 2;
    return hasTitle && hasCompany && hasBody;
  }).length;

  const ratio = filled / entries.length;
  if (ratio >= 0.85) return result("experience-filled", label, max, max, "pass", "Most experience entries have title, company, and detail.");
  if (ratio >= 0.5) return result("experience-filled", label, 8, max, "warn", "Fill in missing descriptions or bullets on older roles.");
  return result("experience-filled", label, 3, max, "fail", "Several experience entries need title, company, and detail.");
};

export const educationCompleteness: Check = (profile) => {
  const label = "Education";
  const max = 5;
  const educationField = profile.education;
  if (isUnread(educationField)) return unreadCheck("education", label, max, "Couldn't read this section.");
  const count = educationField!.value?.length ?? 0;
  if (count > 0) {
    return result("education", label, max, max, "pass", "Education signal is present.");
  }
  return absentCheck("education", label, max, "Add education or relevant credentials.");
};

export const completenessChecks = [
  profilePhoto,
  profileBanner,
  aboutCompleteness,
  experienceCompleteness,
  educationCompleteness,
];
