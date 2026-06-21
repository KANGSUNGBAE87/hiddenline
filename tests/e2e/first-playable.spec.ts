import { expect, test } from "@playwright/test";
import type { GeneratedPath } from "../../src/game/types";

const mobileViewports = [
  { width: 390, height: 844 },
  { width: 360, height: 740 },
  { width: 430, height: 932 },
];

for (const viewport of mobileViewports) {
  test(`Home to Play renders nonblank canvas at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "오늘의 숨은선" })).toBeVisible();
    await page.getByRole("button", { name: "오늘의 선 시작하기" }).click();

    await expect(page.getByText("시작점에 손가락을 올려보세요")).toBeVisible();
    const canvas = page.getByTestId("game-canvas");
    await expect(canvas).toBeVisible();

    const nonblank = await canvas.evaluate((node) => {
      const canvasElement = node as HTMLCanvasElement;
      const context = canvasElement.getContext("2d");
      if (!context || canvasElement.width === 0 || canvasElement.height === 0) return false;
      const sampleWidth = Math.min(80, canvasElement.width);
      const sampleHeight = Math.min(80, canvasElement.height);
      const data = context.getImageData(0, 0, sampleWidth, sampleHeight).data;
      for (let index = 0; index < data.length; index += 4) {
        if (data[index] !== 0 || data[index + 1] !== 0 || data[index + 2] !== 0 || data[index + 3] !== 0) {
          return true;
        }
      }
      return false;
    });

    expect(nonblank).toBe(true);
  });
}

test("dev-only success helper reaches Result screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?qa=success");

  await expect(page.getByRole("heading", { name: "오늘의 선을 완주했어요" })).toBeVisible();
  await expect(page.getByText("점수", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 도전" })).toBeVisible();
});

test("scripted pointer trace can complete a real Daily run", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "오늘의 선 시작하기" }).click();

  const canvas = page.getByTestId("game-canvas");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const path = await page.evaluate(() => window.__HIDDEN_LINE_QA_PATH__ as GeneratedPath | undefined);
  expect(path).toBeTruthy();

  function toScreen(point: { x: number; y: number }) {
    return {
      x: box!.x + (point.x / path!.viewport.width) * box!.width,
      y: box!.y + (point.y / path!.viewport.height) * box!.height,
    };
  }

  const start = toScreen(path!.start);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let index = 1; index < path!.points.length; index += 1) {
    await page.waitForTimeout(80);
    const point = toScreen(path!.points[index]);
    await page.mouse.move(point.x, point.y);
  }
  const end = toScreen(path!.end);
  await page.mouse.move(end.x, end.y);

  await expect(page.getByRole("heading", { name: "오늘의 선을 완주했어요" })).toBeVisible();
});

test("live play loop fails a stalled Daily run", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "오늘의 선 시작하기" }).click();

  const canvas = page.getByTestId("game-canvas");
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();

  const path = await page.evaluate(() => window.__HIDDEN_LINE_QA_PATH__ as GeneratedPath | undefined);
  expect(path).toBeTruthy();

  const start = {
    x: box!.x + (path!.start.x / path!.viewport.width) * box!.width,
    y: box!.y + (path!.start.y / path!.viewport.height) * box!.height,
  };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await expect(page.getByText("조용히 선을 이어가세요")).toBeVisible();
  await expect(page.getByRole("heading", { name: "여기까지 따라왔어요" })).toBeVisible({ timeout: 2600 });
  await expect(page.getByText("움직임이 오래 멈췄어요")).toBeVisible();
});
