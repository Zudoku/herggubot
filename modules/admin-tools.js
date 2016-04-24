var config = require('../config');
var util = require('util');
var async = require("async");

module.exports = {
    lastInactiveClients: [],
    start: function (herggubot) {
        this.bot = herggubot;
        this.ts3api = herggubot.ts3api;
        this.database = herggubot.database;
        this.handleGetInactiveUsersCommand(46);
        console.log("Module admin-tools loaded!");
    },
    share: function () {
        return {
            module: "admin-tools"
        };
    },
    onChatMessage: function (data) {
        var command = data.msg.split(" ")[0];
        switch (command) {
            case "!afks":
                this.handleGetInactiveUsersCommand(data.invokerid);
                break;
            case "!afks_kick":
                this.handleKickInactiveUsersCommand(data);
                break;
            case "!help":
                this.handleHelpCommand(data);
                break;
        }
    },
    handleGetInactiveUsersCommand: function (invokerId) {
        function createOutputStrings(users) {
            //outputs holds all the 1024 char sized response blocks
            var outputs = [];
            var outputString = ["\n\n[B]Inactive clients:[/B]\n", "ID\t|\tUsername\t|\tReason", "-------------------------------------"];
            users.forEach(function (user) {
                var userLink = "[URL=client://" + user.clid + "/" + user.client_unique_identifier + "~" + user.client_nickname + "]" + user.client_nickname + "[/URL]";
                var rowString = user.clid + "\t[B]" + userLink  + "[/B]\t" + user.reason;
                var tempArray = outputString.slice();
                tempArray.push(rowString);
                if (tempArray.join("\n").length > 1024) {
                    outputs.push(outputString.join("\n"));
                    outputString = [];
                } else {
                    outputString.push(rowString);
                }
            });
            //if we didn't pass 1024 characters we havent yet pushed the initial block
            if (outputs.length == 0)
                outputs.push(outputString.join("\n"));
            return outputs;
        }
        this.ts3api.sendClientMessage(invokerId, "Finding inactive users, this might take a while...");
        this.getInactiveUsers(function (err, users) {
            if (err)
                return this.ts3api.sendClientMessage(invokerId, "Failed to get inactive users. Error: " + util.inspect(err));
            this.lastInactiveClients = users;
            createOutputStrings(users).forEach(function (output) {
                this.ts3api.sendClientMessage(invokerId, output);
            }.bind(this));
        }.bind(this));
    },
    handleKickInactiveUsersCommand: function (data) {
        if (this.lastInactiveClients.length == 0)
            return this.ts3api.sendClientMessage(data.invokerid, "Failed to kick inactive users, lastInactiveClients doesn't contain anything!");
        var parts = data.msg.split(" ").slice(1);
        var ignoredClientIds = [];
        parts.forEach(function (part) {
            if (part.indexOf("--ignore=") != -1) {
                var ignoreString = part.substring(part.indexOf("--ignore=") + "--ignore=".length)
                ignoredClientIds = ignoreString.split(",").map(function (id) {
                    return parseInt(id);
                });
            }
        });
        var clientsToKick = this.lastInactiveClients.filter(function (client) {
            return ignoredClientIds.indexOf(client.clid) == -1;
        });
        var kickMessage = config.module_admin_tools.inactive_kick_message;
        async.each(clientsToKick, function (client, callback) {
            this.ts3api.kickClientFromServer(client.clid, kickMessage, function (err) {
                callback(err);
            });
        }.bind(this), function (err) {
            if (err)
                return ts3api.sendClientMessage(data.invokerid, "Failed to kick inactive users. Error: " + util.inspect(err));
            this.ts3api.sendClientMessage(data.invokerid, "Successfully kicked inactive users from server.");
        }.bind(this));
    },
    handleHelpCommand: function (data) {
        var output = [
            "\n\nAvailable commands for module: [B]admin-tools[/B]:\n",
            "[B]!afks[/B] - Returns a list of inactive clients on the server.",
            "[B]!afks_kick[/B] - Kicks all of the inactive clients. Requires !afks to be ran before it, you can whitelist people with the --ignore=[clids] parameter. Eg. --ignore=5,4"
        ];
        this.ts3api.sendClientMessage(data.invokerid, output.join("\n"));
    },
    getInactiveUsers: function (callback) {
        var self = this;
        function getDetailedClientsInChannel(channelId, callback) {
            self.ts3api.getClientsInChannel(channelId, function (err, clients) {
                if (err) return callback(err);
                async.map(clients, function (client, callback) {
                    self.ts3api.getClientById(client.clid, function (err, detailedClient) {
                        if (err) {
                            //If we get invalid clientId it means the client isn't on the server anymore and we should ignore it
                            if (err.msg == "invalid clientID")
                                return callback();
                            else
                                return callback(err);
                        }
                        detailedClient.clid = client.clid;
                        callback(err, detailedClient);
                    });
                }, function (err, detailedClients) {
                    callback(err, detailedClients);
                });
            });
        }
        function formatIdleTime(milliseconds) {
            var output = "[B]";
            var minutes = Math.floor((milliseconds / 1000) / 60);
            var hours = Math.floor(minutes / 60);
            minutes -= hours * 60;

            if (hours > 0) {
                output += hours + "h ";
            }
            output += minutes + "min[/B]";
            return output;
        }
        function findSuitableClientsInChannel(channelId, callback) {
            getDetailedClientsInChannel(channelId, function (err, clients) {
                if (err) return callback(err);
                var suitableClients = clients.filter(function (client) {
                    var speakersMuted = client.client_output_muted == 1;
                    var isAway = client.client_away == 1;
                    var timeOnline = client.connection_connected_time; //ms
                    var idleTime = client.client_idle_time; //ms
                    var clientsInChannel = clients.length;

                    //Ignore users in whitelisted server groups
                    if (config.module_admin_tools.inactive_users_servergroup_whitelist.indexOf(client.client_servergroups) != -1) {
                        return false;
                    }
                    //Dont kick people who have been online for less than 10 minutes or have been idle for less than 5 minutes
                    if (timeOnline < 10 * 60 * 1000 || idleTime < 5 * 60 * 1000) {
                        return false;
                    }
                    //If alone in channel
                    if (clientsInChannel == 1) {
                        client.reason = "Alone in channel";
                        return true;
                    } else if (isAway) {
                        client.reason = "Client is set to Away";
                        return true;
                    } else if (speakersMuted && idleTime >= 15 * 60 * 1000) { //Speakers muted and idle for 15 minutes
                        client.reason = "Speakers muted and idle for " + formatIdleTime(idleTiem);
                        return true;
                    } else if (idleTime >= 60 * 60 * 1000) { //Idle for 1 hour
                        client.reason = "Idle for " + formatIdleTime(idleTime);
                        return true;
                    } else {
                        return false;
                    }
                });
                callback(null, suitableClients);
            });
        }
        self.ts3api.getChannelList(function (err, list) {
            var notEmptyChannels = list.filter(function (channel) {
                return channel.total_clients > 0;
            });

            async.map(notEmptyChannels, function (channel, callback) {
                findSuitableClientsInChannel(channel.cid, function (err, clients) {
                    callback(err, clients);
                });
            }, function (err, suitableClients) {
                if (err) return callback(err);
                var flattenedClients = [].concat.apply([], suitableClients);
                callback(null, flattenedClients);
            });
        });
    }
};