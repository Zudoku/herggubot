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
		console.log("SEND: " + command + " " + JSON.stringify(arguments));
		this.__client.send(command, arguments, function(err, response, rawResponse) {
		    this.lastRequestTime = new Date();
		    if (err)
		    	console.log("Error while sending command: " + command + " Error: " + JSON.stringify(err));
	        if (typeof callback == "function")
	        	return callback(err, response);
		}.bind(this));
	}
};