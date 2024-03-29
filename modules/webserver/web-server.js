var express = require('express');
var app = express();
var sqlite3 = require('sqlite3').verbose();
var config = require('../../config');
var util = require('util');
var wrapper = require('../../wrapper');
var dbUtil = require('../../databaseUtil');
var fs = require('fs');
var bodyParser = require('body-parser');

var database = new sqlite3.Database(config.database_path);

const chunkAmount = 200;

var botInfo = undefined;
var botProcess = undefined;

const error_reporter_name = "web-server-core";

var userShutDownBot = false;

var botInfoChanged = undefined;

//We try to catch all exceptions and ctrl + C
//so we can do cleanup on the bot process

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
    setTimeout(process.exit,99,1000);
});




module.exports = {
    start: function () {


        app.use(bodyParser.json());
        //wtf ? this populates the body in POST requests
        app.use(bodyParser.urlencoded({
            extended: true
        }));


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

                //Handle error
                if(err){
                    dbUtil.logError("Error while accessing /herggubot/api/serverlog " + util.inspect(err),error_reporter_name);
                    rows = [];
                }


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
            //We clone the object so the original doesn't change
            safeConfig = JSON.parse(JSON.stringify(safeConfig));
            safeConfig.ts_ip = "";
            safeConfig.database_path = "";
            safeConfig.serverquery_username = "";
            safeConfig.serverquery_password = "";
            safeConfig.web_admin_password = "";

            res.send(JSON.stringify(safeConfig, null, 4));
        });
        // API for config
        // Returns JSON object with information about the bot
        app.get("/herggubot/api/modules", function(req, res){
            var response = [];
            if(botInfo != undefined && botInfoChanged != undefined && new Date() - botInfoChanged < 10000){
                response = response.concat(botInfo);
            } else {
                response = [{}];
            }

            res.send(JSON.stringify(response, null, 4));
        }.bind(this));

        app.get("/herggubot/api/restart", function(req, res){

            if(req.query.pw == config.web_admin_password){
                userShutDownBot = false;
                dbUtil.logAction("Restarting bot");
                module.exports.restartBot();
                res.send(JSON.stringify({success : true}, null, 4));
            }else {
                dbUtil.logError("Wrong password while trying to restart bot",error_reporter_name);
                res.send(JSON.stringify({success : false}, null, 4));

            }
        }.bind(this));


        app.get("/herggubot/api/toggle", function(req, res){

            if(req.query.pw == config.web_admin_password){

                if(botProcess != undefined){
                    userShutDownBot = true;
                    dbUtil.logAction("Shutting bot down");
                    module.exports.shutDownBot();
                    res.send(JSON.stringify({success : true}, null, 4));
                } else {
                    userShutDownBot = false;
                    dbUtil.logAction("Starting bot");
                    module.exports.startBot("Toggle from web-interface");

                    res.send(JSON.stringify({success : true}, null, 4));
                }
            }else {
                dbUtil.logError("Wrong password while trying to toggle bot",error_reporter_name);
                res.send(JSON.stringify({success : false}, null, 4));
            }
        }.bind(this));

        app.get("/herggubot/api/refreshLSC", function(req, res) {

            if(botProcess != undefined){
                botProcess.send({msg : "refreshLSC"});
                res.send(JSON.stringify({success : true}, null, 4));
            } else {
                res.send(JSON.stringify({success : false}, null, 4));
            }


        }.bind(this));

        // Body should be the following (JSON)
        //{
        // pw : contains the password
        // payload : contains the file contents (JSON)
        //}
        app.post("/herggubot/api/upload-config", function(req, res){

            var body = req.body;
            if(config.web_interface.allow_config_upload) {
                if(body.pw == config.web_admin_password) {
                    var fileContents = "var config = " + util.inspect(JSON.parse(body.payload)) + ";\nmodule.exports = config;";
                    dbUtil.writeConfigJS({content : fileContents})
                    res.send(JSON.stringify({success : true}));
                } else {
                    dbUtil.logError("Wrong password while trying to upload config.js",error_reporter_name);
                    res.send(JSON.stringify({success : false, reason : "Wrong password" }, null, 4));
                }
            } else {
                dbUtil.logError("Uploading config.js has been disabled in the settings - Someone tried to upload a new configuration",error_reporter_name);
                res.send(JSON.stringify({success : false, reason : "Uploading config.js has been disabled in the settings" }, null, 4));
            }

        }.bind(this));


        // Body should be the following (JSON)
        //{
        // pw : contains the password
        // payload : contains the file contents (RAW)
        //}
        app.post("/herggubot/api/upload-config-raw", function(req, res){

            var body = req.body;
            if(config.web_interface.allow_config_upload) {
                if(body.pw == config.web_admin_password) {
                    dbUtil.writeConfigJS({content : body.payload})
                    res.send(JSON.stringify({success : true}));
                } else {
                    dbUtil.logError("Wrong password while trying to upload config.js",error_reporter_name);
                    res.send(JSON.stringify({success : false, reason : "Wrong password" }, null, 4));
                }
            } else {
                dbUtil.logError("Uploading config.js has been disabled in the settings - Someone tried to upload a new configuration",error_reporter_name);
                res.send(JSON.stringify({success : false, reason : "Uploading config.js has been disabled in the settings" }, null, 4));
            }

        }.bind(this));

        app.listen(config.web_interface.port,config.web_interface.webserver_bind);
        console.log("Webserver started at port " + config.web_interface.port);
        dbUtil.logAction("Web-server started at port " + config.web_interface.port);

        if(config.web_interface.launch_bot_in_startup){
            module.exports.startBot("Initial launch because of web_interface.launch_bot_in_startup flag");
        }

    },
    reloadConfig : function() {
        config = require('../../config');
        database = new sqlite3.Database(config.database_path);
    },
    shutDownBot : function(){
        if(botProcess != undefined){
            dbUtil.logAction("Cleaning up bot process");
            botProcess.send({msg : "destroy"});
            botProcess.kill('SIGTERM');
        }

        botProcess = undefined;
        botInfo = undefined;
    },
    startBot: function(reason){
        dbUtil.logAction("Attempting to launch bot, reason: " + reason);
        botProcess = wrapper.spawnBotInstance(module.exports.botClose);
        botProcess.on('message',(m) => {
            if(m.msg == "readonlybot"){
                botInfo = m.botInfo;
                botInfoChanged = new Date();
            }
        });

    },
    restartBot : function(){
        module.exports.shutDownBot();
        setTimeout(module.exports.startBot,"Restart from web-interface",5000);
    },
    botClose : function(code, signal){
        //console.log("Bot process closed " + code + " " + signal);
        dbUtil.logAction("Bot process closed with code " + code);
        if(config.bot_use_wrapper && !userShutDownBot){
            //console.log("Bot will restart in " + config.bot_wrapper_restart_time * 60 * 1000);
            dbUtil.logAction("Bot will restart in " + config.bot_wrapper_restart_time * 60 * 1000);
            botProcess = undefined;
            setTimeout(function(){
                if(config.bot_use_wrapper && botProcess == undefined){
                    module.exports.startBot("Automatic restart after crash");
                } else {
                    dbUtil.logError("Automatic restart will not launch bot because process is defined (bot is already running)",error_reporter_name);
                }
            },config.bot_wrapper_restart_time * 60 * 1000);
        }
    }

};
