var config = require('../config');
var util = require('util');
var async = require("async");
var dbUtil = require('../databaseUtil');

const error_reporter_name = "module-admin-tools";

module.exports = {
    lastInactiveClients: [],
    start: function (herggubot) {
        this.bot = herggubot;
        this.ts3api = herggubot.ts3api;
        this.database = herggubot.database;
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
            case "!clid":
                this.handleGetClientByIdCommand(data);
                break;
            case "!inactive_channels":
                this.handleGetInactiveChannelsCommand(data);
                break;
            case "!help":
                this.handleHelpCommand(data);
                break;
        }
    },
    handleGetInactiveUsersCommand: function (invokerId) {
        var self = this;
        function createOutputStrings(users) {
            //outputs holds all the 1024 char sized response blocks
            var outputs = [];
            var outputString = ["\n\n[B]Inactive clients:[/B]\n", "ID\t|\tUsername\t|\tReason", "-------------------------------------"];
            users.forEach(function (user) {
                var rowString = user.clid + "\t" + self.createClientLink(user)  + "\t" + user.reason;
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
                return self.ts3api.sendClientMessage(invokerId, "Failed to get inactive users. Error: " + util.inspect(err));
            self.lastInactiveClients = users;
            createOutputStrings(users).forEach(function (output) {
                self.ts3api.sendClientMessage(invokerId, output);
            });
        });
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
                if (err && err.id == this.ts3api.errors.INVALID_CLIENT_ID)
                    return callback();
                dbUtil.logAction("Kicked " + client.client_nickname + " [" + client.client_database_id + "] (" + client.connection_client_ip + ") for being inactive (" + kickMessage + ")");
                callback(err);
            }.bind(this));
        }.bind(this), function (err) {
            if (err)
                return ts3api.sendClientMessage(data.invokerid, "Failed to kick inactive users. Error: " + util.inspect(err));
            this.ts3api.sendClientMessage(data.invokerid, "Successfully kicked inactive users from server.");
        }.bind(this));
    },
    handleGetClientByIdCommand: function (data) {
        var self = this;
        function createOutputString(clients) {
            var outputString = ["\n\n[B]Requested clients:[/B]\n", "ID\t|\tUser", "-------------------------------------"];
            clients.forEach(function (client) {
                var rowString = client.clid + "\t" + self.createClientLink(client);
                outputString.push(rowString);
            });
            return outputString.join("\n");
        }

        var parts = data.msg.split(" ").slice(1);
        if (parts.length != 1)
            return this.ts3api.sendClientMessage(data.invokerid, "Wrong syntax, usage: !clid [clids]");
        var clientIds = parts[0].split(",");
        async.map(clientIds, function (clid, callback) {
            self.ts3api.getClientById(clid, function (err, client) {
                callback(err, client);
            });
        }, function (err, clients) {
            if (err) return self.ts3api.sendClientMessage(data.invokerid, "Error finding clients. Error: " + util.inspect(err));
            self.ts3api.sendClientMessage(data.invokerid, createOutputString(clients));
        });
    },
    handleGetInactiveChannelsCommand: function (data) {
        function createOutputString(channels) {
            var outputString = ["\n\n[B]Inactive channels:[/B]\n", "Days\t|\tChannel name", "-------------------------------------"];
            channels.forEach(function (channel) {
                var daysInactive = Math.floor(channel.seconds_empty / 24 / 60 / 60);
                var rowString = daysInactive + "\t[B]" + channel.channel_name + "[/B]";
                outputString.push(rowString);
            });
            return outputString.join("\n");
        }
        var parts = data.msg.split(" ").slice(1);
        var minInactiveMs = 60 * 60 * 24 * 7 * 1000; // 7 days
        if (parts.length == 1) {
            minInactiveMs = 60 * 60 * 24 * 1000 * parseInt(parts[0]); // Parse day amount from command
        } else if (parts.length > 1) {
            this.ts3api.sendClientMessage(data.invokerid, "Wrong syntax, usage: !inactive_channels [min_days_inactive]");
            return;
        }
        this.ts3api.sendClientMessage(data.invokerid, "Finding inactive channels.");
        this.getInactiveChannels(minInactiveMs, function (err, inactiveChannels) {
            if (err) return this.ts3api.sendClientMessage(data.invokerid, "Error getting inactive channels. Error: " + util.inspect(err));
            console.log("Found " + inactiveChannels.length + " channels");
            var output = createOutputString(inactiveChannels);
            this.ts3api.sendClientMessage(data.invokerid, output);
        }.bind(this));
    },
    handleHelpCommand: function (data) {
        var output = [
            "\n\nAvailable commands for module: [B]admin-tools[/B]:\n",
            "[B]!afks[/B] - Returns a list of inactive clients on the server.",
            "[B]!afks_kick[/B] - Kicks all of the inactive clients. Requires !afks to be ran before it, you can whitelist people with the --ignore=[clids] parameter. Eg. --ignore=5,4",
            "[B]!inactive_channels[/B] - Returns all the channels that have been inactive for X amount of days. Eg. !inactive_channels 7",
            "[B]!clid[/B] - Returns the client links of given comma seperated client id list."
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
                            if (err.id == self.ts3api.errors.INVALID_CLIENT_ID)
                                return callback();
                            else
                                return callback(err);
                        }
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
                        client.reason = "Speakers muted and idle for " + formatIdleTime(idleTime);
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
    },
    getInactiveChannels: function (minInactiveMs, callback) {
        var self = this;
        self.ts3api.getChannelList(function (err, list) {
            if (err) return callback(err);
            async.map(list, function (channel, callback) {
                self.ts3api.getChannelById(channel.cid, function (err, fullChannel) {
                    callback(err, fullChannel);
                });
            }, function (err, channels) {
                if (err) return callback(err);
                var inactiveChannels = channels.filter(function (channel) {
                    return channel.seconds_empty * 1000 >= minInactiveMs;
                });
                inactiveChannels.sort(function (a, b) {
                    return b.seconds_empty - a.seconds_empty;
                });
                callback(null, inactiveChannels);
            });
        });
    },
    createClientLink: function (client) {
        //Replace spaces in name
        return "[URL=client://" + client.clid + "/" + client.client_unique_identifier + "~" + client.client_nickname.replace(/ /g, "") + "]" + client.client_nickname + "[/URL]";
    }
};
