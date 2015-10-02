var config = require('./config');
var ts3api = require('./ts3api');
var sqlite3 = require('sqlite3').verbose();
var database = new sqlite3.Database(config.DATABASE_PATH);
var util = require("util");

var node = this;

module.exports = {
    ts3api : ts3api,
    database : database,
    node: node,
    launch : function(callback){
        ts3api.initialize(config,function(){

            var modulesLoaded = this.loadModules();

            console.log(modulesLoaded.length + " modules loaded!");

            callback();
        }.bind(this));
    },
    loadModules : function(){
        var modulesLoaded = [];
        if(config.monitorChat){
            var monitorChat = require('./modules/monitor-chat');
            monitorChat.start(this);
            modulesLoaded.push(monitorChat);
        }
        if(config.monitorChannelSlots){
            var monitorChannelSlots = require('./modules/monitor-limited-slot-channels');
            monitorChannelSlots.start(this);
            modulesLoaded.push(monitorChannelSlots);
        }


        return modulesLoaded;

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
    }
};
*/