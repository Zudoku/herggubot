var herggubot = require('./herggubot');


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

