import { expect, test } from '@playwright/test';

test('Chèn công thức vào đúng textarea, sửa lựa chọn, hủy và kiểm tra mobile', async ({ page }, testInfo) => {
  const runtimeErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && !['localhost', '127.0.0.1'].includes(new URL(request.url()).hostname)) externalRequests.push(request.url());
  });
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(process.env.E2E_EMAIL ?? 'demo@flashlearn.local');
  await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env.E2E_PASSWORD ?? 'User1234');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('link', { name: '+ Tạo Study Set', exact: true }).click();
  const front = page.getByLabel('Thuật ngữ', { exact: true }).first();
  const back = page.getByLabel('Định nghĩa', { exact: true }).first();
  const dialog = page.getByRole('dialog', { name: 'Chèn công thức', exact: true });
  const openFront = page.getByRole('button', { name: 'Chèn công thức vào Thuật ngữ', exact: true }).first();
  const openBack = page.getByRole('button', { name: 'Chèn công thức vào Định nghĩa', exact: true }).first();
  const insert = dialog.getByRole('button', { name: 'Chèn vào nội dung', exact: true });

  await test.step('Chèn phân số vào giữa câu, giữ mặt sau và đưa con trỏ về sau công thức', async () => {
    await front.fill('Trước  sau');
    await back.fill('Phần định nghĩa giữ nguyên.');
    await front.focus();
    await front.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(6, 6));
    await openFront.click();
    await expect(dialog).toBeVisible();
    await expect(insert).toBeDisabled();
    await dialog.getByRole('button', { name: 'Phân số', exact: true }).click();
    await expect(insert).toBeDisabled();
    await dialog.getByRole('button', { name: '1', exact: true }).click();
    await dialog.getByRole('button', { name: 'Ô tiếp', exact: true }).click();
    await dialog.getByRole('button', { name: '2', exact: true }).click();
    await expect(insert).toBeEnabled();
    await expect(dialog.getByText('Nội dung sau khi chèn', { exact: true })).toBeVisible();
    await expect(dialog.locator('.math-content')).toContainText('Trước');
    await expect(dialog.locator('.math-content')).toContainText('sau');
    await page.screenshot({ path: testInfo.outputPath('math-input-desktop.png') });
    await testInfo.attach('Bàn phím toán trên desktop', { path: testInfo.outputPath('math-input-desktop.png'), contentType: 'image/png' });
    await insert.click();
    await expect(dialog).toHaveCount(0);
    await expect(front).toHaveValue('Trước \\(\\frac12\\) sau');
    await expect(back).toHaveValue('Phần định nghĩa giữ nguyên.');
    await expect(front).toBeFocused();
    expect(await front.evaluate((element: HTMLTextAreaElement) => element.selectionStart)).toBe('Trước \\(\\frac12\\)'.length);
    await expect(page.locator('.katex')).toHaveCount(1);
  });

  await test.step('Chọn công thức đã có để sửa, Hủy/Escape giữ nội dung và selection', async () => {
    await front.evaluate((element: HTMLTextAreaElement) => element.setSelectionRange(6, element.value.length - 4));
    await openFront.click();
    await expect(dialog.locator('math-field')).toHaveJSProperty('value', '\\frac12');
    await expect(dialog.getByRole('button', { name: 'Thay phần đang chọn', exact: true })).toBeEnabled();
    await dialog.getByRole('button', { name: 'Xóa công thức', exact: true }).click();
    await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(front).toHaveValue('Trước \\(\\frac12\\) sau');
    await expect(front).toBeFocused();
    expect(await front.evaluate((element: HTMLTextAreaElement) => [element.selectionStart, element.selectionEnd])).toEqual([6, 'Trước \\(\\frac12\\)'.length]);
    await openFront.click();
    await dialog.locator('math-field').press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(front).toHaveValue('Trước \\(\\frac12\\) sau');
    await openFront.click();
    await dialog.getByRole('button', { name: 'Xóa công thức', exact: true }).click();
    await dialog.getByRole('button', { name: 'Căn bậc hai', exact: true }).click();
    await dialog.getByRole('button', { name: 'x', exact: true }).click();
    await dialog.getByRole('button', { name: 'Bình phương', exact: true }).click();
    await dialog.getByRole('button', { name: 'Thay phần đang chọn', exact: true }).click();
    await expect(front).toHaveValue('Trước \\(\\sqrt{x^2}\\) sau');
  });

  await test.step('Chèn công thức riêng dòng vào Định nghĩa trên mobile, không tràn màn hình', async () => {
    await page.setViewportSize({ width: 375, height: 812 });
    await back.focus();
    await back.press('End');
    await openBack.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('math-field')).toHaveJSProperty('value', '');
    await dialog.getByRole('button', { name: 'Hàm', exact: true }).click();
    await dialog.getByRole('button', { name: 'sin', exact: true }).click();
    await dialog.getByRole('button', { name: 'x', exact: true }).click();
    await dialog.getByLabel('Riêng dòng', { exact: true }).check();
    await expect(insert).toBeEnabled();
    const bounds = await dialog.boundingBox();
    expect(bounds).toBeTruthy();
    expect(bounds!.x).toBe(0);
    expect(bounds!.width).toBe(375);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(812);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('math-input-mobile.png') });
    await testInfo.attach('Bàn phím toán trên mobile', { path: testInfo.outputPath('math-input-mobile.png'), contentType: 'image/png' });
    await insert.click();
    await expect(back).toHaveValue(/Phần định nghĩa giữ nguyên\.\$\$\\sin/);
    await expect(front).toHaveValue('Trước \\(\\sqrt{x^2}\\) sau');
    await expect(page.locator('.katex-display')).toHaveCount(1);
    await expect(back).toBeFocused();
  });

  await test.step('Chặn chèn vượt giới hạn; Enter trong bộ nhập không submit bộ thẻ', async () => {
    await front.fill('a'.repeat(500));
    await openFront.click();
    await dialog.getByRole('button', { name: '1', exact: true }).click();
    await expect(insert).toBeDisabled();
    await expect(dialog.getByText('Nội dung chỉ còn chỗ cho 0 ký tự. Hãy rút gọn công thức.', { exact: true })).toBeVisible();
    await dialog.locator('math-field').press('Enter');
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/study-sets\/new$/);
    await dialog.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(front).toHaveValue('a'.repeat(500));
    expect(runtimeErrors).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
});
