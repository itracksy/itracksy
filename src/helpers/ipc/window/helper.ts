export const extractUrlFromBrowserTitle = (title: string, browserName: string): string => {
  if (!title) return "";

  // Remove browser name and any preceding separator (-, |) with optional spaces
  const cleanTitle = title.replace(new RegExp(`\\s*[-|]?\\s*${browserName}\\s*$`), "").trim();
  const patterns = [
    /(?:[-|]\s*)?((?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})))/i,
    /(?:at\s+)((?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*(?:\.[a-zA-Z]{2,})))/i,
  ];

  for (const pattern of patterns) {
    const match = cleanTitle.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Handle Windows-style cleanTitles without TLD
  const commonDomains = ["youtube", "facebook", "twitter", "instagram", "miro", "github"];
  for (const domain of commonDomains) {
    if (cleanTitle.toLowerCase().includes(domain)) {
      return `${domain}.com`;
    }
  }

  return cleanTitle;
};
