var config = require('../config');
var spamKickMessage = config.module_monitor_chat.spam_message;
var util = require('util');

module.exports = {
    start: function (herggubot) {
        this.bot = herggubot;
        this.ts3api = herggubot.ts3api;
        this.database = herggubot.database;
        module.exports.monitorChat();
        console.log("Module monitor-chat loaded!");
    },
    checkIfSpamming : function(clientId){
        var spamTimeFrame = config.module_monitor_chat.spam_timeframe; //ms
        var spamLimit = config.module_monitor_chat.spam_limit; //messages
        this.ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to check databaseid for client " + clientId + " Error: " + util.inspect(error));
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
                                    console.log("Error while trying to ban spammer " + clientId + " Reason: " + error);
                                    this.bot.logAction("Error while trying to ban spammer " + clientId + " Reason: " + error);
                                }
                            });
                        }else{
                            this.ts3api.kickClientFromServer(clientId,spamKickMessage,function(error,data){
                                if(error){
                                    console.log("Error while trying to kick spammer " + clientId + " Reason: " + error);
                                    this.bot.logAction("Error while trying to kick spammer " + clientId + " Reason: " + error);
                                }
                            });
                        }
                        
                    }
                }.bind(this));
            }
        }.bind(this));

    },
    monitorChat : function(){
        this.ts3api.registerListener("textmessage",function(data){
            switch(data.targetmode){
                case 3: //Server chat
                    if(config.debug_network){
                        console.log("SERVER CHAT: " + data.invokername + " : " + data.msg);
                    }
                    switch(data.msg){

                        case "!whoami":

                            if(config.tessu_stats_integration.enabled){
                                this.ts3api.getClientById(data.invokerid,function(error,clientData){
                                    if(error){
                                        console.log("Failed to check databaseid for client " + data.invokerid + " Error: " + util.inspect(error));
                                    }else{
                                        var tessustats_url = "[url=" + config.tessu_stats_integration.site_root + "#/user/" + clientData.client_database_id + "]Here you go![/url]";
                                        this.ts3api.sendServerMessage(tessustats_url,function(error,response){
                                            if(error){
                                                console.log("Failed to send server message. Error: " + util.inspect(error));
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
                case 1: //Private chat'
                    if(config.debug_network){
                        console.log("PRIVATE CHAT: " + data.invokername + " : " + data.msg);
                    }
                    this.bot.logPrivateChat(data.invokerid,data.msg,data.invokername);
                break;
            }
        }.bind(this));
    },
    share : function() {
        var object = {
            module: "monitor-chat",
            spamMessage: spamKickMessage
        };
        return object;
    }
};