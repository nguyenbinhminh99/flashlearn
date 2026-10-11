import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('MVP 1: đăng nhập → tạo bộ thẻ → học → sửa → xóa → đăng xuất', async ({ page, request }, testInfo) => {
  const apiBaseURL = (process.env.E2E_API_URL ?? '/api').replace(/\/$/, '');
  const title = `E2E MVP 1 ${randomUUID()}`;
  const cards = [
    { front: 'Định lý Pythagoras', back: 'Tam giác vuông: \\(a^2 + b^2 = c^2\\)' },
    {
      front: `Tổng dài: $$${Array.from({ length: 30 }, (_, i) => `x_{${i + 1}}`).join('+')}$$`,
      back: 'Giải thích dài để kiểm tra chiều cao của thẻ. '.repeat(20).trim(),
    },
    { front: 'CPU là gì?', back: 'Bộ xử lý trung tâm.' },
  ];
  const runtimeErrors: string[] = [];
  const apiErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('response', (response) => {
    if (response.url().includes('/api/') && response.status() >= 400) {
      apiErrors.push(`${response.request().method()} ${new URL(response.url()).pathname}: ${response.status()}`);
    }
  });
  let studySetId: string | undefined;
  let token: string | null = null;
  const flip = page.locator('.learn-card');
  const front = page.locator('.learn-card__face--front');
  const back = page.locator('.learn-card__face--back');
  const inner = page.locator('.learn-card__inner');

  async function waitForFlip(): Promise<void> {
    await expect.poll(() => inner.evaluate((element) =>
      element.getAnimations().filter((animation) => animation.playState === 'running').length,
    )).toBe(0);
  }

  async function next(label: string): Promise<void> {
    const saved = page.waitForResponse((response) =>
      response.url().endsWith(`/study-sets/${studySetId}/progress`) && response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: label, exact: true }).click();
    expect((await saved).ok()).toBeTruthy();
  }

  try {
    await test.step('Đăng nhập tài khoản demo qua UI và mở Dashboard', async () => {
      await page.goto('/');
      await page.getByRole('link', { name: 'Đăng nhập', exact: true }).click();
      await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
      await page.getByLabel('Email', { exact: true }).fill(process.env.E2E_EMAIL ?? 'demo@flashlearn.local');
      await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.E2E_PASSWORD ?? 'User1234');
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: Number(process.env.E2E_LOGIN_TIMEOUT ?? 10_000) });
      await expect(page.getByRole('heading', { name: 'Bộ thẻ của tôi' })).toBeVisible();
      token = await page.evaluate(() => localStorage.getItem('flashlearn_token'));
      expect(token).toBeTruthy();
    });

    await test.step('Tạo bộ thẻ riêng tư với ba flashcard, preview KaTeX và lưu qua API thật', async () => {
      await page.getByRole('link', { name: '+ Tạo Study Set', exact: true }).click();
      await page.getByLabel('Tiêu đề', { exact: true }).fill(title);
      await page.getByLabel('Mô tả', { exact: true }).fill('Bộ thẻ tạm cho kiểm thử MVP 1.');
      await page.getByRole('button', { name: '+ Thêm thẻ', exact: true }).click();
      for (const [index, card] of cards.entries()) {
        await page.getByLabel('Thuật ngữ', { exact: true }).nth(index).fill(card.front);
        await page.getByLabel('Định nghĩa', { exact: true }).nth(index).fill(card.back);
      }
      // Reopen a selected formula with the math keyboard and confirm it before
      // saving, so this flow also verifies the editor → API → detail roundtrip.
      const definition = page.getByLabel('Định nghĩa', { exact: true }).first();
      await definition.focus();
      await definition.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(element.value.indexOf('\\('), element.value.length));
      await page.getByRole('button', { name: 'Chèn công thức vào Định nghĩa', exact: true }).first().click();
      const mathDialog = page.getByRole('dialog', { name: 'Chèn công thức', exact: true });
      await expect(mathDialog).toBeVisible();
      await mathDialog.getByRole('button', { name: 'Thay phần đang chọn', exact: true }).click();
      cards[0].back = await definition.inputValue();
      await expect(page.locator('.katex')).toHaveCount(2);
      const created = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/study-sets' && response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Lưu Study Set', exact: true }).click();
      const response = await created;
      expect(response.ok()).toBeTruthy();
      studySetId = (await response.json()).id;
      await expect(page).toHaveURL(new RegExp(`/study-sets/${studySetId}$`));
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await expect(page.getByText('3 flashcard', { exact: true })).toBeVisible();
      const detail = await request.get(`${apiBaseURL}/study-sets/${studySetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(detail.ok()).toBeTruthy();
      const stored = await detail.json();
      expect(stored.isPublic).toBe(false);
      expect(stored.flashcards.map((card: { front: string; back: string }) => ({ front: card.front, back: card.back }))).toEqual(cards);
    });

    await test.step('Lật 3D bằng chuột/Space/Enter, chỉ mặt đang xem được đọc', async () => {
      await page.getByRole('link', { name: 'Học ngay', exact: true }).click();
      await expect(page.getByText('Thẻ 1 / 3', { exact: true })).toBeVisible();
      await expect(front).toContainText(cards[0].front);
      await expect(flip).toHaveAttribute('aria-pressed', 'false');
      await expect(back).toHaveAttribute('inert', '');
      await expect(page.getByRole('button', { name: 'Trước', exact: true })).toBeDisabled();
      await expect(inner).toHaveCSS('transform-style', 'preserve-3d');
      await expect(inner).toHaveCSS('transition-duration', '0.5s');
      await flip.click();
      await expect.poll(() => inner.evaluate((element) => element.getAnimations().length)).toBe(1);
      const midFlip = await inner.evaluate((element) => {
        const animation = element.getAnimations()[0];
        animation.pause();
        animation.currentTime = 250;
        const transform = getComputedStyle(element).transform;
        animation.play();
        return transform;
      });
      expect(midFlip).not.toBe('none');
      expect(midFlip).not.toBe('matrix3d(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)');
      await expect(flip).toHaveAttribute('aria-pressed', 'true');
      await expect(front).toHaveAttribute('aria-hidden', 'true');
      await expect(back).toHaveAttribute('aria-hidden', 'false');
      await expect(back.locator('.katex')).toHaveCount(1);
      await waitForFlip();
      await expect(inner).toHaveCSS('transform', 'matrix3d(-1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1)');
      await page.screenshot({ path: testInfo.outputPath('learn-back-desktop.png') });
      await testInfo.attach('Mặt sau trên desktop', { path: testInfo.outputPath('learn-back-desktop.png'), contentType: 'image/png' });
      await flip.press('Space');
      await expect(flip).toHaveAttribute('aria-pressed', 'false');
      await waitForFlip();
      await expect(inner).toHaveCSS('transform', 'none');
      await flip.press('Enter');
      await expect(flip).toHaveAttribute('aria-pressed', 'true');
      await waitForFlip();
    });

    await test.step('Chuyển thẻ reset mặt trước; mobile không tràn, câu trả lời dài không bị cắt', async () => {
      await next('Tiếp');
      await expect(page.getByText('Thẻ 2 / 3', { exact: true })).toBeVisible();
      await expect(flip).toHaveAttribute('aria-pressed', 'false');
      await expect(inner).toHaveCSS('transform', 'none');
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(front.locator('.katex-display')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(await front.locator('.katex-display').evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
      await flip.click();
      await waitForFlip();
      await expect(back).toContainText(cards[1].back);
      expect(await back.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: testInfo.outputPath('learn-back-mobile.png'), fullPage: true });
      await testInfo.attach('Mặt sau dài trên mobile', { path: testInfo.outputPath('learn-back-mobile.png'), contentType: 'image/png' });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(inner).toHaveCSS('transition-duration', '0s');
      await flip.press('Space');
      await expect(flip).toHaveAttribute('aria-pressed', 'false');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width: 1280, height: 900 });
      await next('Trước');
      await expect(page.getByText('Thẻ 1 / 3', { exact: true })).toBeVisible();
      await next('Tiếp');
    });

    await test.step('Reload khôi phục tiến độ từ database; học tới màn hoàn thành', async () => {
      await page.reload();
      await expect(page.getByText('Đã khôi phục tiến độ học trước đó của bạn.', { exact: true })).toBeVisible();
      await expect(page.getByText('Thẻ 2 / 3', { exact: true })).toBeVisible();
      await next('Tiếp');
      await expect(page.getByText('Thẻ 3 / 3', { exact: true })).toBeVisible();
      await flip.click();
      await waitForFlip();
      await expect(back).toContainText(cards[2].back);
      await next('Kết thúc');
      await expect(page.getByRole('heading', { name: 'Hoàn thành!', exact: true })).toBeVisible();
      await expect(page.getByText(`Bạn đã xem hết 3 thẻ trong “${title}”.`, { exact: true })).toBeVisible();
    });

    await test.step('Học lại/xáo trộn reset tiến độ và mặt thẻ', async () => {
      const reset = page.waitForResponse((response) => response.url().endsWith('/progress') && response.request().method() === 'DELETE');
      await page.getByRole('button', { name: 'Học lại', exact: true }).click();
      expect((await reset).ok()).toBeTruthy();
      await expect(page.getByText('Thẻ 1 / 3', { exact: true })).toBeVisible();
      await expect(flip).toHaveAttribute('aria-pressed', 'false');
      await flip.click();
      const shuffled = page.waitForResponse((response) => response.url().endsWith('/progress') && response.request().method() === 'DELETE');
      await page.getByRole('button', { name: 'Xáo trộn', exact: true }).click();
      expect((await shuffled).ok()).toBeTruthy();
      await expect(flip).toHaveAttribute('aria-pressed', 'false');
      await page.reload();
      await expect(page.getByText('Thẻ 1 / 3', { exact: true })).toBeVisible();
    });

    await test.step('Sửa thẻ qua UI, xóa bộ thẻ tạm và đăng xuất', async () => {
      await page.getByRole('link', { name: 'Bộ thẻ của tôi', exact: true }).click();
      await page.getByRole('link').filter({ has: page.getByRole('heading', { name: title, exact: true }) }).click();
      await page.getByRole('link', { name: 'Sửa', exact: true }).click();
      await expect(page.getByLabel('Định nghĩa', { exact: true }).first()).toHaveValue(cards[0].back);
      await page.getByLabel('Định nghĩa', { exact: true }).first().fill('Đã sửa: \\(c=\\sqrt{a^2+b^2}\\)');
      await page.getByRole('button', { name: 'Lưu Study Set', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/study-sets/${studySetId}$`));
      await expect(page.locator('li .math-content').filter({ hasText: 'Đã sửa:' })).toHaveCount(1);
      page.once('dialog', (dialog) => void dialog.accept());
      await page.getByRole('button', { name: 'Xóa', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
      studySetId = undefined;
      await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem('flashlearn_token'))).toBeNull();
      expect(runtimeErrors).toEqual([]);
      expect(apiErrors).toEqual([]);
    });
  } finally {
    // Only deletes the unique set created by this run, including after a failed assertion.
    if (studySetId && token) {
      const cleanup = await request.delete(`${apiBaseURL}/study-sets/${studySetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect([200, 404]).toContain(cleanup.status());
    }
  }
});
