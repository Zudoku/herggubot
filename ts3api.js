var TeamSpeakClient = require("node-teamspeak");
var async = require("async");
var util = require('util');

module.exports = {
	lastRequestTime: null,
	initialize: function (config, callback) {
		//this.query_time_limit = config.query_time_limit;
		this.__client = new TeamSpeakClient(config.ts_ip);
    	this.__login(config.serverquery_username, config.serverquery_password,config.virtual_server_id, function (err) {
    		if (err && typeof callback == "function")
    			return callback(err);
    		this.setNickname(config.nickname, function (err) {
    			if (err && typeof callback == "function")
    				return callback(err);
    			this.__registerInitialEvents(function (err) {
    				if (typeof callback == "function")
    					return callback(err);
    			});
    		}.bind(this));
    	}.bind(this));
    	this.debug_network = config.debug_network;
    	this.virtual_server_id = config.virtual_server_id;
	},
	setNickname: function (nickname, callback) {
        this.__sendCommand("clientupdate", { client_nickname: nickname }, function (err) {
        	if (typeof callback == "function")
        		return callback(err);
        });
	},
	registerListener: function (listenerName, listener) {
		this.__client.on(listenerName, listener);
	},
	registerEvent: function (event, arguments, callback) {
		arguments["event"] = event;
		this.__sendCommand("servernotifyregister", arguments, function (err) {
			if (typeof callback == "function")
				callback(err);
		});
	},
	sendClientMessage: function (targetClientId, message, callback) {
		this.__sendCommand("sendtextmessage", { targetmode: 1, target: targetClientId, msg: message }, function (err, res) {
			if (typeof callback == "function")
				return callback(err, res);
		});
	},
	sendServerMessage: function (message, callback) {
		this.__sendCommand("sendtextmessage", { targetmode: 3, target: this.virtual_server_id, msg: message }, function (err, res) {
			if (typeof callback == "function")
				return callback(err, res);
		});
	},
	getClientsInChannel: function (channelId, callback) {
		this.__sendCommand("clientlist", {}, function (err, res) {
			if (err && typeof callback == "function")
				return callback(err);
			var targetClients = res.filter(function (client) {
				return client.cid == channelId
			});
			callback(null, targetClients);
		});
	},
	getChannelsByName: function (channelName, callback) {
		this.__sendCommand("channelfind", { pattern: channelName }, function (err, res) {
			return callback(err, res);
		});
	},
	getChannelById: function(channelId, callback) {
		this.__sendCommand("channelinfo", { cid: channelId }, function (err, res) {
			return callback(err, res);
		});
	},
	// channelName - Channels name
	// maxClients - number of clients that is the maximum. 0 or -1 for no restriction
	// CPID - channel parent id, what channel is the parent channel. 0 for level 1 channel
	// type - channel type. 1 = temporary 2 = semipermament 3 = permanent
	// options - JS object with other parameters
	createChannel : function(channelName, maxClients, CPID, type, options, callback) {
		var parameters = options;
		parameters.channel_name = channelName; 
		parameters.channel_maxclients = maxClients;
		parameters.cpid = CPID;
		switch(type){
			case 1:
				parameters.channel_flag_temporary = 1;
				break;
			case 2:
				parameters.channel_flag_semi_permanent = 1;
				break;
			case 3:
				parameters.channel_flag_permanent = 1;
				break;
			default:
				parameters.channel_flag_temporary = 1;
				break;
		}
		if(maxClients > 0){
			parameters.channel_flag_maxclients_unlimited = 0;

		}
		this.__sendCommand("channelcreate",parameters,function(err,res) { 
			return callback(err,res);
		});
	},
	deleteChannel: function(channelId, callback) {
		//Force delete even if clients inside
		this.__sendCommand("channeldelete",{ cid: channelId , force: 1},function(err,res) { 
			return callback(err,res);
		});
	},
	//Parameters are channel Properties
	//http://i.imgur.com/LJwSZFF.png
	editChannel: function(channelId, parameters, callback) {
		parameters.cid = channelId;
		this.__sendCommand("channeledit",parameters,function(err,res) { 
			return callback(err,res);
		});
	},
	moveClient: function (clientId, targetChannelId, callback) {
		this.__sendCommand("clientmove", { clid: clientId, cid: targetChannelId }, function (err, res) {
			return callback(err, res);
		});
	},
	
	moveManyClients: function (clientIds, targetChannelId, callback) {
		async.forEach(clientIds, function (id, callback) {
			this.moveClient(id, targetChannelId, function (err) {
				callback(err);
			});
		}.bind(this), function (err) {
			if (typeof callback == "function")
				callback(err);
		});
	},
	banClientFromServer: function (clientId, reason,timeBanned, callback) {
		this.__sendCommand("banclient", { clid: clientId, time: timeBanned, banreason: reason }, function (err, res) {
			if (typeof callback == "function")
				return callback(err, res);
		});
	},
	kickClientFromServer: function (clientId, reason, callback) {
		this.__sendCommand("clientkick", { clid: clientId, reasonid: 5, reasonmsg: reason }, function (err, res) {
			if (typeof callback == "function")
				return callback(err, res);
		});
	},
	getClientById: function (clientId, callback) {
		this.__sendCommand("clientinfo", { clid: clientId }, function (err, res) {
			return callback(err, res);
		});
	},
	getClientsByName: function (clientName, callback) {
		this.__sendCommand("clientfind", { pattern: clientName }, function (err, res) {
			return callback(err, res);
		});
	},
	//Closes the connection to the teamspeak server (called when shutting down the bot)
	quitConnection : function(callback){
		this.__sendCommand("quit",{}, function(err, res){
			return callback(err, res);
		});
	},
	__login: function (username, password,vsId, callback) {
		this.__sendCommand("login", { client_login_name: username, client_login_password: password }, function (err) {
			if (err && typeof callback == "function")
				return callback(err);
			this.__sendCommand("use", { sid: vsId }, function (err) {
				if (typeof callback == "function")
					return callback(err);
			});
		}.bind(this));
	},
	__registerInitialEvents: function (callback) {
		var events = [
			{
				name: "server",
				args: {}
			},
			{
				name: "textserver",
				args: {}
			},
			{
				name: "textprivate",
				args: {}
			},
			{
				name: "channel",
				args: { id: 0 }
			}
		];
		async.each(events, function (event, callback) {
			this.registerEvent(event.name, event.args, function (err) {
				callback(err);
			});
		}.bind(this), function (err) {
			if (err)
				console.log("Error registering initial events.")
			if (typeof callback == "function")
				callback(err);
		});
	},
	__sendCommand: function (command, arguments, callback) {
		if(this.debug_network){
			console.log("SEND: " + command + " " + JSON.stringify(arguments));
		}
		this.__client.send(command, arguments, function(err, response, rawResponse) {
		    this.lastRequestTime = new Date();
		    if (err)
		    	console.log("Error while sending command: " + command + " Error: " + JSON.stringify(err));
	        if (typeof callback == "function")
	        	if(this.debug_network){
					console.log("RECEIVE: " + util.inspect(response));
				}
	        	return callback(err, response);
		}.bind(this));
	}
};