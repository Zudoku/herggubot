var config = {};

config.VIRTUAL_SERVER_ID = 1;
config.TS_IP = "osusearch.com";
config.DATABASE_PATH = 'botdatabase';
config.SERVERQUERY_USERNAME = "Rivenation";
config.SERVERQUERY_PASSWORD = "GnevPgly";
config.QUERY_TIME_LIMIT = 1;
config.NICKNAME = "HerGGuBot";
config.resetDatabase = false;

config.DEBUG_NETWORK = false;
config.launchBotOnStartUp = true;
//------------------------------------
// MODULES
//------------------------------------
config.module_monitor_chat = {
	enabled: true,
	spam_message : "Please do not spam the server chat.",
	spam_limit: 4,
	spam_timeframe: 5000
};

config.module_monitor_channel_slots = {
	enabled: true,
	channel_delete_time: 5
};

config.module_extra_logs = {
	enabled: true
};

config.module_web_interface = {
	enabled: true,
	port: 9090
};

module.exports = config;
