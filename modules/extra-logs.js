const SERVER_EDIT = "SERVER_EDIT";
const CLIENT_JOIN = "CLIENT_JOIN";
const CLIENT_LEAVE = "CLIENT_LEAVE";
const CLIENT_MOVE = "CLIENT_MOVE";
const CHANNEL_EDIT = "CHANNEL_EDIT";
const CHANNEL_CREATE = "CHANNEL_CREATE";
const CHANNEL_REMOVE = "CHANNEL_REMOVE";

module.exports = {
    //Called when the module will get loaded
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
        //Register listener for server edit events
        this.ts3api.registerListener("serveredited",function(data){
            var invoker = data.invokername + " [ID=" + data.invokerid + " UID=" + data.invokeruid + "] ";
            //Make more pretty
            var modifiedData = data;
            modifiedData.invokername = undefined;
            modifiedData.invokerid = undefined;
            modifiedData.invokeruid = undefined;
            modifiedData.reasonid = undefined;
            modifiedData.serveredited = undefined;

            //Log to DB
            this.logServerActionChat("Server edited by " + invoker + "changes made: " + JSON.stringify(modifiedData),SERVER_EDIT);
        }.bind(this));
        //Register listener for channel edit events
        this.ts3api.registerListener("channeledited",function(data){
            var invoker = data.invokername + " [ID=" + data.invokerid + " UID=" + data.invokeruid + "] ";
            var modifiedData = data;
            var channel = data.cid;
            //Make more pretty
            modifiedData.invokername = undefined;
            modifiedData.invokerid = undefined;
            modifiedData.invokeruid = undefined;
            modifiedData.cid = undefined;
            modifiedData.channeledited = undefined;
            //Log to DB
            this.logServerActionChat("Channel " + "[CHANNEL_ID="+channel +"] edited by " + invoker + "changes made: " + JSON.stringify(modifiedData),CHANNEL_EDIT);
        }.bind(this));
        //Register listener for channel edit events
        this.ts3api.registerListener("channelcreated",function(data){
            var invoker = data.invokername + " [ID=" + data.invokerid + " UID=" + data.invokeruid + "] ";
            //Log to DB
            this.logServerActionChat("Channel created by " + invoker + "[CHANNEL_ID=" +data.cid + " CHANNEL_NAME=" + data.channel_name + "]",CHANNEL_CREATE);
        }.bind(this));
        //Register listener for channel deletion events
        this.ts3api.registerListener("channeldeleted",function(data){
            var invoker = data.invokername + " [INVOKER=" + data.invokerid + "] ";
            //Log to DB
            this.logServerActionChat("Channel removed by " + invoker + "[CHANNEL_ID=" +data.cid + "]",CHANNEL_REMOVE);
        }.bind(this));
        //Register listener for client move events
        this.ts3api.registerListener("clientmoved",function(data){
            var logmessage = "";
            if(data["invokername"] != undefined){
                var invoker = data.invokername + " [ID=" + data.invokerid + " IDENTIFIER:" + data.invokeruid + "] ";
                var channel = "" + data.ctid;
                var modifiedData = data;
                //Make more pretty
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
            //Log to DB
            this.logServerActionChat(logmessage,CLIENT_MOVE);
        }.bind(this));
        //Register listener for client left server events
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
            //Log to DB
            this.logServerActionChat(logmessage,CLIENT_LEAVE);
        }.bind(this));
        //Register listener for client joined server events
        this.ts3api.registerListener("cliententerview",function(data){
            //Check if it is a serverquery client or a real user
            var clientType = (data.client_type ==1)? "serverquery":"normal client";
            var client = data.client_nickname + " [ID=" + data.client_database_id + " GROUP=" + data.client_servergroups + " TYPE=" + clientType +  "] ";
            //Log to DB
            this.logServerActionChat("Client " + client + "entered server" ,CLIENT_JOIN);
        }.bind(this));
    },
    //Public information for the web-interface
    share : function() {
        var object = {
            module: "extra-logs"
        };
        return object;
    }
};