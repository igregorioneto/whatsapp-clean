import * as dotenv from 'dotenv';

const appConfig = dotenv.config({
  path: './app.conf',
});

export const envorimentVariables = {
  port: appConfig.parsed?.PORT,
  saltSecret: appConfig?.parsed.TOKEN,
  mongoose: {
    uri: appConfig?.parsed.MONGODB_URL
  },
  whatsappInstace: {},
  log: {
    level: appConfig?.parsed.LOG_LEVEL,
  },
};
