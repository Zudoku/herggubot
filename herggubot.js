var config = require('./config');


var TeamSpeakClient = require("node-teamspeak"),
    util = require("util");


var cl = new TeamSpeakClient(config.TS_IP);

//config.TIME_BETWEEN_QUERIES

var sendCommand = function(command, args, cb) {
    cl.send(command, args, function(err, response, rawResponse) {
        if (err) {
            console.log("err:", command, err);
        }
        if(cb){
            cb(response,err);
        }else{
            console.log("NO CALLBACK TO CALL")
        }

    });

};
var afterRegister = function(callback){
    //http://code.tutsplus.com/tutorials/using-nodes-event-module--net-35941
    console.log("done!");

};
var registerForOneEvent = function(callback,index){
    var eventTypes =  ["server","channel","textserver","textchannel","textprivate"];
    if(index == eventTypes.length){
        callback();
        return;
    }
    console.log("Registering " + eventTypes[index]);
    cl.send("servernotifyregister",{event: eventTypes[index]}, function(err, response, rawResponse){
        console.log(util.inspect(response));
    });
    setTimeout(registerForOneEvent,config.TIME_BETWEEN_QUERIES,callback,++index);
};

var operate = function(){
    cl.send("login", {client_login_name: config.botlogin, client_login_password: config.botpass}, function(err, response, rawResponse){
        console.log(util.inspect(rawResponse));
        cl.send("use", { sid: 1}, function(err, response, rawResponse){
            cl.send("clientupdate",{client_nickname : "HerGGuBot (BOT)"}, function(err, response, rawResponse){
                console.log(util.inspect(response));
                setTimeout(registerForOneEvent,config.TIME_BETWEEN_QUERIES,callback,0);
        
            });
        });
    });
};

var handleEvent = function(event){

};



module.exports = {
    activate : function(){
       operate();
    }
}