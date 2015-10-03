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
            }.bind(this), 2000);
            //Check if channels are full / check if channels need to be deleted
            setInterval(function () {
                this.checkLimitedSlotChannels();
            }.bind(this), 2000);
        }.bind(this));
    },
    checkLimitedSlotChannels : function(){
        async.forEach(this.limitedSlotChannels, function (channel, callback) {


            //Check if new channel needs to be made (If atleast one empty channel)
            //Create new channel if necessary
            //Or delete channel if necessary'
            var deletedChannels = [];

            for(var u = 0 ; u < channel.clones.length ; u++){
                if(channel.clones[u].usedSlots == 0){
                    //If there are other empty channels
                    if(this.checkIfOtherEmptyChannels(channel,u,deletedChannels)){
                        //Remove unnecessary channel
                        //this.removeClonedChannel(channel,u);
                        deletedChannels.push(u);
                    }
                }
            }
            //Remove the cloned channels that were marked for deletion
            for(var k = 0 ; k < deletedChannels.length ; k++){
                this.removeClonedChannel(channel,deletedChannels[k]);
            }
            //Check if new channel needs to be created
            if(this.checkIfNewCloneNeeded(channel)){
                this.cloneLimitedChannel(channel,function(error){
                    if(error){
                        //
                    }
                });
            }



            //TODO: Name channels correctly
            //TODO: Sort them to right order


            

        }.bind(this), function (err) {

        }.bind(this));
    },
    updateLimitedSlotChannelsClientAmount: function (callback) {
        async.forEach(this.limitedSlotChannels, function (channel, callback) {
            //Loop through the original channels
            this.ts3api.getClientsInChannel(channel.channelId, function (err, clients) {
                if(err){
                    console.log("Error while getting the amount of clients in original limited slot channel. " + util.inspect(err));
                    callback();
                    return;
                }
                if (clients.length != channel.usedSlots) {
                    channel.usedSlots = clients.length;
                    channel.sameSince = new Date();
                }
            }.bind(this));
            //Loop through cloned channels
            async.forEach(this.limitedSlotChannels.clones, function (clone, callback) {
                this.ts3api.getClientsInChannel(clone.channelId, function (err, clients) {
                    if(err){
                        console.log("Error while getting the amount of clients in cloned limited slot channel. " + util.inspect(err));
                        callback();
                        return;
                    }
                    if (clients.length != clone.usedSlots) {
                        clone.usedSlots = clients.length;
                        clone.sameSince = new Date();
                    }

                }.bind(this));
            }.bind(this), function (err) {
                //Error is most likely caused by empty clones array
                //console.log("Error while looping through limited slot channel clones. Error while updating limited slot client count. " + util.inspect(err));
            }.bind(this));

        }.bind(this), function (err) {
            
            console.log("Error while looping through limited slot channels. Error while updating limited slot client count. " + util.inspect(err));
        }.bind(this));
    },
    getInitialLimitedSlotChannels: function (callback) {
        this.ts3api.getChannelsByName("(Max.", function (error, channels) {
            if (error)
                return console.log("Failed to monitor limited slot channels, error while getting channels by name. " + util.inspect(error));
            var limitedSlotChannels = [];
            async.forEach(channels, function (channel, callback) {
                //console.log(channel);
                var maxSlots = parseInt(/\(Max\.\s([0-9])\)/g.exec(channel.channel_name)[1]); //1 takes the result from the second capture group from the regex object //First one (0) is the whole (Max. #) thing                
                this.ts3api.getClientsInChannel(channel.cid, function (error, clients) {
                    if (error)
                        return callback("Failed to monitor limited slot channels, error while getting clients in channel: " + channel.cid + " " + util.inspect(error),[]);
                    limitedSlotChannels.push({
                        channelId: channel.cid,
                        maxSlots: maxSlots,
                        usedSlots: clients.length,
                        channelName: channel.channel_name,
                        sameSince: new Date(),
                        clones: []
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
        //Figure out the 
        this.ts3api.getChannelById(clonedChannel.channelId, function(error, channel) {
            if (error){
                console.log("Failed to clone channel, error while getting the channels properties. " +  util.inspect(error));
                callback(error);
                return;
            }
            var generatedChannelName = this.calculateNewChannelName(clonedChannel);
            this.ts3api.createChannel(generatedChannelName, clonedChannel.maxSlots, channel.pid,2, function(error, response) {
                if (error){
                    console.log("Failed to clone channel, error while creating the channel. " +  util.inspect(error));
                    callback(error);
                    return;
                }
                console.log("Channel " + generatedChannelName + " created");
                this.bot.logAction("Created channel "+ generatedChannelName + " with id " + response.cid);

                clonedChannel.clones.push({
                    channelId: response.cid,
                    maxSlots: clonedChannel.maxSlots,
                    usedSlots: 0,
                    channelName:generatedChannelName,
                    sameSince: new Date()
                });
                callback(null);
            }.bind(this));
        }.bind(this));
    },
    calculateNewChannelName: function(channel) {
        var candidate = channel.channelName + "+";
        var deciding = true;
        while(deciding){
            var found = false;
            for(var x = 0 ; x < channel.clones.length ; x++){
                if(channel.clones[x].channelName == candidate){
                    candidate += "+";
                    found = true;
                }
            }
            if(!found){
                deciding = false;
            }
           
        }
        return candidate;
    },
    checkIfOtherEmptyChannels: function(channel, index, deletedClones) {
        if(channel.usedSlots == 0){
            return true;
        }
        for(var i = 0 ; i < channel.clones.length; i++){
            if(channel.clones[i].usedSlots == 0 && index != i && deletedClones.indexOf(i) == -1){
                return true;
            }
        }
        return false;
    },
    removeClonedChannel: function(channel,index) {
        this.ts3api.deleteChannel(channel.clones[index].channelId, function(error, response){
            if(err){
                console.log("Failed to remove unneccessary cloned channel. " + util.inspect(error));
            }else{
                console.log("Deleted channel " + channel.clones[index].channelName);
                this.bot.logAction("Deleted channel " + channel.clones[index].channelName);
                //Delete from tracking list
                console.log("Untracking " + channel.clones[index].channelName);
                //Remove from tracking list
                channel.clones.splice(channel.clones.indexOf(channel.clones[index]),1);
            }
        }.bind(this));
    },
    checkIfNewCloneNeeded: function(channel){
        var emptyChannel = false;
        if(channel.usedSlots == 0){
            emptyChannel = true;
        }
        for(var t = 0 ; t < channel.clones.length ; t++){
            if(channel.clones[t].usedSlots == 0){
                emptyChannel = true;
            }
        }

        return !emptyChannel;
    }

};