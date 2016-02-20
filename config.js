var config = {};

config.virtual_server_id = 1; 
config.ts_ip = "ExampleTSIP";
config.serverquery_username = "ExampleUsername";
config.serverquery_password = "ExamplePassword";

config.nickname = "HerGGuBot";

config.reset_database = false;
config.database_path = "botdatabase";
config.debug_network = false;
config.wrapper_restart_time = 10;

config.launch_bot_in_startup = true;
//------------------------------------
// MODULES
//------------------------------------
config.module_monitor_chat = {
    enabled: true,
    spam_message : "Please do not spam the server chat.",
    ban_punish: true,
    ban_length: 60,
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