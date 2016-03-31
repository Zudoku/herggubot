var express = require('express');
var app = express();
var sqlite3 = require('sqlite3').verbose();
var config = require('../../config');
var util = require('util');
var wrapper = require('../../wrapper');


var chunkAmount = 200;

var botInfo = {
    started : '',
    modulesLoaded : ''

};
var botProcess = undefined;



var database = new sqlite3.Database(config.database_path);

process.on('exit', function (code, signal) {

    if(botProcess != undefined){
        
        if(botProcess.connected){
            console.log("Trying to cleanup bot process...");
            botProcess.kill('SIGTERM');
        }
    }
}); 

process.on('SIGINT', function () {
    process.exit(2);
});
process.on('uncaughtException', function(e) {
    console.log('Uncaught Exception...');
    console.log(e.stack);
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

        app.get("/", function(req, res){
        	res.status(404).end();
        });

        app.get("/herggubot/api/config", function(req, res){
        	var safeConfig = require('../../config');
        	safeConfig.ts_ip = "CENSORED";
        	safeConfig.database_path = "CENSORED";
        	safeConfig.serverquery_username = "CENSORED";
        	safeConfig.serverquery_password = "CENSORED";
            safeConfig.web_admin_password = "CENSORED";

        	res.send(JSON.stringify(safeConfig, null, 4));
        }.bind(this));

        app.get("/herggubot/api/modules", function(req, res){
            var response = [];
            if(botInfo != undefined){
                
                response = response.concat(botInfo);
            }
        	
        	res.send(JSON.stringify(response, null, 4));
        }.bind(this));

        app.listen(config.web_interface.port);
        console.log("Webserver started at port " + config.web_interface.port);
        
        if(config.web_interface.launch_bot_in_startup){
            module.exports.startBot();
        }

    },
    share : function() {
        var object = {
            module: "web-server"
        };
        return object;
    },
    reloadConfig : function() {
        config = require('../../config');
        database = new sqlite3.Database(config.database_path);
    },
    shutDownBot : function(){
        if(herggubot != undefined){
            herggubot.destroy();
        }
        if(botProcess != undefined){
            botProcess.send({msg : "destroy"});
            botProcess.kill('SIGTERM');
        }
        
        botProcess = undefined;
        herggubot = undefined;
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
        module.exports.startBot();
    },
    botClose : function(code, signal){
        console.log("Bot process closed " + code + " " + signal);
        if(config.bot_use_wrapper){
            setTimeout(function(){
                if(config.bot_use_wrapper){
                    module.exports.startBot();
                }
            },config.bot_wrapper_restart_time * 60 * 1000);
        }
    }

};