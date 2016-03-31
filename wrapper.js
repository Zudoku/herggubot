var wrapper = require('child_process').fork;



module.exports = {
	//forks a new process for the bot
	spawnBotInstance : function(onClose){
		var bot  = wrapper('startBot', []);

		bot.on('close', function (code, signal) {
			onClose(code,signal);
		});	

		return bot;
	},
	//forks a new process for the web-interface
	spawnWebServerInstance : function(onClose){
		var bot  = wrapper('startWebServer', []);

		bot.on('close', function (code, signal) {
			onClose(code,signal);
		});	

		return bot;
	}
};
