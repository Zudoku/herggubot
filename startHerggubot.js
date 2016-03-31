var wrapper = require('./wrapper');
var config = require('./config');


function onCloseWebServer(code,signal){
	if(config.web_interface.use_wrapper){
		setTimeout(function(){
			var webserverProcess = wrapper.spawnWebServerInstance(onCloseWebServer);

		}, config.web_interface.wrapper_restart_time * 60 * 1000);
	}
};

function onCloseBot(code,signal){
	if(config.bot_use_wrapper){
		setTimeout(function(){
			var botProcess = wrapper.spawnBotInstance(onCloseBot);

		}, config.bot_wrapper_restart_time * 60 * 1000);
	}
};


if(config.web_interface != undefined && config.web_interface.enabled){
	//Wrap web interface
	var webserverProcess = wrapper.spawnWebServerInstance(onCloseWebServer);

} else {
	//Wrap only bot
	var botProcess = wrapper.spawnBotInstance(onCloseBot);
}