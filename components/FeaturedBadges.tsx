/**
 * "Featured on…" badges (Startup Fame, Findly.tools).
 *
 * Server component so the <a>/<img> markup is always present in the
 * server-rendered HTML — each directory's verification crawler fetches the
 * page source and must find its badge there. Sits at the bottom of the footer.
 */
export default function FeaturedBadges() {
  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-4 px-6 pb-10">
      <a
        href="https://startupfa.me/s/rezoomed.com-251?utm_source=www.rezoomed.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Rezoomed - Featured on Startup Fame"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://startupfa.me/badges/featured-badge-small.webp"
          alt="Rezoomed - Featured on Startup Fame"
          width={224}
          height={36}
        />
      </a>
      <a
        href="https://findly.tools/rezoomed?utm_source=rezoomed"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Rezoomed - Featured on Findly.tools"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://findly.tools/badges/findly-tools-badge-light.svg"
          alt="Featured on Findly.tools"
          width={150}
          height={36}
        />
      </a>
    </div>
  )
}
