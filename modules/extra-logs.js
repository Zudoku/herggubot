var SERVER_EDIT = "SERVER_EDIT";
var CLIENT_JOIN = "CLIENT_JOIN";
var CLIENT_LEAVE = "CLIENT_LEAVE";
var CLIENT_MOVE = "CLIENT_MOVE";
var CHANNEL_EDIT = "CHANNEL_EDIT";
var CHANNEL_CREATE = "CHANNEL_CREATE";
var CHANNEL_REMOVE = "CHANNEL_REMOVE";

module.exports = {
    start: function (herggubot) {
        this.ts3api = herggubot.ts3api;
        this.database = herggubot.database;
        module.exports.doExtraLogging();
        console.log("Module extra-logs loaded!");
    },
    logServerActionChat : function(text,type){
        this.database.run("INSERT INTO serveractionlog (text,date,actiontype) VALUES (?,?,?)",text,new Date(),type);
    },
    doExtraLogging : function(){
        this.ts3api.registerListener("serveredited",function(data){
            var invoker = data.invokername + " [ID=" + data.invokerid + " UID=" + data.invokeruid + "] ";
            var modifiedData = data;
            modifiedData.invokername = undefined;
            modifiedData.invokerid = undefined;
            modifiedData.invokeruid = undefined;
            modifiedData.reasonid = undefined;
            modifiedData.serveredited = undefined;

            this.logServerActionChat("Server edited by " + invoker + "changes made: " + JSON.stringify(modifiedData),SERVER_EDIT);
        }.bind(this));

        this.ts3api.registerListener("channeledited",function(data){
            var invoker = data.invokername + " [ID=" + data.invokerid + " UID=" + data.invokeruid + "] ";
            var modifiedData = data;
            var channel = data.cid;
            modifiedData.invokername = undefined;
            modifiedData.invokerid = undefined;
            modifiedData.invokeruid = undefined;
            modifiedData.cid = undefined;
            modifiedData.channeledited = undefined;
            this.logServerActionChat("Channel " + "[CHANNEL_ID="+channel +"] edited by " + invoker + "changes made: " + JSON.stringify(modifiedData),CHANNEL_EDIT);
        }.bind(this));

        this.ts3api.registerListener("channelcreated",function(data){
            var invoker = data.invokername + " [ID=" + data.invokerid + " UID=" + data.invokeruid + "] ";

            this.logServerActionChat("Channel created by " + invoker + "[CHANNEL_ID=" +data.cid + " CHANNEL_NAME=" + data.channel_name + "]",CHANNEL_CREATE);
        }.bind(this));

        this.ts3api.registerListener("channeldeleted",function(data){
            var invoker = data.invokername + " [INVOKER=" + data.invokerid + "] ";

            this.logServerActionChat("Channel removed by " + invoker + "[CHANNEL_ID=" +data.cid + "]",CHANNEL_REMOVE);
        }.bind(this));

        this.ts3api.registerListener("clientmoved",function(data){
            var logmessage = "";
            if(data["invokername"] != undefined){
                var invoker = data.invokername + " [ID=" + data.invokerid + " IDENTIFIER:" + data.invokeruid + "] ";
                var channel = "" + data.ctid;
                var modifiedData = data;
                modifiedData.invokername = undefined;
                modifiedData.invokerid = undefined;
                modifiedData.invokeruid = undefined;
                modifiedData.ctid = undefined;
                modifiedData.clientmoved = undefined;

                var action = "moved";
                if(data.reasonid == 4){
                    action = "kicked";
                }
                logmessage = "User " + data.clid + " was " + action + " to channel_ID: " + channel + " by " + invoker + JSON.stringify(modifiedData);
            }else{
                logmessage = "User " + data.clid + " moved to channel_ID: " + data.ctid +" because of reason " + data.reasonid;
            }
            


            this.logServerActionChat(logmessage,CLIENT_MOVE);
        }.bind(this));

        this.ts3api.registerListener("clientleftview",function(data){
            var logmessage = "";
            switch(data.reasonid){
                case 5:
                var invoker = data.invokername + " [" + data.invokerid + " " + data.invokeruid + "] ";

                logmessage = "User(s) " + data.clid + " kicked from the server by " + invoker + " for reason: " + data.reasonmsg;

                break;
                case 6:
                var invoker = data.invokername + " [" + data.invokerid + " " + data.invokeruid + "] ";

                logmessage = "User " + data.clid + " banned from the server for" + data.bantime + " by " + invoker + " for reason: " + data.reasonmsg;
                break;
                default:
                logmessage = "User " + data.clid + " left the server for reason " + data.reasonid +" "+ data.reasonmsg;
            }
            this.logServerActionChat(logmessage,CLIENT_LEAVE);
        }.bind(this));

        this.ts3api.registerListener("cliententerview",function(data){
            var clientType = (data.client_type ==1)? "serverquery":"normal client";
            var client = data.client_nickname + " [ID=" + data.client_database_id + " GROUP=" + data.client_servergroups + " TYPE=" + clientType +  "] ";
            this.logServerActionChat("Client " + client + "entered server" ,CLIENT_JOIN);
        }.bind(this));
    }
};