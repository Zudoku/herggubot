var express = require('express');
var app = express();
var sqlite3 = require('sqlite3').verbose();
var config = require('../../config');
var util = require('util');
var wrapper = require('../../wrapper');
var dbUtil = require('../../databaseUtil');

var database = new sqlite3.Database(config.database_path);

const chunkAmount = 200;

var botInfo = undefined;
var botProcess = undefined;

const error_reporter_name = "web-server-core";

var userShutDownBot = false;



process.on('exit', function (code, signal) {
    //Do cleanup before exiting
    if(botProcess != undefined){
        
        if(botProcess.connected){
            console.log("Trying to cleanup bot process...");
            botProcess.kill('SIGTERM');
        }
    }
}); 

process.on('SIGINT', function () { 
    //CTRL + C
    //We catch it and exit peacefully with errorcode 2 so that the cleanup-code will run
    process.exit(2);
});
process.on('uncaughtException', function(e) {
    dbUtil.logError(e.stack,error_reporter_name);
    console.log(e.stack);
    //We catch it and exit peacefully with errorcode 99 so that the cleanup-code will run
    process.exit(99);
});


module.exports = {
	start: function () {

        app.use("/herggubot/", function(req,res,next){
            if(config.module_extra_logs.enabled){
                //herggubot.logAction("Web-server Dashboard accessed by " + req.ip);
            }
            next();
        });

        app.use("/herggubot/", express.static(__dirname + '/pages'));


        // API for serveractionlog
        // Returns server action logs in an array
        // All args are string objects
        // args: 
        //  index - (int) Where to start retrieving the logs (chunk index) , 0 1 2 ...
        //  search - (string) search phrase, either regex or just text
        //  regex_search - (boolean) if the search phrase is regex or not
        //  client_join - (boolean) if should filter type CLIENT_JOIN log rows out
        //  client_move - (boolean) if should filter type CLIENT_MOVE log rows out
        //  client_leave - (boolean) if should filter type CLIENT_LEAVE log rows out
        //  server_edit - (boolean) if should filter type SERVER_EDIT log rows out
        //  channel_create - (boolean) if should filter type CHANNEL_CREATE log rows out
        //  channel_edit - (boolean) if should filter type CHANNEL_EDIT log rows out
        //  channel_remove - (boolean) if should filter type CHANNEL_REMOVE log rows out
        app.get("/herggubot/api/serverlog", function(req, res){
        	database.all("SELECT * FROM serveractionlog;", function(err,rows){
        		var filteredRows = rows.filter(function(value){

                    if(req.query.index == undefined){
                        return true;
                    }

        			if(req.query.search != undefined && req.query.search != "" && req.query.regex_search == 'false'){
        				var valueLC = value.text.toLowerCase();
        				var searchLC = req.query.search.toLowerCase();
        				if(valueLC.indexOf(searchLC) == -1){
        					return false;
        				}
        			}else if(req.query.search != undefined && req.query.search != "" && req.query.regex_search == 'true'){

        				var isValid;
						try { 
    						new RegExp(req.query.search, 'g');
    						isValid = true;
						}catch(e) {
    						isValid = false;
    						return false;
						}
						if(isValid){
							var regex = new RegExp(req.query.search, 'g');
        					if(value.text.match(regex) == null)
        						return false;
        					}
						}
        			switch(value.actiontype){
        				case "CLIENT_JOIN":
        					return (req.query.client_join != undefined && req.query.client_join=='false');
        				break;
        				case "CLIENT_MOVE":
        					return (req.query.client_move != undefined && req.query.client_move=='false');
        				break;
        				case "CLIENT_LEAVE":
        					return (req.query.client_leave != undefined && req.query.client_leave=='false');
        				break;
        				case "SERVER_EDIT":
        					return (req.query.server_edit != undefined && req.query.server_edit=='false');
        				break;
        				case "CHANNEL_CREATE":
        					return (req.query.channel_create != undefined && req.query.channel_create=='false');
        				break;
        				case "CHANNEL_EDIT":
        					return (req.query.channel_edit != undefined && req.query.channel_edit=='false');
        				break;
        				case "CHANNEL_REMOVE":
        					return (req.query.channel_remove != undefined && req.query.channel_remove=='false');
        				break;
        				default:
        					return false;
        			}
        		}.bind(this));

                filteredRows.sort(function(a,b){
                    return b.date - a.date;
                });
                
                if(req.query.index == undefined){
                    res.send([]);
                    return;
                }
                var response = {index: req.query.index};
                response.logs = filteredRows.splice(req.query.index * chunkAmount , chunkAmount);
                res.send(response);

        	});
        }.bind(this));
        // API for serverchat logs
        // Returns serverchat logs in an array
        // All args are string objects
        // args: 
        //  index - (int) Where to start retrieving the logs (chunk index) , 0 1 2 ...
        app.get("/herggubot/api/serverchat", function(req, res){
        	database.all("SELECT * FROM serverchatlog;", function(err,rows){

                if(req.query.index == undefined){
                    res.send([]);
                    return;
                }
                var response = {index: req.query.index};
                rows.sort(function(a,b){
                    return b.date - a.date;
                });
                response.logs = rows.splice(req.query.index * chunkAmount , chunkAmount);
                res.send(response);
        	});
        }.bind(this));
        // API for private chat logs
        // Returns private chat logs in an array
        // All args are string objects
        // args: 
        //  index - (int) Where to start retrieving the logs (chunk index) , 0 1 2 ...
        app.get("/herggubot/api/privatechat", function(req, res){
        	database.all("SELECT * FROM privatechatlog;", function(err,rows){
        		if(req.query.index == undefined){
                    res.send([]);
                    return;
                }
                var response = {index: req.query.index};

                rows.sort(function(a,b){
                    return b.date - a.date;
                });
                response.logs = rows.splice(req.query.index * chunkAmount , chunkAmount);
                res.send(response);
        	});
        }.bind(this));
        // API for bot action log
        // Returns bot action logs in an array
        // All args are string objects
        // args: 
        //  index - (int) Where to start retrieving the logs (chunk index) , 0 1 2 ...
        app.get("/herggubot/api/actionlog", function(req, res){
        	database.all("SELECT * FROM actionlog;", function(err,rows){
        		if(req.query.index == undefined){
                    res.send([]);
                    return;
                }
                var response = {index: req.query.index};
                rows.sort(function(a,b){
                    return b.date - a.date;
                });
                response.logs = rows.splice(req.query.index * chunkAmount , chunkAmount);
                res.send(response);
        	});
        }.bind(this));
        // API for bot error log
        // Returns bot error logs in an array
        // All args are string objects
        // args: 
        //  index - (int) Where to start retrieving the logs (chunk index) , 0 1 2 ...
        app.get("/herggubot/api/errorlog", function(req, res){
            database.all("SELECT * FROM errorlog;", function(err,rows){
                if(req.query.index == undefined){
                    res.send([]);
                    return;
                }
                var response = {index: req.query.index};
                rows.sort(function(a,b){
                    return b.date - a.date;
                });
                response.logs = rows.splice(req.query.index * chunkAmount , chunkAmount);
                res.send(response);
            });
        }.bind(this));

        app.get("/", function(req, res){
        	res.status(404).end();
        });
        // API for config
        // Returns JSON object with current config with sensitive information replaced
        app.get("/herggubot/api/config", function(req, res){
        	var safeConfig = require('../../config');
        	safeConfig.ts_ip = "CENSORED";
        	safeConfig.database_path = "CENSORED";
        	safeConfig.serverquery_username = "CENSORED";
        	safeConfig.serverquery_password = "CENSORED";
            safeConfig.web_admin_password = "CENSORED";

        	res.send(JSON.stringify(safeConfig, null, 4));
        }.bind(this));
        // API for config
        // Returns JSON object with information about the bot
        app.get("/herggubot/api/modules", function(req, res){
            var response = [];
            if(botInfo != undefined){
                
                response = response.concat(botInfo);
            } else {
                response = [{}];
            }
        	
        	res.send(JSON.stringify(response, null, 4));
        }.bind(this));

        app.get("/herggubot/api/restart", function(req, res){

            if(req.query.pw == config.web_admin_password && botProcess != undefined){
                module.exports.restartBot();
                res.send(JSON.stringify({success : true}, null, 4));
            }else {
                res.send(JSON.stringify({success : false}, null, 4));
            } 
        }.bind(this));


        app.get("/herggubot/api/toggle", function(req, res){

            if(req.query.pw == config.web_admin_password){
                
                
                console.log(botProcess != undefined);

                if(botProcess != undefined){
                    userShutDownBot = true;
                    console.log("shutting down")
                    module.exports.shutDownBot();
                    res.send(JSON.stringify({success : true}, null, 4));
                } else {
                    userShutDownBot = false;
                    module.exports.startBot();
                    res.send(JSON.stringify({success : true}, null, 4));
                }
            }else {
                res.send(JSON.stringify({success : false}, null, 4));
            } 
        }.bind(this));

        app.listen(config.web_interface.port);
        console.log("Webserver started at port " + config.web_interface.port);
        dbUtil.logAction("Web-server started at port " + config.web_interface.port);
        
        if(config.web_interface.launch_bot_in_startup){
            module.exports.startBot();
        }

    },
    reloadConfig : function() {
        config = require('../../config');
        database = new sqlite3.Database(config.database_path);
    },
    shutDownBot : function(){
        if(botProcess != undefined){
            botProcess.send({msg : "destroy"});
            botProcess.kill('SIGTERM');
        }
        
        botProcess = undefined;
        botInfo = undefined;
    },
    startBot: function(){
        botProcess = wrapper.spawnBotInstance(module.exports.botClose);
        botProcess.on('message',(m) => {
            if(m.msg == "readonlybot"){
                botInfo = m.botInfo;
            }
        });
        
    },
    restartBot : function(){
        module.exports.shutDownBot();
        setTimeout(module.exports.startBot,5000);
    },
    botClose : function(code, signal){
        console.log("Bot process closed " + code + " " + signal);
        if(config.bot_use_wrapper && !userShutDownBot){
            console.log("Bot will restart in " + config.bot_wrapper_restart_time * 60 * 1000);
            setTimeout(function(){
                if(config.bot_use_wrapper && botProcess == undefined){
                    module.exports.startBot();
                }
            },config.bot_wrapper_restart_time * 60 * 1000);
        }
    }

};