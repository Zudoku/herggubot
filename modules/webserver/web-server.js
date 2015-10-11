var express = require('express');
var app = express();

module.exports = {
	start: function (herggubot) {
        this.database = herggubot.database;

        app.use("/", express.static(__dirname + '/pages'));

        app.get("/api/serverlog", function(req, res){
        	this.database.all("SELECT * FROM serveractionlog;", function(err,rows){
        		var filteredRows = rows.filter(function(value){
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

        		res.send(filteredRows);
        	});
        }.bind(this));
        app.get("/api/serverchat", function(req, res){
        	this.database.all("SELECT * FROM serverchatlog;", function(err,rows){
        		res.send(rows);
        	});
        }.bind(this));
        app.get("/api/privatechat", function(req, res){
        	this.database.all("SELECT * FROM privatechatlog;", function(err,rows){
        		res.send(rows);
        	});
        }.bind(this));
        app.get("/api/actionlog", function(req, res){
        	this.database.all("SELECT * FROM actionlog;", function(err,rows){
        		res.send(rows);
        	});
        }.bind(this));

        app.listen(9090,'127.0.0.1');
        console.log("Webserver started at port 9090");
        console.log("Module web-server loaded!");


    }
};