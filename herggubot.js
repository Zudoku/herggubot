var config = require('./config');
var ts3api = require('./ts3api');
var sqlite3 = require('sqlite3').verbose();
var database = new sqlite3.Database(config.database_path);
var util = require("util");

var node = this;
var modulesLoaded = [];

module.exports = {
    ts3api : ts3api,
    database : database,
    node: node,
    modulesLoaded : modulesLoaded,
    launch : function(callback){


        if(config.resetDatabase){
            this.resetDatabase();
        }
        if(config.module_web_interface){
            var webserver = require('./modules/webserver/web-server');
            webserver.start(this);
            modulesLoaded.push(webserver);
        }
        if(config.launch_bot_in_startup){
            ts3api.initialize(config,function(){
                modulesLoaded = this.loadModules();
                console.log(modulesLoaded.length + " modules loaded!");
                /*ts3api.getClientById(67, function (x,y) {
                    console.log(y);
                })*/
              callback();
            }.bind(this));
        }
    },
    loadModules : function(){
        if(config.module_monitor_chat.enabled){
            var monitorChat = require('./modules/monitor-chat');
            monitorChat.start(this);
            modulesLoaded.push(monitorChat);
        }
        if(config.module_monitor_channel_slots.enabled){
            var monitorChannelSlots = require('./modules/monitor-limited-slot-channels');
            monitorChannelSlots.start(this);
            modulesLoaded.push(monitorChannelSlots);
        }
        if(config.module_extra_logs.enabled){
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
            "DROP TABLE IF EXISTS mutedusers;",

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
            ");",

            "CREATE TABLE mutedusers",
            "(",
            "expires datetime,",
            "databaseid INTEGER,",
            "username TEXT",
            ");"
		];
        database.exec(sql.join(""));
    }

};