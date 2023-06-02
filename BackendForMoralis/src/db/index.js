const dbConfig = require('./config');
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = dbConfig.url;
db.MoralisApiKeys = require("./MoralisApiKeys.model")(mongoose);

module.exports = db;
