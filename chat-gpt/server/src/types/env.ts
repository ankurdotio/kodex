export type AppEnv = {
  port: number;
  mongoUri: string;
  nodeEnv: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  refreshCookieName: string;
  mistralApiKey: string;
  tvlyApiKey: string;
};
