import { extractUrlFromBrowserTitle } from "./extractUrlFromBrowserTitle";

describe("extractUrlFromBrowserTitle", () => {
  it("extracts domain from basic title format", () => {
    const result = extractUrlFromBrowserTitle(
      "Sign up | Miro | The Visual Workspace for Innovation - Google Chrome",
      "Google Chrome"
    );
    expect(result).toBe("miro.com");
  });
});
