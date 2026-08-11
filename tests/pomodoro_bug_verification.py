"""
Focused Playwright verification script for the reported Pomodoro persistence bug.

Scope:
- Start Pomodoro, close/switch tools, navigate settings/back, refresh.
- Verify header mini timer keeps showing/ticking on Dashboard, state persists via wall-clock time,
  mini pause/resume works, and reset returns to 25:00/hides mini.

This file is the saved test artifact. The same action sequence was executed with the browser
automation tool against the preview UI.
"""

import re


def parse_time(value: str) -> int:
    match = re.search(r"(\d{1,2}):(\d{2})", value or "")
    if not match:
        raise AssertionError(f"No MM:SS time found in: {value!r}")
    return int(match.group(1)) * 60 + int(match.group(2))


async def run(page):
    await page.set_viewport_size({"width": 1920, "height": 1080})
    await page.context.clear_cookies()
    await page.goto("https://pdf-notes-13.preview.emergentagent.com/login", wait_until="domcontentloaded")
    await page.evaluate("""() => localStorage.clear()""")
    await page.reload(wait_until="domcontentloaded")

    await page.get_by_test_id("auth-email-input").fill("admin@dersim.app")
    await page.get_by_test_id("auth-password-input").fill("Admin123!")
    await page.get_by_test_id("auth-submit-btn").click()
    await page.get_by_test_id("app-header").wait_for(timeout=15000)

    await page.evaluate("""() => {
        localStorage.removeItem('dersim.pomodoro.state.v1');
        localStorage.removeItem('dersim.pomodoro.cycles.v1');
    }""")
    await page.reload(wait_until="domcontentloaded")
    await page.get_by_test_id("app-header").wait_for(timeout=15000)

    await page.get_by_test_id("tool-pomodoro").click()
    await page.get_by_test_id("pomo-time").wait_for(timeout=5000)
    assert (await page.get_by_test_id("pomo-time").inner_text()).strip() == "25:00"
    await page.get_by_test_id("pomo-start-pause").click()
    await page.wait_for_function("""() => document.querySelector('[data-testid="pomo-time"]')?.textContent.trim() === '24:59'""", timeout=3500)

    await page.get_by_test_id("tool-close").click()
    await page.get_by_test_id("pomo-mini").wait_for(timeout=5000)
    mini_initial = parse_time(await page.get_by_test_id("pomo-mini").inner_text())
    assert await page.evaluate("""() => !!document.querySelector('[data-testid="pomo-mini"] .animate-pulse')"""), "Running dot missing"

    await page.get_by_test_id("tool-music").click()
    await page.get_by_test_id("tool-panel-music").wait_for(timeout=5000)
    await page.wait_for_timeout(4200)
    mini_after_music = parse_time(await page.get_by_test_id("pomo-mini").inner_text())
    assert mini_after_music < mini_initial, "Mini timer froze or increased while Music panel was open"

    await page.get_by_test_id("tool-review").click()
    await page.get_by_test_id("tool-panel-review").wait_for(timeout=5000)
    await page.wait_for_timeout(2200)
    mini_after_review = parse_time(await page.get_by_test_id("pomo-mini").inner_text())
    assert mini_after_review < mini_after_music, "Mini timer froze or reset while Review panel was open"

    await page.get_by_test_id("tool-pomodoro").click()
    await page.get_by_test_id("tool-panel-pomodoro").wait_for(timeout=5000)
    main_reopen = parse_time(await page.get_by_test_id("pomo-time").inner_text())
    mini_reopen = parse_time(await page.get_by_test_id("pomo-mini").inner_text())
    assert main_reopen != 1500 and abs(main_reopen - mini_reopen) <= 1

    before_settings = mini_reopen
    await page.get_by_test_id("header-settings-btn").click()
    await page.get_by_test_id("settings-back").wait_for(timeout=10000)
    await page.wait_for_timeout(3200)
    mini_on_settings = await page.get_by_test_id("pomo-mini").count()
    await page.get_by_test_id("settings-back").click()
    await page.get_by_test_id("app-header").wait_for(timeout=10000)
    await page.get_by_test_id("pomo-mini").wait_for(timeout=5000)
    after_settings = parse_time(await page.get_by_test_id("pomo-mini").inner_text())
    assert after_settings < before_settings, "Timer did not continue across /settings navigation"

    before_refresh = after_settings
    await page.reload(wait_until="domcontentloaded")
    await page.get_by_test_id("app-header").wait_for(timeout=10000)
    await page.get_by_test_id("pomo-mini").wait_for(timeout=5000)
    await page.wait_for_timeout(2500)
    after_refresh = parse_time(await page.get_by_test_id("pomo-mini").inner_text())
    assert after_refresh < before_refresh and after_refresh != 1500

    await page.get_by_test_id("pomo-mini").click()
    paused_1 = parse_time(await page.get_by_test_id("pomo-mini").inner_text())
    await page.wait_for_timeout(2500)
    paused_2 = parse_time(await page.get_by_test_id("pomo-mini").inner_text())
    assert paused_2 == paused_1, "Mini pause click did not pause the timer"
    await page.get_by_test_id("pomo-mini").click()
    await page.wait_for_timeout(2500)
    resumed = parse_time(await page.get_by_test_id("pomo-mini").inner_text())
    assert resumed < paused_2, "Mini resume click did not resume the timer"

    await page.get_by_test_id("tool-pomodoro").click()
    await page.get_by_test_id("tool-panel-pomodoro").wait_for(timeout=5000)
    await page.get_by_test_id("pomo-reset").click()
    assert (await page.get_by_test_id("pomo-time").inner_text()).strip() == "25:00"
    assert await page.get_by_test_id("pomo-mini").count() == 0
    return {"mini_on_settings_count": mini_on_settings}