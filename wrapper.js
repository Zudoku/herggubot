var wrapper = require('child_process').spawn;

function spawnBot(){
	console.log("Spawning new instance of bot");
    var bot  = wrapper('node', ['start.js']);
	bot.stdout.pipe(process.stdout);
	bot.stderr.pipe(process.stderr);

	bot.on('close', function (code, signal) {
  		console.log('Bot exited with signal ' + signal + ' Restarting bot in 10 mins!');
  		setTimeout(spawnBot,10 * 1000 * 60);
	});	
}

spawnBot();
