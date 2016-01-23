var wrapper = require('child_process').spawn;

function spawnBot(){
	console.log("Spawning new instance of bot");
    var bot  = wrapper('node', ['start.js']);
	bot.stdout.pipe(process.stdout);
	bot.stderr.pipe(process.stderr);

	bot.on('close', function (code, signal) {
		var config = require('./config');
  		console.log('Bot exited with signal ' + signal + ' Restarting bot in ' + config.wrapper_restart_time + ' mins!');
  		setTimeout(spawnBot,config.wrapper_restart_time * 1000 * 60);
	});	
}

spawnBot();
