var express = require('express');
var app = express();
var config = require('../../config');
var util = require('util');

var chunkAmount = 200;


module.exports = {
	start: function (herggubot) {
        this.database = herggubot.database;

        app.use("/herggubot/", function(req,res,next){
            if(config.module_extra_logs.enabled){
                //herggubot.logAction("Web-server Dashboard accessed by " + req.ip);
            }
            next();
        });

        app.use("/herggubot/", express.static(__dirname + '/pages'));

        app.get("/herggubot/api/serverlog", function(req, res){
        	this.database.all("SELECT * FROM serveractionlog;", function(err,rows){
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
        	this.database.all("SELECT * FROM serverchatlog;", function(err,rows){

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
        	this.database.all("SELECT * FROM privatechatlog;", function(err,rows){
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
        	this.database.all("SELECT * FROM actionlog;", function(err,rows){
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

        	res.send(JSON.stringify(safeConfig, null, 4));
        }.bind(this));

        app.get("/herggubot/api/modules", function(req, res){
            var response = [{
                botRunningSince : herggubot.botStarted

            }];

        	var modulemap = herggubot.modulesLoaded.map(function(obj){
        		return obj.share();
        	});
            response = response.concat(modulemap);
        	res.send(JSON.stringify(response, null, 4));
        }.bind(this));

        app.listen(config.module_web_interface.port);
        console.log("Webserver started at port " + config.module_web_interface.port);
        console.log("Module web-server loaded!");


    },
    share : function() {
        var object = {
            module: "web-server"
        };
        return object;
    }
};