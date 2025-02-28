import { extractDomain, urlContainsDomain } from "./url";

describe("extractDomain", () => {
  test("should extract domain from URLs with protocol", () => {
    expect(extractDomain("https://www.example.com")).toBe("example.com");
    expect(extractDomain("http://example.com")).toBe("example.com");
    expect(extractDomain("https://example.com/path/to/page")).toBe("example.com");
    expect(extractDomain("https://example.com?query=1")).toBe("example.com");
  });

  test("should extract domain from URLs without protocol", () => {
    expect(extractDomain("www.example.com")).toBe("example.com");
    expect(extractDomain("example.com")).toBe("example.com");
    expect(extractDomain("example.com/path/to/page")).toBe("example.com");
  });

  test("should handle subdomains correctly", () => {
    expect(extractDomain("https://subdomain.example.com")).toBe("example.com");
    expect(extractDomain("app.service.example.com")).toBe("example.com");
  });

  test("should handle country-specific domains", () => {
    expect(extractDomain("https://example.co.uk")).toBe("example.co.uk");
    expect(extractDomain("https://example.com.au")).toBe("example.com.au");
    expect(extractDomain("https://subdomain.example.co.uk")).toBe("example.co.uk");
  });

  test("should handle edge cases", () => {
    expect(extractDomain("")).toBeNull();
    expect(extractDomain(null)).toBeNull();
    expect(extractDomain(undefined)).toBeNull();
    expect(extractDomain("   ")).toBeNull();
    expect(extractDomain("localhost")).toBe("localhost");
    expect(extractDomain("192.168.1.1")).toBe("192.168.1.1");
  });
});

describe("urlContainsDomain", () => {
  test("should correctly identify if URL contains domain", () => {
    expect(urlContainsDomain("https://www.example.com", "example.com")).toBe(true);
    expect(urlContainsDomain("https://subdomain.example.com", "example.com")).toBe(true);
    expect(urlContainsDomain("https://example.com/path", "example.com")).toBe(true);
    expect(urlContainsDomain("https://example.org", "example.com")).toBe(false);
  });

  test("should handle partial domain matches", () => {
    expect(urlContainsDomain("https://example.com", "exam")).toBe(false); // Should not match partial domains
    expect(urlContainsDomain("https://example.com", "example")).toBe(false); // Should not match partial domains
    expect(urlContainsDomain("https://myexample.com", "example.com")).toBe(false); // Different domains
  });

  test("should handle edge cases", () => {
    expect(urlContainsDomain("", "example.com")).toBe(false);
    expect(urlContainsDomain(null, "example.com")).toBe(false);
    expect(urlContainsDomain(undefined, "example.com")).toBe(false);
    expect(urlContainsDomain("https://example.com", "")).toBe(false);
  });
});
