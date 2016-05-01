var config = require('../config');
var util = require('util');
var dbUtil = require('../databaseUtil');

const error_reporter_name = "module-mute-user";


module.exports = {
    start: function (herggubot) {
        this.bot = herggubot;
        this.ts3api = herggubot.ts3api;
        this.database = herggubot.database;
        this.checkExpiredMutes();
        console.log("Module mute-user loaded!");
    },
    share: function () {
    	return {
			module: "mute-user"
        };
    },
    onChatMessage: function (data) {
    	var command = data.msg.split(" ")[0];
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
                    if (err)
                        return callback(err);
                    if (target.client_servergroups == config.module_mute_user.muted_server_group) return callback("User is already muted.");
                    this.ts3api.addClientServerGroup(target.client_database_id, config.module_mute_user.muted_server_group, function (err) {
                        if (err) return callback(err);
                        //Calculate expiration date
                        var expireDate = new Date();
                        expireDate = new Date(expireDate.getTime() + 1000 * length);
                        //Insert into database
                        this.database.run("INSERT INTO mutedusers (expires,databaseid,username) values (?,?,?);",
                            expireDate, target.client_database_id, target.client_nickname);
                        this.ts3api.sendClientMessage(targetUser.clid,
                            "\n[B][COLOR=#ff0000]You have been muted from the server chat.[/COLOR][/B]\nReason: " + message + "\nYour mute will expire in: [B]" + length + "[/B] seconds.");
                        // Log action
                        dbUtil.logAction("Muted " + util.inspect(targetUser) + " for " + length + " seconds.");
                        callback();
                    }.bind(this));
                }.bind(this));
             } else {
                callback("Couldn't find exact match for user " + targetName);
             }
        }.bind(this));
    },
    unMuteUser: function (targetDatabaseId, callback) {
        this.ts3api.removeClientServerGroup(targetDatabaseId, config.module_mute_user.muted_server_group, function (err) {
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
                    //Log action
                    dbUtil.logAction("Unmuted " + util.inspect(targetUser));
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
        var muteLength = config.module_mute_user.mute_length;
        if (parts.length > 2)
            muteLength = parseInt(parts[2]);
        var muteReason = config.module_mute_user.mute_reason_msg;
        if (parts.length > 3)
            muteReason = parts.slice(3, parts.length).join(" "); //Convert rest of arguments to reason message
        this.bot.isClientAdmin(data.invokerid, function (err, adminStatus) {
            if (err)
                return this.ts3api.sendClientMessage(data.invokerid, "Failed to check invoker's admin status. Error: " + util.inspect(err));
            if (adminStatus) {
                this.muteUser(targetName, muteLength, muteReason, function (err) {
                    if (err)
                        this.ts3api.sendClientMessage(data.invokerid, "Failed to !mute user " + targetName + ". Error: " + util.inspect(err));
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
        this.bot.isClientAdmin(data.invokerid, function (err, adminStatus) {
            if (err) return this.ts3api.sendClientMessage(data.invokerid, "Failed to check invoker's admin status. Error: " + util.inspect(err));
            this.ts3api.getClientsByName(targetName, function (err, result) {
                if (err) return this.ts3api.sendClientMessage(data.invokerid, "Error finding user " + targetName + ". Error: " + util.inspect(err));
                var targetUser = null;
                //Loop through results looking for an exact match in case getClientsByName returns multiple
                result.forEach(function (r) {
                   if (r.client_nickname == targetName)
                       targetUser = r;
                });
                if (targetUser) {
                    this.ts3api.getClientById(targetUser.clid, function (err, client) {
                        if (err) return this.ts3api.sendClientMessage(data.invokerid, "Error getting user with id " + targetUser.clid + ". Error: " + util.inspect(err));
                        this.unMuteUser(client.client_database_id, function (err) {
                            if (err) {
                                this.ts3api.sendClientMessage(data.invokerid, "Error unmuting user " + targetName + ". Error: " + util.inspect(err));
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
            return callback(err, rows);
        });
    },
    checkExpiredMutes: function () {
        this.getMutedUsers(function (err, entries) {
            if (err) {
            	console.error(err);
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
    }
}