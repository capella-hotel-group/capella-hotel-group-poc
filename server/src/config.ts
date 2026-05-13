import 'dotenv/config';

export interface ProxyConfig {
  turneoApiKey: string;
  turneoBaseUrl: string;
  turneoStoreId: string | undefined;
  port: number;
  allowedOrigins: string[];
}

export function getConfig(): ProxyConfig {
  const turneoApiKey = process.env.TURNEO_API_KEY;
  if (!turneoApiKey) {
    throw new Error('Missing required env var: TURNEO_API_KEY');
  }

  const turneoBaseUrl = process.env.TURNEO_BASE_URL ?? 'https://api.pro.turneo.co';
  const turneoStoreId = process.env.TURNEO_STORE_ID || undefined;
  const port = Number(process.env.PORT) || 3001;
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return { turneoApiKey, turneoBaseUrl, turneoStoreId, port, allowedOrigins };
}
