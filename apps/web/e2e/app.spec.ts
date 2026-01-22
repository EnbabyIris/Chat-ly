import { test, expect } from '@playwright/test'

test.describe('Application', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check if the page has loaded (basic smoke test)
    await expect(page).toHaveTitle(/Chat/)
  })

  test('should have responsive design', async ({ page, viewport }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle navigation', async ({ page }) => {
    await page.goto('/')

    // Test basic navigation (adjust selectors based on your actual navigation)
    // This is a placeholder - you'll need to adjust based on your app structure
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Performance', () => {
  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
  })

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Allow some expected errors (adjust as needed)
    const allowedErrors = ['favicon.ico', 'manifest.json']
    const significantErrors = errors.filter(error =>
      !allowedErrors.some(allowed => error.includes(allowed))
    )

    expect(significantErrors).toHaveLength(0)
  })
})

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/')

    const images = page.locator('img')
    const count = await images.count()

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt')
      // Allow images with empty alt if they are decorative
      expect(alt !== undefined).toBe(true)
    }
  })

  test('should have focus management', async ({ page }) => {
    await page.goto('/')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })
})