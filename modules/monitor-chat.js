var config = require('../config');
var spamKickMessage = config.module_monitor_chat.spam_message;
var util = require('util');
var dbUtil = require('../databaseUtil');

const error_reporter_name = "monitor-chat";
const teamspeak_channel_name_max_length = 40;

module.exports = {
    start: function (herggubot) {
        this.bot = herggubot;
        this.ts3api = herggubot.ts3api;
        this.database = herggubot.database;
        console.log("Module monitor-chat loaded!");
    },
    checkIfSpamming : function(clientId){
        var spamTimeFrame = config.module_monitor_chat.spam_timeframe; //ms
        var spamLimit = config.module_monitor_chat.spam_limit; //messages
        this.ts3api.getClientById(clientId,function(error,data){
            if(error){
                var errormessage = "Failed to check databaseid for client " + clientId + " Error: " + util.inspect(error);
                dbUtil.logError(errormessage,error_reporter_name);
            }else{
                var checkDate = new Date();
                checkDate.setTime(checkDate.getTime() - spamTimeFrame);
                this.database.all("SELECT * FROM serverchatlog WHERE date > ? AND databaseid = ? ;",checkDate,data.client_database_id,function(err, rows) {
                    if(rows.length >= spamLimit){
                        this.bot.logAction("Client " + data.client_database_id + " has been found guilty of spamming.");
                        //TODO: Check if recently kicked
                        if(config.module_monitor_chat.ban_punish){

                            this.ts3api.banClientFromServer(clientId,spamKickMessage,config.module_monitor_chat.ban_length,function(error,data){
                                if(error){
                                    var errormessage = "Error while trying to ban spammer " + clientId + " Reason: " + util.inspect(error);
                                    dbUtil.logError(errormessage,error_reporter_name);
                                }
                            });
                        }else{
                            this.ts3api.kickClientFromServer(clientId,spamKickMessage,function(error,data){
                                if(error){
                                    var errormessage = "Error while trying to kick spammer " + clientId + " Reason: " + util.inspect(error);
                                    dbUtil.logError(errormessage,error_reporter_name);
                                }
                            });
                        }
                        
                    }
                }.bind(this));
            }
        }.bind(this));

    },
    onChatMessage: function (data) {
        var command = data.msg.split(" ")[0];
        switch(data.targetmode){
            case 3: //Server chat
                switch(command){
                    case "!whoami":
                        if(config.tessu_stats_integration.enabled){
                            this.ts3api.getClientById(data.invokerid,function(error,clientData){
                                if(error){
                                    var errormesasge = "Failed to check databaseid for client " + data.invokerid + " Error: " + util.inspect(error);
                                    dbUtil.logError(errormessage,error_reporter_name);
                                }else{
                                    var tessustats_url = "[url=" + config.tessu_stats_integration.site_root + "#/user/" + clientData.client_database_id + "]Here you go![/url]";
                                    this.ts3api.sendServerMessage(tessustats_url,function(error,response){
                                        if(error){
                                            var errormessage = "Failed to send server message. Error: " + util.inspect(error);
                                            dbUtil.logError(errormessage,error_reporter_name);
                                        }else{

                                        }
                                    }.bind(this));
                                }
                            }.bind(this));
                        }
                        break;
                }
                this.bot.logServerChat(data.invokerid,data.msg,data.invokername);
                this.checkIfSpamming(data.invokerid);
            break;
        }
    },
    share : function() {
        var object = {
            module: "monitor-chat",
            spamMessage: spamKickMessage
        };
        return object;
    }
};