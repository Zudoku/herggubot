var wrapper = require('child_process').fork;



module.exports = {
	spawnBotInstance : function(onClose){
		var bot  = wrapper('startBot', []);

		//bot.stdout.pipe(process.stdout);
		//bot.stderr.pipe(process.stderr);

		bot.on('close', function (code, signal) {
			onClose(code,signal);
		});	

		return bot;
	},
	spawnWebServerInstance : function(onClose){

	}
};
