/**
 * Extracts the domain from a URL
 * @param url The URL to extract the domain from
 * @returns The domain portion of the URL
 */
export function extractDomain(url: string | null | undefined): string {
  try {
    if (!url) return "";
    // Handle URLs with or without protocol
    const urlObj = new URL(url.startsWith("http") ? url : `http://${url}`);
    return urlObj.hostname;
  } catch (error) {
    // If URL parsing fails, try a basic regex approach
    const match = url?.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/i);
    return match ? match[1] : "";
  }
}

/**
 * Extracts the domain from a URL.
 *
 * @param url - The URL to extract the domain from
 * @returns The domain or null if the URL is invalid or empty
 *
 * Examples:
 * - https://www.example.com/path -> example.com
 * - http://subdomain.example.co.uk/path?query=1 -> example.co.uk
 * - example.com -> example.com
 * - www.example.com -> example.com
 * - null or "" -> null
 */
export function extractDomainWindows(url: string | null | undefined): string | null {
  if (!url) return null;

  url = url.trim().toLowerCase();
  if (url.length === 0) return null;

  // Check if it's an IP address
  const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (ipRegex.test(url)) {
    return url;
  }

  try {
    // Try to parse as a URL with protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Remove www. prefix if present
    const domain = hostname.startsWith("www.") ? hostname.substring(4) : hostname;

    // If it's just a hostname like 'localhost', return it
    if (!domain.includes(".")) {
      return domain;
    }

    // Extract the base domain (e.g., example.com from subdomain.example.com)
    const parts = domain.split(".");

    // Handle special cases like co.uk, com.au, etc.
    if (parts.length > 2) {
      const tld = parts[parts.length - 1];
      const sld = parts[parts.length - 2];

      // Check for country-specific second-level domains
      if (
        (tld.length === 2 && sld.length <= 3) ||
        ["com", "org", "net", "gov", "edu"].includes(sld)
      ) {
        return `${parts[parts.length - 3]}.${sld}.${tld}`;
      }
    }

    // Return domain.tld (e.g., example.com)
    if (parts.length >= 2) {
      return parts.slice(-2).join(".");
    }

    return domain;
  } catch (error) {
    // If URL parsing fails, try a simple regex approach
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)(?:\/|$)/i);
    if (match && match[1]) {
      const simpleDomain = match[1].toLowerCase();
      return simpleDomain;
    }

    // If all else fails, return the original string (might be just a domain)
    return url;
  }
}

/**
 * Tests if a URL contains a specific domain.
 *
 * @param url - The URL to check
 * @param domain - The domain to look for
 * @returns True if the URL contains the domain, false otherwise
 */
export function urlContainsDomain(url: string | null | undefined, domain: string): boolean {
  if (!url || !domain) return false;

  const extractedDomain = extractDomain(url);
  if (!extractedDomain) return false;

  // Exact match
  if (extractedDomain === domain) return true;

  // Check if domain is a subdomain of extractedDomain
  if (extractedDomain.endsWith("." + domain)) return true;

  // Check if extractedDomain is a subdomain of domain
  if (domain.endsWith("." + extractedDomain)) return true;

  return false;
}
