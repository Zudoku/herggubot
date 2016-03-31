var herggubot = require('./herggubot');


herggubot.launch(function(){
	
});

process.on('message',(m) => {
	if(m.msg == "destroy"){
		herggubot.destroy();
	}
	
});

