var TeamSpeakClient = require("node-teamspeak");
var async = require("async");

module.exports = {
	lastRequestTime: null,
	initialize: function (config, callback) {
		this.QUERY_TIME_LIMIT = config.QUERY_TIME_LIMIT;
		this.__client = new TeamSpeakClient(config.TS_IP);
    	this.__login(config.USERNAME, config.PASSWORD, function (err) {
    		if (err && typeof callback == "function")
    			return callback(err);
    		this.setNickname(config.NICKNAME, function (err) {
    			if (err && typeof callback == "function")
    				return callback(err);
    			this.__registerInitialEvents(function (err) {
    				if (typeof callback == "function")
    					return callback(err);
    			});
    		}.bind(this));
    	}.bind(this));
    	this.NETWORK_DEBUG = config.NETWORK_DEBUG;
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
	createChannel : function(channelName, maxClients, CPID, type, callback) {
		var parameters = { channel_name: channelName , channel_maxclients: maxClients, cpid: CPID, };
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
			parameters.channel_flag_maxclients_unlimited = 1;

		}
		this.__sendCommand("channelcreate",parameters,function(err,res) { 
			return callback(err,res);
		});
	},
	deleteChannel : function(channelId, callback) {
		//Force delete even if clients inside
		this.__sendCommand("channeldelete",{ cid: channelId , force: 1},function(err,res) { 
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
	__login: function (username, password, callback) {
		this.__sendCommand("login", { client_login_name: username, client_login_password: password }, function (err) {
			if (err && typeof callback == "function")
				return callback(err);
			this.__sendCommand("use", { sid: 1 }, function (err) {
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
				args: { id: 1 }
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
		if(this.NETWORK_DEBUG){
			console.log("SEND: " + command + " " + JSON.stringify(arguments));
		}
		this.__client.send(command, arguments, function(err, response, rawResponse) {
		    this.lastRequestTime = new Date();
		    if (err)
		    	console.log("Error while sending command: " + command + " Error: " + JSON.stringify(err));
	        if (typeof callback == "function")
	        	return callback(err, response);
		}.bind(this));
	}
};