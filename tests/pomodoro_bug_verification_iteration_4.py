import asyncio
import json
import os
import time
from playwright.async_api import async_playwright, expect


BASE_URL = os.environ.get("FRONTEND_URL", "https://pdf-notes-13.preview.emergentagent.com")
EMAIL = "admin@dersim.app"
PASSWORD = "Admin123!"


def parse_time(text: str) -> int:
    mm, ss = text.strip().split(":")
    return int(mm) * 60 + int(ss)


async def read_seconds(locator):
    return parse_time((await locator.inner_text()).strip())


async def assert_visible_and_not_reset(page, label, previous=None):
    mini = page.get_by_test_id("pomo-mini")
    await expect(mini).to_be_visible(timeout=8000)
    value = await read_seconds(mini)
    assert value < 25 * 60, f"{label}: mini reset/defaulted to 25:00"
    if previous is not None:
        assert value <= previous, f"{label}: mini time increased unexpectedly {value}>{previous}"
    return value


async def main():
    evidence = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        try:
            await page.context.clear_cookies()
            await page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
            await page.evaluate("localStorage.clear()")

            await page.get_by_test_id("auth-email-input").fill(EMAIL)
            await page.get_by_test_id("auth-password-input").fill(PASSWORD)
            await page.get_by_test_id("auth-submit-btn").click(force=True)
            await expect(page.get_by_test_id("tool-pomodoro")).to_be_visible(timeout=15000)
            evidence.append("logged_in_dashboard")

            await page.get_by_test_id("tool-pomodoro").click(force=True)
            await expect(page.get_by_test_id("pomo-time")).to_have_text("25:00", timeout=5000)
            await page.get_by_test_id("pomo-start-pause").click(force=True)
            await page.wait_for_timeout(2300)
            panel_after_start = await read_seconds(page.get_by_test_id("pomo-time"))
            assert panel_after_start < 1500, f"panel did not start ticking: {panel_after_start}"
            first_mini = await assert_visible_and_not_reset(page, "after_start")
            evidence.append({"after_start_panel": panel_after_start, "after_start_mini": first_mini})

            await page.get_by_test_id("tool-close").click(force=True)
            await page.wait_for_timeout(1300)
            after_close = await assert_visible_and_not_reset(page, "after_close", first_mini)
            evidence.append({"after_close_mini": after_close})

            for tool in ["music", "review", "stats"]:
                await page.get_by_test_id(f"tool-{tool}").click(force=True)
                await expect(page.get_by_test_id(f"tool-panel-{tool}")).to_be_visible(timeout=5000)
                await page.wait_for_timeout(1100)
                value = await assert_visible_and_not_reset(page, f"tool_{tool}", after_close)
                evidence.append({f"tool_{tool}_mini": value})
                after_close = value
                await page.get_by_test_id("tool-close").click(force=True)

            await page.get_by_test_id("header-settings-btn").click(force=True)
            await page.wait_for_url("**/settings", timeout=10000)
            settings_a = await assert_visible_and_not_reset(page, "settings", after_close)
            await page.wait_for_timeout(1200)
            settings_b = await assert_visible_and_not_reset(page, "settings_tick", settings_a)
            evidence.append({"settings_mini_a": settings_a, "settings_mini_b": settings_b})

            await page.get_by_test_id("settings-admin-btn").click(force=True)
            await page.wait_for_url("**/admin", timeout=10000)
            admin_a = await assert_visible_and_not_reset(page, "admin", settings_b)
            await page.wait_for_timeout(1200)
            admin_b = await assert_visible_and_not_reset(page, "admin_tick", admin_a)
            evidence.append({"admin_mini_a": admin_a, "admin_mini_b": admin_b})

            await page.goto(f"{BASE_URL}/", wait_until="domcontentloaded")
            await expect(page.get_by_test_id("tool-pomodoro")).to_be_visible(timeout=10000)
            dashboard_mini = await assert_visible_and_not_reset(page, "dashboard_return", admin_b)
            await page.get_by_test_id("tool-pomodoro").click(force=True)
            panel_return = await read_seconds(page.get_by_test_id("pomo-time"))
            assert panel_return < 1500, f"return panel reset to default: {panel_return}"
            assert abs(panel_return - dashboard_mini) <= 2, f"panel and mini diverged: panel={panel_return}, mini={dashboard_mini}"
            evidence.append({"dashboard_return_mini": dashboard_mini, "panel_return": panel_return})
            await page.get_by_test_id("tool-close").click(force=True)

            before_refresh = await read_seconds(page.get_by_test_id("pomo-mini"))
            state_before = await page.evaluate("JSON.parse(localStorage.getItem('dersim.pomodoro.state.v1'))")
            await page.reload(wait_until="domcontentloaded")
            await expect(page.get_by_test_id("tool-pomodoro")).to_be_visible(timeout=10000)
            await expect(page.get_by_test_id("pomo-mini")).to_be_visible(timeout=8000)
            await page.wait_for_timeout(1000)
            after_refresh = await read_seconds(page.get_by_test_id("pomo-mini"))
            expected_from_end_at = await page.evaluate("""() => {
                const s = JSON.parse(localStorage.getItem('dersim.pomodoro.state.v1'));
                return Math.max(0, Math.round((s.endAt - Date.now()) / 1000));
            }""")
            assert after_refresh < 1500, f"refresh reset to 25:00: {after_refresh}"
            assert after_refresh <= before_refresh, f"refresh time increased: {after_refresh}>{before_refresh}"
            assert abs(after_refresh - expected_from_end_at) <= 2, f"refresh did not use wall clock endAt: displayed={after_refresh}, expected={expected_from_end_at}"
            evidence.append({"before_refresh": before_refresh, "after_refresh": after_refresh, "state_before": state_before, "expected_after_refresh": expected_from_end_at})

            await page.get_by_test_id("pomo-mini").click(force=True)
            await page.wait_for_timeout(1600)
            paused_a = await read_seconds(page.get_by_test_id("pomo-mini"))
            await page.wait_for_timeout(1600)
            paused_b = await read_seconds(page.get_by_test_id("pomo-mini"))
            assert abs(paused_b - paused_a) <= 1, f"mini pause did not hold time: {paused_a}->{paused_b}"
            panels = await page.get_by_test_id("pomodoro-panel").count()
            assert panels == 0, "clicking mini opened pomodoro panel unexpectedly"
            await page.get_by_test_id("pomo-mini").click(force=True)
            await page.wait_for_timeout(1800)
            resumed = await read_seconds(page.get_by_test_id("pomo-mini"))
            assert resumed < paused_b, f"mini resume did not restart countdown: {paused_b}->{resumed}"
            evidence.append({"paused_a": paused_a, "paused_b": paused_b, "resumed": resumed, "panel_count_after_mini_clicks": panels})

            error_text = await page.evaluate("""() => {
                const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"]'));
                return errorElements.map(el => el.textContent).join(", ");
            }""")
            print(f"Found error message: {error_text}" if error_text else "No error messages found on the page")
            print(json.dumps({"status": "PASS", "evidence": evidence}, ensure_ascii=False, indent=2))
        finally:
            await browser.close()


if __name__ == "__main__":
    asyncio.run(main())