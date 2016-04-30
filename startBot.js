var herggubot = require('./herggubot');
var util = require('util');
var dbUtil = require('./databaseUtil');


herggubot.launch(function(){
	
});

process.on('message',(m) => {
	if(m.msg == "destroy"){
		herggubot.destroy();
	}
	if(m.msg == "refreshLSC"){
		for(var index = 0; index < herggubot.modulesLoaded.length; index++){
			var module = herggubot.modulesLoaded[index];
			if(typeof module.refreshOriginalChannels  == 'function'){
				module.refreshOriginalChannels();
			}
		}
	}
	
});
//Remember to log 
process.on('uncaughtException', function(e) {
    dbUtil.logError(e.stack + " " + util.inspect(e),"Herggubot-???");
    //Log errors to error log 
    process.exit(99);
});

