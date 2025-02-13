const dotenv = require("dotenv");
dotenv.config();

const configuration = require("../../config/configuration");

const env = process.env.NODE_ENV || "development";

const dbConfig = configuration().db;
dbConfig.logging = true;

module.exports = {
  [env]: dbConfig,
};
