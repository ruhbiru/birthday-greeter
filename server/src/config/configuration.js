const dotenv = require("dotenv");
dotenv.config();

const configFactory = () => ({
  logger: {
    console: {
      level: "silly",
      colorize: true,
      timestamp: true,
      json: false,
    },
  },
  db: {
    dialect: "mysql",
    dialectOptions: { decimalNumbers: true },
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 3306,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: "assessment-test",
    logging: process.env.DATABASE_LOGGING_ENABLED === "true",
  },
  birthdayGreeterSend: {
    job: {
      repeat: {
        cron: "*/15 * * * *", // Runs every 15 minutes because there is a 15-minute timezone difference
      },
    },
    mailProviderUrl: "https://email-service.digitalenvision.com.au/send-email",
    scheduledSendTime: "09:00",
    retryDelay: 300, // in seconds (30 minutes)
    retryPeriod: 1440, // in minutes (1 day)
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS_ENABLED === "true" && {},
  },
  httpRequest: {
    timeout: 30000,
    maxRedirects: 5,
  },
  queue: {
    maxStalledCount: 3,
  },
});

module.exports = configFactory;
