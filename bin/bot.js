'use strict';

var ambot = require('../lib/ambot.js');

var token = process.env.BOT_API_KEY;
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var ambot_one = new ambot({
    token:token,
    dbPath:dbPath,
    name:name
})

ambot_one.run();
