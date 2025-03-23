export type OnClassify = (params: {
  ruleId: string | null;
  appName: string;
  domain: string | null;
  activityId: number | null;
  isProductive: boolean;
}) => void;
