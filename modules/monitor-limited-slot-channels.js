var ts3api = require("../ts3api");
var async = require("../async");

module.exports = {
    start: function (herggubot) {
        this.bot = herggubot;
    },
    monitorLimitedSlotChannels: function () {
        getInitialLimitedSlotChannels(function (err, channels) {
            if (err)
                return console.log(err);
            this.limitedSlotChannels = channels;
            setInterval(function () {

            }.bind(this), 1000);
        }.bind(this));
    },
    function checkLimitedSlotChannels: function (callback) {
        async.forEach(this.limitedSlotChannels, function (channel, callback) {
            ts3api.getClientsInChannel(channel.channelId, function (err, clients) {
                if (clients.length == channel.usedSlots && sameSince < ) {

                }
            });
        }, function (err) {

        });
    },
    function getInitialLimitedSlotChannels (callback) {
        ts3api.getChannelsByName("(Max.", function (error, channels) {
            if (error)
                return console.log("Failed to monitor limited slot channels, error while getting channels by name. " + util.inspect(error));
            var limitedSlotChannels = [];
            async.forEach(channels, function (channel, callback) {
                var maxSlots = parseInt(/\(Max\. ([0-9])\)/.exec(channel.channel_name));
                ts3api.getClientsInChannel(channel.cid, function (error, clients) {
                    if (error)
                        return callback("Failed to monitor limited slot channels, error while getting clients in channel: " + channel.cid + " " + util.inspect(error));
                    limitedSlotChannels.push({
                        channelId: channel.cid,
                        maxSlots: maxSlots,
                        usedSlots: clients.length,
                        sameSince: new Date()
                    });
                    callback();
                });
            }, function (err) {
                if (err)
                    return console.log(err);
                callback(limitedSlotChannels);
            }.bind(this));
        }.bind(this));
    }
};