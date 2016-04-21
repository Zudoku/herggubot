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
        module.exports.monitorChat();
        this.checkExpiredMutes();
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
    isUserAdmin: function (userId, callback) {
        this.ts3api.getClientById(userId, function (err, client) {
            if (err) return callback(err);
            callback(null, config.module_monitor_chat.admin_server_groups.indexOf(client.client_servergroups) > -1);
        }.bind(this));
    },
    muteUser: function (targetName, length, message, callback) {
        this.ts3api.getClientsByName(targetName, function (err, result) {
             if (err) return callback(err);
             var targetUser = null;
             //Loop through results looking for an exact match in case getClientsByName returns multiple
             result.forEach(function (r) {
                if (r.client_nickname == targetName)
                    targetUser = r;
             });
             if (targetUser) {
                this.ts3api.getClientById(targetUser.clid, function (err, target) {
                    if (err) return callback(err);
                    if (target.client_servergroups == config.module_monitor_chat.muted_server_group) return callback("User is already muted.");
                    this.ts3api.addClientServerGroup(target.client_database_id, config.module_monitor_chat.muted_server_group, function (err) {
                        if (err) return callback(err);
                        var expireDate = new Date();
                        expireDate = new Date(expireDate.getTime() + 1000 * length);
                        this.database.run("INSERT INTO mutedusers (expires,databaseid,username) values (?,?,?);",
                            expireDate, target.client_database_id, target.client_nickname);
                        this.ts3api.sendClientMessage(targetUser.clid,
                            "\n[B][COLOR=#ff0000]You have been muted from the server chat.[/COLOR][/B]\nReason: " + message + "\nYour mute will expire in: [B]" + length + "[/B] seconds.");
                        callback();
                    }.bind(this));
                }.bind(this));
             } else {
                callback("Couldn't find exact match for user " + targetName);
             }
        }.bind(this));
    },
    unMuteUser: function (targetDatabaseId, callback) {
        this.ts3api.removeClientServerGroup(targetDatabaseId, config.module_monitor_chat.muted_server_group, function (err) {
            if (err) return callback(err);
            this.ts3api.getClientByDbId(targetDatabaseId, function (err, client) {
                if (err) return callback(err);
                this.ts3api.getClientsByName(client.name, function (err, results) {
                    if (err) return callback(err);
                    var targetUser = null;
                    //Loop through results looking for an exact match in case getClientsByName returns multiple
                    results.forEach(function (r) {
                       if (r.client_nickname == client.name)
                           targetUser = r;
                    });
                    if (targetUser) {
                        this.ts3api.sendClientMessage(targetUser.clid, "You have been unmuted and are able to talk in the server chat again.");
                    }
                    this.database.run("DELETE FROM mutedusers WHERE databaseid=?;", targetDatabaseId);
                    callback();
                }.bind(this));
            }.bind(this));
        }.bind(this));
    },
    //Example command: !mute Rivenation 10 Test reason message
    handleMuteCommand: function (data) {
        var parts = data.msg.split(" ");
        if (parts.length < 2)
            return this.ts3api.sendClientMessage(data.invokerid, "Invalid parameters. Usage: !mute <target_name> <duration (s)> <reason>");
        var targetName = parts[1];
        var muteLength = config.module_monitor_chat.mute_length;
        if (parts.length > 2)
            muteLength = parseInt(parts[2]);
        var muteReason = config.module_monitor_chat.mute_reason_msg;
        if (parts.length > 3)
            muteReason = parts.slice(3, parts.length).join(" "); //Convert rest of arguments to reason message
        this.isUserAdmin(data.invokerid, function (err, adminStatus) {
            if (adminStatus) {
                this.muteUser(targetName, muteLength, muteReason, function (err) {
                    if (err)
                        this.ts3api.sendClientMessage(data.invokerid, "Failed to !mute user " + targetName + ". Error: " + err);
                    else
                        this.ts3api.sendClientMessage(data.invokerid, "Successfully muted user " + targetName + " for " + muteLength + " seconds.");
                }.bind(this));
            } else {
                this.ts3api.sendClientMessage(data.invokerid, "You do not have high enough permissions to use this command.");
            }
        }.bind(this));
    },
    handleUnMuteCommand: function (data) {
        var parts = data.msg.split(" ");
        if (parts.length < 2)
            return this.ts3api.sendClientMessage(data.invokerid, "Invalid parameters. Usage: !unmute <target_name>");
        var targetName = parts[1];
        this.isUserAdmin(data.invokerid, function (err, adminStatus) {
            if (err) return this.ts3api.sendClientMessage(data.invokerid, "Failed to check invoker's admin status. Error: " + err);
            this.ts3api.getClientsByName(targetName, function (err, result) {
                if (err) return this.ts3api.sendClientMessage(data.invokerid, "Error finding user " + targetName + ". Error: " + err);
                var targetUser = null;
                //Loop through results looking for an exact match in case getClientsByName returns multiple
                result.forEach(function (r) {
                   if (r.client_nickname == targetName)
                       targetUser = r;
                });
                if (targetUser) {
                    this.ts3api.getClientById(targetUser.clid, function (err, client) {
                        if (err) return this.ts3api.sendClientMessage(data.invokerid, "Error getting user with id " + targetUser.clid + ". Error: " + err);
                        this.unMuteUser(client.client_database_id, function (err) {
                            if (err) {
                                this.ts3api.sendClientMessage(data.invokerid, "Error unmuting user " + targetName + ". Error: " + err);
                            } else {
                                this.ts3api.sendClientMessage(data.invokerid, "Successfully unmuted user " + targetName + ".");
                            }
                        }.bind(this));
                    }.bind(this));
                }
            }.bind(this));
        }.bind(this));
    },
    handleMutedUsersCommand: function (data) {
        this.getMutedUsers(function (err, entries) {
            if (err) return this.ts3api.sendClientMessage(data.invokerid, "Failed to get muted users from database. Error: " + err);
            var responseText = ["\n\n[B]Clients currently muted from the server chat:[/B]\n", "Username\t|\tExpires\t|\tID"];
            entries.forEach(function (entry) {
                var d = new Date(entry.expires);
                var lengthText = Math.floor((d.getTime() - new Date().getTime()) / 1000) + "s";
                responseText.push(entry.username + "\t" + lengthText + "\t" + entry.databaseid);
            });
            responseText = responseText.join("\n");
            if (responseText.length < 1024) {
                this.ts3api.sendClientMessage(data.invokerid, responseText);
            } else { //Handle edge case of list being too long for 1 message.
                var textChunk = "";
                responseText.split("\n").forEach(function (row) {
                    if (textChunk.length + row.length < 1024) {
                        textChunk += row + "\n";
                    } else {
                        this.ts3api.sendClientMessage(data.invokerid, textChunk);
                        textChunk = row + "\n";
                    }
                }.bind(this));
            }
        }.bind(this));
    },
    getMutedUsers: function (callback) {
        this.database.all("SELECT * FROM mutedusers;", function(err, rows) {
            callback(err, rows);
        });
    },
    checkExpiredMutes: function () {
        this.getMutedUsers(function (err, entries) {
            if(err){

            } else {
                entries.forEach(function (entry) {
                var d = new Date(entry.expires);
                if (d.getTime() - new Date().getTime() <= 0)
                    this.unMuteUser(entry.databaseid, function (err) {
                        if (err) console.log(err);
                    });
                }.bind(this));
            }
            
            setTimeout(function () {
                this.checkExpiredMutes();
            }.bind(this), 500);
        }.bind(this));
    },
    monitorChat : function(){
        this.ts3api.registerListener("textmessage",function(data){
            var command = data.msg.split(" ")[0];
            switch(data.targetmode){
                case 3: //Server chat
                    if(config.debug_network){
                        console.log("SERVER CHAT: " + data.invokername + " : " + data.msg);
                    }
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
                        case "!mute":
                            this.handleMuteCommand(data);
                            break;
                        case "!unmute":
                            this.handleUnMuteCommand(data);
                            break;
                        case "!mutelist":
                            this.handleMutedUsersCommand(data);
                            break;
                    }
                    this.bot.logServerChat(data.invokerid,data.msg,data.invokername);
                    this.checkIfSpamming(data.invokerid);
                break;
                case 1: //Private chat
                    if(config.debug_network){
                        console.log("PRIVATE CHAT: " + data.invokername + " : " + data.msg);
                    }
                    switch (command) {
                        case "!mute":
                            this.handleMuteCommand(data);
                            break;
                        case "!unmute":
                            this.handleUnMuteCommand(data);
                            break;
                        case "!mutelist":
                            this.handleMutedUsersCommand(data);
                            break;
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