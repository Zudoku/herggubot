var config = require('./config');
var ts3api = require('./ts3api');
var sqlite3 = require('sqlite3').verbose();
var database = new sqlite3.Database(config.database_path);
var util = require("util");
var dbUtil = require('./databaseUtil');

var node = this;
var modulesLoaded = [];

const error_reporter_name = "bot-core";

function updateBotStatus(){

    var modulemap = modulesLoaded.map(function(obj){
        return obj.share();
    });


    var botInfo = {
        started : module.exports.botStarted,
        uptime : process.uptime(),
        pid : process.pid,
        memoryUsage : process.memoryUsage(),
        modulesLoaded : modulemap
    };

    process.send({msg : "readonlybot" , botInfo : botInfo});
    setTimeout(updateBotStatus, 1000);
}


module.exports = {
    ts3api : ts3api,
    database : database,
    node: node,
    modulesLoaded : modulesLoaded,
    botStarted : new Date(),
    launch : function(callback){
        dbUtil.logAction("Bot launched");
        if(config.reset_database){
            dbUtil.resetDatabase();
            dbUtil.logAction("Reseted database using config.reset_database flag");
        }
        
        if(config.web_interface && config.web_interface.enabled){
            updateBotStatus();
        } 
        ts3api.initialize(config,function(){
            dbUtil.logAction("Bot loading modules");
            modulesLoaded = this.loadModules();
            dbUtil.logAction("Bot loaded " + modulesLoaded.length+ " modules");
            console.log(modulesLoaded.length + " modules loaded!");
            callback();
        }.bind(this));
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
                var erromessage = "Failed to add client " + clientId + "to ignorelist! Error: " + util.inspect(error);
                dbUtil.logError(errormessage,error_reporter_name);
            }else{
                database.run("INSERT INTO ignorelist (databaseid,date) values (?,?);", data.client_database_id, new Date());
                this.addActionLog(data.client_database_id + " Added to ignore list");
            }
        }.bind(this));
    },
    isOnIgnoreList : function(clientId){
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                var errormessage = "Failed to check if client " + clientId + " is on ignorelist! Error: " + util.inspect(error);
                dbUtil.logError(errormessage,error_reporter_name);
            }else{
                database.all("SELECT * FROM ignorelist WHERE databaseid = ?;",data.client_database_id,function(err, rows) {
                    return rows.length > 0;
                });
            }
        });
    },
    logAction : function(actionString) {
        dbUtil.logAction(actionString);
    },
    logServerChat : function(clientId,text,sender) {
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                var errormessage = "Failed to check databaseid for client " + clientId + " Error: " + util.inspect(error);
                dbUtil.logError(errormessage,error_reporter_name);
                database.run("INSERT INTO serverchatlog (text,sender,databaseid,date) VALUES (?,?,?,?)",text,sender,-1,new Date());
            }else{
                database.run("INSERT INTO serverchatlog (text,sender,databaseid,date) VALUES (?,?,?,?)",text,sender,data.client_database_id,new Date());
            }
        });
    },
    logPrivateChat : function(clientId,text,sender) {
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                var errormessage = "Failed to check databaseid for client " + clientId + " Error: " + util.inspect(error);
                dbUtil.logError(errormessage,error_reporter_name);
                database.run("INSERT INTO privatechatlog (text,sender,databaseid,date) VALUES (?,?,?,?)",text,sender,-1,new Date());
            }else{
                database.run("INSERT INTO privatechatlog (text,sender,databaseid,date) VALUES (?,?,?,?)",text,sender,data.client_database_id,new Date());
            }
        });
    },
    destroy : function(){
        ts3api.quitConnection(function(err, res){

        });
    }

};