from playwright.sync_api import sync_playwright
import time

def capture(url, output_path, viewport_width=1440, viewport_height=900):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': viewport_width, 'height': viewport_height},
            device_scale_factor=2,  # retina for sharpness
        )
        page = context.new_page()
        page.goto(url, wait_until='networkidle', timeout=60000)
        # Extra wait for animations/fonts to settle
        time.sleep(4)
        page.screenshot(path=output_path, full_page=True)
        browser.close()
        print(f"Saved: {output_path}")

url = "https://yuya.framer.website/"

# Desktop 1440px
capture(url, "/Users/thejach/Downloads/ResumePlanet/screenshots/yuya_desktop_1440.png", 1440, 900)

# Mobile 390px
capture(url, "/Users/thejach/Downloads/ResumePlanet/screenshots/yuya_mobile_390.png", 390, 844)

print("All screenshots captured.")
