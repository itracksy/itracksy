export const TRACKING_INTERVAL = 3000; // 3 seconds
export const LIMIT_TIME_APART = 15 * 60 * 1000; // 15 minutes
export const MERGING_BATCH_SIZE = 3; // 100 records per batch consider with TRACKING_INTERVAL so total time = TRACKING_INTERVAL*MERGING_BATCH_SIZE

export const defaultBlockedDomains = [
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "tiktok.com",
  "reddit.com",
  "youtube.com",
  "netflix.com",
  "discord.com",
  "twitch.tv",
];

export const defaultBlockedApps = [
  "Discord",
  "Slack",
  "Messages",
  "Mail",
  "Facebook",
  "Twitter",
  "Instagram",
  "TikTok",
  "Netflix",
  "Spotify",
  "Steam",
  "Epic Games",
  "Battle.net",
];
