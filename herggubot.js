var config = require('./config');
var ts3api = require('./ts3api');
var sqlite3 = require('sqlite3').verbose();
var database = new sqlite3.Database(config.DATABASE_PATH);
var util = require("util");

var spamKickMessage = "Please do not spam the server chat.";

module.exports = {
    launch : function(callback){
        ts3api.initialize(config,function(){
            callback();
            ts3api.getChannelsByName("(Max.", function (e, r) {
            	console.log(util.inspect(r))
            });
        });
    },
    addtoIgnoreList : function(clientId){
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to add client " + clientId + "to ignorelist! Error: " + util.inspect(error));
            }else{
                database.run("INSERT INTO ignorelist (databaseid,date) values (?,?);", data.client_database_id, new Date());
                this.addActionLog(data.client_database_id + " Added to ignore list");
            }
        }.bind(this));
    },
    isOnIgnoreList : function(clientId){
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to check if client " + clientId + " is on ignorelist! Error: " + util.inspect(error));
            }else{
                database.all("SELECT * FROM ignorelist WHERE databaseid = ?;",data.client_database_id,function(err, rows) {
                    return rows.length > 0;
                });
            }
        });
    },
    logAction : function(actionString) {
        database.run("INSERT INTO actionlog (text,date) VALUES (?,?)",actionString,new Date());
    },
    logServerChat : function(clientId,text,sender) {
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to check databaseid for client " + clientId + " Error: " + util.inspect(error));
                database.run("INSERT INTO serverchatlog (text,sender,databaseid,date) VALUES (?,?,?,?)",text,sender,-1,new Date());
            }else{
                database.run("INSERT INTO serverchatlog (text,sender,databaseid,date) VALUES (?,?,?,?)",text,sender,data.client_database_id,new Date());
            }
        });
    },
    logPrivateChat : function(clientId,text,sender) {
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to check databaseid for client " + clientId + " Error: " + util.inspect(error));
                database.run("INSERT INTO privatechatlog (text,sender,databaseid,date) VALUES (?,?,?,?)",text,sender,-1,new Date());
            }else{
                database.run("INSERT INTO privatechatlog (text,sender,databaseid,date) VALUES (?,?,?,?)",text,sender,data.client_database_id,new Date());
            }
        });
    },
    checkIfSpamming : function(clientId){
        var spamTimeFrame = 5000; //ms
        var spamLimit = 4; //messages
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to check databaseid for client " + clientId + " Error: " + util.inspect(error));
            }else{
                var checkDate = new Date();
                checkDate.setTime(checkDate.getTime() - spamTimeFrame);
                database.all("SELECT * FROM serverchatlog WHERE date > ? AND databaseid = ? ;",checkDate,data.client_database_id,function(err, rows) {
                    if(rows.length >= spamLimit){
                        this.logAction("Client " + data.client_database_id + " has been found guilty of spamming.");
                        //TODO: Check if recently kicked
                        ts3api.kickClientFromServer(clientId,spamKickMessage,function(error,data){});
                    }
                }.bind(this));
            }
        }.bind(this));

    },
    monitorChat : function(){
        ts3api.registerListener("textmessage",function(data){
            switch(data.targetmode){
                case 3: //Server chat
                    this.logServerChat(data.invokerid,data.msg,data.invokername);
                    this.checkIfSpamming(data.invokerid);
                break;
                case 1: //Private chat
                    this.logPrivateChat(data.invokerid,data.msg,data.invokername);
                break;
            }
        }.bind(this));
    },
    resetDatabase : function(){
        var sql = [
	        "DROP TABLE IF EXISTS ignorelist;",
	        "DROP TABLE IF EXISTS serverchatlog;",
	        "DROP TABLE IF EXISTS privatechatlog;",
	        "DROP TABLE IF EXISTS actionlog;",

	        "CREATE TABLE ignorelist",
	        "(",
	        "date datetime,",
	        "databaseid INTEGER",
	        ");",

	        "CREATE TABLE serverchatlog",
	        "(",
	        "date datetime,",
	        "text TEXT,",
	        "sender TEXT,",
	        "databaseid INTEGER",
	        ");",

	        "CREATE TABLE privatechatlog",
	        "(",
	        "date datetime,",
	        "text TEXT,",
	        "sender TEXT,",
	        "databaseid INTEGER",
	        ");",

	        "CREATE TABLE actionlog",
	        "(",
	        "date datetime,",
	        "text TEXT",
	        ");"
		];
        database.exec(sql.join(""));
    }

};

/*

var TeamSpeakClient = require("node-teamspeak"),
    util = require("util");

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(config.DATABASE_PATH);
var cl = new TeamSpeakClient(config.TS_IP);*

//config.TIME_BETWEEN_QUERIES

var sendCommand = function(command, args, cb) {
    cl.send(command, args, function(err, response, rawResponse) {
        if (err) {
            console.log("err:", command, err);
        }
        if(cb){
            cb(response,err);
        }else{
            console.log("NO CALLBACK TO CALL")
        }
    });
};
var messageQueue = [];
var welcomeSent = [];
var strawpollLink = "[url=http://strawpoll.me/5398304]http://strawpoll.me/5398304[/url]";

var responseQueue = function() {
    if(messageQueue.length >= 1){
        var message = messageQueue.shift();
        var results = [];
        sendCommand("clientinfo",{clid : message.id},function(response,err){
            db.each("SELECT * FROM ignorelist WHERE clientid = ?;",response.client_database_id, function(err, row) {
                results.push(row);
            },function(){
                if(results.length == 0){
                    sendCommand("sendtextmessage",{targetmode : 1, target : message.id , msg : message.message},function(response,err){setTimeout(responseQueue,1000);});
                    console.log("-> " +response.client_nickname + " : " +message.message + "\n");
                }else{
                    setTimeout(responseQueue,1000);
                }
            });
        });
    }else{
        setTimeout(responseQueue,1000);
    }
};

var getResponse = function(toID,sender, message){
    var object = {
        sender : sender,
        id : toID,
        message : message
    };
    return object;
};

var handleTextMessage = function(data){
    //console.log("<-" +data.invokername + " : "  + data.msg);
    var trimmedMessage = data.msg.replace(/ /g, '');
    if(trimmedMessage == "!help"){
        messageQueue.push(getResponse(data.invokerid,data.invokername,getHelpMessage()));
    }else if(trimmedMessage == "!survey"){
        messageQueue.push(getResponse(data.invokerid,data.invokername,strawpollLink));
    }else if(trimmedMessage == "!ignore"){
        sendCommand("clientinfo",{clid : data.invokerid},function(response,err){
            db.run("INSERT INTO ignorelist (clientid) values (?);",response.client_database_id);
        });
        
    }else if(trimmedMessage == "!stats"){
        messageQueue.push(getResponse(data.invokerid,data.invokername,"Sorry! stats coming real soon. Check it out manually for now! =) [url=http://tessustats.ovh/app/#/users]http://tessustats.ovh/app/#/users[/url]"));
    }
};

var afterRegister = function(){
    console.log("Register done!");
    cl.on("textmessage",function(data){
        if(data.invokername != "HerGGuBot (BOT)"){
            if(data.targetmode == 1){
                handleTextMessage(data);
            }
            console.log("<- " + data.invokername + " : " + data.msg + "\n");
        }
    });
    cl.on("clientmoved",function(data){

    });
    cl.on("cliententerview",function(data){
        if(welcomeSent.indexOf(data.clid) == -1){
            welcomeSent.push(data.clid);
            messageQueue.push(getResponse(data.clid,data.invokername,getWelcomeMessage()));
            setTimeout(function(){
                if(welcomeSent.indexOf(data.clid) != -1){
                    welcomeSent.splice(welcomeSent.indexOf(data.clid),1);
                }
            },2000);
        }
    });
    setTimeout(responseQueue,1000);
};
var registerForOneEvent = function(callback,index){
    var eventTypes =  ["server","textserver","textprivate"];
    if(index == eventTypes.length){
        cl.send("servernotifyregister",{event: "channel", id: 1}, function(err, response, rawResponse){
            callback();
        });
        return;
>>>>>>> 4482dd2f9b1d8ec4a816b837d3df06b46e6c3d7a
    }
};
