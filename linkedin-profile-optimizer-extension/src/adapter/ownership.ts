export function isLinkedInProfileUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "linkedin.com" ||
      parsed.hostname.endsWith(".linkedin.com")
    ) && /^\/in\/[^/?#]+\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

export function isLikelyOwnProfilePage(doc: Document): boolean {
  if (!isLinkedInProfileUrl(doc.location.href)) return false;

  const main = doc.querySelector("main") ?? doc.body;
  const bodyText = (main.textContent ?? "").toLowerCase();
  const ownerTextSignals = [
    "add profile section",
    "edit public profile & url",
    "edit public profile and url",
    "profile viewers",
    "post impressions",
    "search appearances",
    "creator mode",
  ];

  if (ownerTextSignals.some((signal) => bodyText.includes(signal))) {
    return true;
  }

  const controls = Array.from(
    main.querySelectorAll<HTMLElement>("button, a[href], [aria-label]"),
  ).slice(0, 800);

  const ownerControlSignals = [
    "edit intro",
    "edit profile",
    "edit top card",
    "edit profile photo",
    "edit background photo",
    "edit contact info",
    "edit public profile",
    "add profile section",
    "add section",
    "enhance profile",
    "profile-edit",
    "profile/edit",
    "/edit/",
  ];

  return controls.some((element) => {
    const aria = element.getAttribute("aria-label") ?? "";
    const title = element.getAttribute("title") ?? "";
    const href = element instanceof HTMLAnchorElement ? element.href : "";
    const text = element.textContent ?? "";
    const signal = `${aria} ${title} ${href} ${text}`.toLowerCase();

    return ownerControlSignals.some((ownerSignal) => signal.includes(ownerSignal));
  });
}
