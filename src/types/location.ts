export interface LocationData {
  key: string;
  siteId: string;
  siteName: string;
  owner: string;
  label: string;
  x: number;
  y: number;
  projection?: string;
  ismobile: boolean;
  status: string;
  averagingIntervalSeconds?: number;
  loggingIntervalSeconds?: number;
}