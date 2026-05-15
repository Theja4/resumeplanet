from playwright.sync_api import sync_playwright
import time

def capture_sections(url, base_path, viewport_width=1440, viewport_height=900, label="desktop"):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': viewport_width, 'height': viewport_height},
            device_scale_factor=2,
        )
        page = context.new_page()
        page.goto(url, wait_until='networkidle', timeout=60000)
        time.sleep(3)

        page.add_style_tag(content="""
            *, *::before, *::after {
                animation-duration: 0.001ms !important;
                animation-delay: 0ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.001ms !important;
                transition-delay: 0ms !important;
                opacity: 1 !important;
                transform: none !important;
                visibility: visible !important;
            }
        """)

        total_height = page.evaluate("document.body.scrollHeight")
        scroll_step = viewport_height // 2
        current_pos = 0
        while current_pos < total_height:
            page.evaluate(f"window.scrollTo(0, {current_pos})")
            time.sleep(0.3)
            current_pos += scroll_step

        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(1)

        # Capture viewport-sized sections
        total_height = page.evaluate("document.body.scrollHeight")
        num_sections = (total_height // viewport_height) + 1
        print(f"[{label}] Total height: {total_height}px, Sections: {num_sections}")

        for i in range(num_sections):
            scroll_y = i * viewport_height
            if scroll_y > total_height:
                break
            page.evaluate(f"window.scrollTo(0, {scroll_y})")
            time.sleep(0.3)
            out = f"{base_path}_{label}_section{i+1:02d}.png"
            page.screenshot(path=out, full_page=False)
            print(f"  Saved section {i+1}: scroll_y={scroll_y} -> {out}")

        browser.close()

url = "https://yuya.framer.website/"

capture_sections(url, "/Users/thejach/Downloads/ResumePlanet/screenshots/yuya", 1440, 900, "desktop")
capture_sections(url, "/Users/thejach/Downloads/ResumePlanet/screenshots/yuya", 390, 844, "mobile")

print("All sections done.")
