import { expect, test } from "@playwright/test";

const apiURL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8080/api";

test.describe("Fluxo principal", () => {
  test("faz login e reconciliacao com sucesso", async ({ page }) => {
    await page.route(`${apiURL}/login`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ token: "fake-jwt-token" }),
      });
    });

    await page.route(`${apiURL}/reconcile`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reconciled_values: [160.11, 79.55, 80.56, 19.87, 60.24],
          corrections: [-0.89, 0.55, 0.56, -0.13, -2.76],
          consistency_status: "Consistente",
        }),
      });
    });

    await page.goto("/login");

    await page.getByLabel("Usuário").fill("operator");
    await page.getByLabel("Senha").fill("operator123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/");
    await page.getByTestId("reconcile-button").click();

    await expect
      .poll(async () =>
        page.evaluate(() => JSON.parse(localStorage.getItem("reconciliationData") || "[]"))
      )
      .toHaveLength(1);

    await expect(page.getByText("Valores de Correção")).toBeVisible();
    await expect(page.getByText("1")).toBeVisible();
    await expect(page.getByText("-0.89")).toBeVisible();
  });
});
