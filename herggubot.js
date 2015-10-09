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
        if(config.extraLogs){
            var extraLogs = require('./modules/extra-logs');
            extraLogs.start(this);
            modulesLoaded.push(extraLogs);
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
            "DROP TABLE IF EXISTS serveractionlog;",

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
	        ");",

            "CREATE TABLE serveractionlog",
            "(",
            "date datetime,",
            "text TEXT,",
            "actiontype TEXT",
            ");"
		];
        database.exec(sql.join(""));
    }

};