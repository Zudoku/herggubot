var TeamSpeakClient = require("node-teamspeak");
var async = require("async");

module.exports = {
	lastRequestTime,
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
	__login: function (username, password, callback) {
		this.__sendCommand("login", { client_login_name: username, client_login_password: password }, function (err) {
			if (err && typeof callback == "function")
				return callback(err);
			this.__sendCommand("use", { sid: 1 }, function (err) {
				if (typeof callback == "function")
					return callback(err);
			});
		});
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
			this.__registerEvent(event.name, event.args, function (err) {
				callback(err);
			});
		}.bind(this), function (err) {
			if (err)
				console.log("Error registering initial events.")
			if (typeof callback == "function")
				callback(err);
		});
	},
	__registerEvent: function (event, arguments, callback) {
		arguments["event"] = event;
		this.__sendCommand("servernotifyregister", arguments, function (err) {
			if (typeof callback == "function")
				callback(err);
		});
	},
	__sendCommand: function (command, arguments, callback) {
		if (!this.lastRequestTime || (new Date() - this.lastRequestTime) / 1000 > this.QUERY_TIME_LIMIT) {
			this.__client.send(command, arguments, function(err, response, rawResponse) {
			    this.lastRequestTime = new Date();
			    if (err)
			    	console.log("Error while sending command: " + command + " with arguments: " + JSON.stringify(arguments) + " Error: " + err);
		        if (typeof callback == "function")
		        	return callback(err, response);
			}.bind(this));
		} else {
			setTimeout(this.__sendCommand(command, arguments, callback), new Date() - this.lastRequestTime);
		}
	}
};