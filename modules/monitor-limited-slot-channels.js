var async = require('async');
var util = require('util');

var TIME_CHANNEL_NOT_EMPTY = 5;
var TIME_CHANNEL_DELETE = 5;

module.exports = {
    start: function (herggubot) {
        this.bot = herggubot;
        this.ts3api = herggubot.ts3api;
        this.database = herggubot.database;
        module.exports.monitorLimitedSlotChannels();
        console.log("Module monitor-limited-slot-channels loaded!");
    },
    monitorLimitedSlotChannels: function () {
        this.getInitialLimitedSlotChannels(function (err, channels) {
            if (err)
                return console.log(err);
            this.limitedSlotChannels = channels;
            //Update the amount of users in the tracked channels
            setInterval(function () {
                this.updateLimitedSlotChannelsClientAmount(function(){});
            }.bind(this), 3000);
            //Check if channels are full / check if channels need to be deleted
            setInterval(function () {
                this.checkLimitedSlotChannels();
            }.bind(this), 2000);
        }.bind(this));
    },
    checkLimitedSlotChannels : function(){
        async.forEach(this.limitedSlotChannels, function (channel, callback) {
            var timeNow = new Date();
            //Check if channel has players
            if (!channel.cloned &&  channel.usedSlots != 0 && ( timeNow.getTime() - channel.sameSince.getTime() ) > TIME_CHANNEL_NOT_EMPTY*1000 ) { //If has players and 10s has passed 
                //Clone the channel
                this.cloneLimitedChannel(channel, function(){

                });
            }
            //Check if cloned channel is empty
            if (!channel.original && channel.usedSlots == 0) { 
                //Check how many in the original channel
                this.ts3api.getClientsInChannel(channel.cloneChannelId, function (err, clients){
                    if(err){
                        console.log(err);
                    }else{
                        //Check if not full original channel
                        if(clients.length == 0){
                            //Loop through all the tracked channels to find the original
                            for(var x = 0 ; x < this.limitedSlotChannels.length; x++){
                                //If it is the original
                                if(this.limitedSlotChannels[x].channelId == channel.cloneChannelId){
                                    //If its been a while
                                    if(this.limitedSlotChannels[x].sameSince > TIME_CHANNEL_DELETE * 1000){
                                        //Remove unneccessary cloned channel
                                        this.ts3api.deleteChannel(channel.channelId, function(error, response){
                                            if(err){
                                                console.log("Failed to remove unneccessary cloned channel. " + util.inspect(error));
                                            }else{
                                                this.bot.logAction("Deleted channel "+ channel.channelId);
                                                //Delete from tracking list
                                                console.log("Untracking " + channel.channelId)
                                                //Remove from tracking list
                                                this.limitedSlotChannels.splice(this.limitedSlotChannels.indexOf(channel),1);
                                                //Try to find the cloned channel
                                                for(var x = 0 ; x < this.limitedSlotChannels.length; x++){
                                                    if(this.limitedSlotChannels[x].cloned && this.limitedSlotChannels[x].channelId == channel.cloneChannelId){
                                                        this.limitedSlotChannels[x].cloned = false;
                                                        break;
                                                    }
                                                }
                                            }
                                        }.bind(this));

                                    }
                                }
                            }
                        }
                    }
                }.bind(this));
            }

        }.bind(this), function (err) {

        }.bind(this));
    },
    updateLimitedSlotChannelsClientAmount: function (callback) {
        async.forEach(this.limitedSlotChannels, function (channel, callback) {
            this.ts3api.getClientsInChannel(channel.channelId, function (err, clients) {
                if(err){
                    //If error occures, it means that the channel does not exist. We are tracking a channel that does not exist
                    if(!channel.original){
                        console.log("Untracking " + channel.channelId)
                        //Remove from tracking list
                        this.limitedSlotChannels.splice(this.limitedSlotChannels.indexOf(channel),1);
                        //Try to find the cloned channel
                        for(var x = 0 ; x < this.limitedSlotChannels.length; x++){
                            if(this.limitedSlotChannels[x].cloned && this.limitedSlotChannels[x].channelId == channel.cloneChannelId){
                                this.limitedSlotChannels[x].cloned = false;
                                break;
                            }
                        }
                    }
                    callback();
                    return;
                }
                var nowDate = new Date();
                if (clients.length != channel.usedSlots) {
                    channel.usedSlots = clients.length;
                    channel.sameSince = new Date();
                }
            }.bind(this));
        }.bind(this), function (err) {

        }.bind(this));
    },
    getInitialLimitedSlotChannels: function (callback) {
        this.ts3api.getChannelsByName("(Max.", function (error, channels) {
            if (error)
                return console.log("Failed to monitor limited slot channels, error while getting channels by name. " + util.inspect(error));
            var limitedSlotChannels = [];
            async.forEach(channels, function (channel, callback) {
                //console.log(channel);
                var maxSlots = parseInt(/\(Max\.\s([0-9])\)/g.exec(channel.channel_name)[1]); //1 takes the result from the second capture group from the regex object //First one is the whole (Max. #) thing                
                this.ts3api.getClientsInChannel(channel.cid, function (error, clients) {
                    if (error)
                        return callback("Failed to monitor limited slot channels, error while getting clients in channel: " + channel.cid + " " + util.inspect(error),[]);
                    limitedSlotChannels.push({
                        channelId: channel.cid,
                        maxSlots: maxSlots,
                        usedSlots: clients.length,
                        sameSince: new Date(),
                        cloned: false,
                        original: true,
                        cloneChannelId: -1
                    });
                    callback(null,limitedSlotChannels);
                });
            }.bind(this), function (err) {
                if (err)
                    return console.log(err);
                callback(err,limitedSlotChannels);
            }.bind(this));
        }.bind(this));
    },
    cloneLimitedChannel: function(clonedChannel, callback) {
        this.ts3api.getChannelById(clonedChannel.channelId, function(error, channel) {
            if (error){
                console.log("Failed to clone channel, error while getting the channels properties. " +  util.inspect(error));
                callback();
                return;
            }
            this.ts3api.createChannel(channel.channel_name + " +", clonedChannel.maxSlots, channel.pid,2, function(error, response) {
                if (error){
                    console.log("Failed to clone channel, error while creating the channel. " +  util.inspect(error));
                    callback();
                    return;
                }
                console.log("Channel " + channel.channel_name + " + created");
                this.bot.logAction("Created channel "+ channel.channel_name + " +  with id " + response.cid);

                clonedChannel.cloned = true;
                this.limitedSlotChannels.push({
                    channelId: response.cid,
                    maxSlots: clonedChannel.maxSlots,
                    usedSlots: 0,
                    sameSince: new Date(),
                    cloned: false,
                    original: false,
                    cloneChannelId: clonedChannel.channelId
                });

            }.bind(this));
        }.bind(this));
    }
};