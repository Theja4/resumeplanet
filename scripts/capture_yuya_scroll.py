from playwright.sync_api import sync_playwright
import time

def capture_with_scroll(url, output_path, viewport_width=1440, viewport_height=900):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--disable-web-security"])
        context = browser.new_context(
            viewport={'width': viewport_width, 'height': viewport_height},
            device_scale_factor=2,
        )
        page = context.new_page()

        # Disable CSS animations and transitions so content is visible
        page.goto(url, wait_until='networkidle', timeout=60000)
        time.sleep(3)

        # Inject CSS to disable all animations and make everything visible
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

        # Get full page height
        total_height = page.evaluate("document.body.scrollHeight")
        print(f"[{viewport_width}px] Total page height: {total_height}px")

        # Scroll through page in steps to trigger lazy-load / scroll animations
        scroll_step = viewport_height // 2
        current_pos = 0
        while current_pos < total_height:
            page.evaluate(f"window.scrollTo(0, {current_pos})")
            time.sleep(0.4)
            current_pos += scroll_step

        # Scroll back to top
        page.evaluate("window.scrollTo(0, 0)")
        time.sleep(1)

        # Re-check height after lazy loading
        total_height = page.evaluate("document.body.scrollHeight")
        print(f"[{viewport_width}px] Final page height after scroll: {total_height}px")

        page.screenshot(path=output_path, full_page=True)
        browser.close()
        print(f"Saved: {output_path}")

url = "https://yuya.framer.website/"

# Desktop 1440px
capture_with_scroll(url, "/Users/thejach/Downloads/ResumePlanet/screenshots/yuya_desktop_1440_v2.png", 1440, 900)

# Mobile 390px
capture_with_scroll(url, "/Users/thejach/Downloads/ResumePlanet/screenshots/yuya_mobile_390_v2.png", 390, 844)

print("Done.")
