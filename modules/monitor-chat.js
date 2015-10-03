
var spamKickMessage = "Please do not spam the server chat.";

module.exports = {
    start: function (herggubot) {
        this.bot = herggubot;
        this.ts3api = herggubot.ts3api;
        this.database = herggubot.database;
        module.exports.monitorChat();
        console.log("Module monitor-chat loaded!");
    },
    checkIfSpamming : function(clientId){
        var spamTimeFrame = 5000; //ms
        var spamLimit = 4; //messages
        this.ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to check databaseid for client " + clientId + " Error: " + util.inspect(error));
            }else{
                var checkDate = new Date();
                checkDate.setTime(checkDate.getTime() - spamTimeFrame);
                this.database.all("SELECT * FROM serverchatlog WHERE date > ? AND databaseid = ? ;",checkDate,data.client_database_id,function(err, rows) {
                    if(rows.length >= spamLimit){
                        this.logAction("Client " + data.client_database_id + " has been found guilty of spamming.");
                        //TODO: Check if recently kicked
                        this.ts3api.kickClientFromServer(clientId,spamKickMessage,function(error,data){});
                    }
                }.bind(this));
            }
        }.bind(this));

    },
    monitorChat : function(){
        this.ts3api.registerListener("textmessage",function(data){
            switch(data.targetmode){
                case 3: //Server chat
                    console.log("SERVER CHAT: " + data.invokername + " : " + data.msg);
                    this.bot.logServerChat(data.invokerid,data.msg,data.invokername);
                    this.checkIfSpamming(data.invokerid);
                break;
                case 1: //Private chat'
                    console.log("PRIVATE CHAT: " + data.invokername + " : " + data.msg);
                    this.bot.logPrivateChat(data.invokerid,data.msg,data.invokername);
                break;
            }
        }.bind(this));
    }
};