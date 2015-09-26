var config = require('./config');
var ts3api = require('./ts3api');
var sqlite3 = require('sqlite3').verbose();
var database = new sqlite3.Database(config.DATABASE_PATH);
var util = require("util");
/*

DROP TABLE ignorelist;
DROP TABLE serverchatlog;
DROP TABLE privatechatlog;
DROP TABLE actionlog;

CREATE TABLE ignorelist
(
date datetime,
databaseid INTEGER
);

CREATE TABLE serverchatlog 
(
date datetime,
text TEXT,
sender TEXT,
databaseid INTEGER
);

CREATE TABLE privatechatlog 
(
date datetime,
text TEXT,
sender TEXT,
databaseid INTEGER
);

CREATE TABLE actionlog 
(
date datetime,
text TEXT,
);

*/

module.exports = {
    launch : function(){
        ts3api.initialize(config,function(){

        });
    },
    resetDatabase : function(){
        var sqlString = "";

        sqlString += "DROP TABLE ignorelist;";
        sqlString += "DROP TABLE serverchatlog;";
        sqlString += "DROP TABLE privatechatlog;";
        sqlString += "DROP TABLE actionlog;";

        sqlString += "CREATE TABLE ignorelist";
        sqlString += "(";
        sqlString += "date datetime,";
        sqlString += "databaseid INTEGER";
        sqlString += ");";

        sqlString += "CREATE TABLE serverchatlog";
        sqlString += "(";
        sqlString += "date datetime,";
        sqlString += "text TEXT,";
        sqlString += "sender TEXT,";
        sqlString += "databaseid INTEGER";
        sqlString += ");";

        sqlString += "CREATE TABLE privatechatlog";
        sqlString += "(";
        sqlString += "date datetime,";
        sqlString += "text TEXT,";
        sqlString += "sender TEXT,";
        sqlString += "databaseid INTEGER";
        sqlString += ");";

        sqlString += "CREATE TABLE actionlog";
        sqlString += "(";
        sqlString += "date datetime,";
        sqlString += "text TEXT";
        sqlString += ");";

        database.run(sqlString);
    },
    addtoIgnoreList : function(clientId){
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to add client " + clientId + "to ignorelist! Error: " + util.ispect(error));
            }else{
                database.run("INSERT INTO ignorelist (databaseid,date) values (?,?);", data.client_database_id, new Date());
                addActionLog(data.client_database_id + " Added to ignore list");
            }
        });
        
    },
    isOnIgnoreList : function(clientId){
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to check if client " + clientId + " is on ignorelist! Error: " + util.ispect(error));
            }else{
                database.all("SELECT * FROM ignorelist WHERE databaseid = ?;",data.client_database_id,function(err, rows) {
                    if(rows.length == 0){
                        return false;
                    }else{
                        return true;
                    }
                });

            }
        });
    },
    addActionLog : function(actionString) {
        database.run("INSERT INTO actionlog (text,date) VALUES (?,?)",actionString,new Date());
    },
    addServerChatLog : function(clientId,text,sender) {
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to check databaseid for client " + clientId + " Error: " + util.ispect(error));
                database.run("INSERT INTO serverchatlog (text,sender,databaseid,date) VALUES (?,?)",text,sender,-1,new Date());
            }else{
                database.run("INSERT INTO serverchatlog (text,sender,databaseid,date) VALUES (?,?)",text,sender,data.client_database_id,new Date());
            }
        });
    },
    addPrivateChatLog : function(clientId,text,sender) {
        ts3api.getClientById(clientId,function(error,data){
            if(error){
                console.log("Failed to check databaseid for client " + clientId + " Error: " + util.ispect(error));
                database.run("INSERT INTO privatechatlog (text,sender,databaseid,date) VALUES (?,?)",text,sender,-1,new Date());
            }else{
                database.run("INSERT INTO privatechatlog (text,sender,databaseid,date) VALUES (?,?)",text,sender,data.client_database_id,new Date());
            }
        });
    }

};

/*

var TeamSpeakClient = require("node-teamspeak"),
    util = require("util");

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(config.DATABASE_PATH);
var cl = new TeamSpeakClient(config.TS_IP);*

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
var messageQueue = [];
var welcomeSent = [];
var strawpollLink = "[url=http://strawpoll.me/5398304]http://strawpoll.me/5398304[/url]";

var responseQueue = function() {
    if(messageQueue.length >= 1){
        var message = messageQueue.shift();
        var results = [];
        sendCommand("clientinfo",{clid : message.id},function(response,err){
            db.each("SELECT * FROM ignorelist WHERE clientid = ?;",response.client_database_id, function(err, row) {
                results.push(row);
            },function(){
                if(results.length == 0){
                    sendCommand("sendtextmessage",{targetmode : 1, target : message.id , msg : message.message},function(response,err){setTimeout(responseQueue,1000);});
                    console.log("-> " +response.client_nickname + " : " +message.message + "\n");
                }else{
                    setTimeout(responseQueue,1000);
                }
            });
        });
    }else{
        setTimeout(responseQueue,1000);
    }
};

var getResponse = function(toID,sender, message){
    var object = {
        sender : sender,
        id : toID,
        message : message
    };
    return object;
};

var handleTextMessage = function(data){
    //console.log("<-" +data.invokername + " : "  + data.msg);
    var trimmedMessage = data.msg.replace(/ /g, '');
    if(trimmedMessage == "!help"){
        messageQueue.push(getResponse(data.invokerid,data.invokername,getHelpMessage()));
    }else if(trimmedMessage == "!survey"){
        messageQueue.push(getResponse(data.invokerid,data.invokername,strawpollLink));
    }else if(trimmedMessage == "!ignore"){
        sendCommand("clientinfo",{clid : data.invokerid},function(response,err){
            db.run("INSERT INTO ignorelist (clientid) values (?);",response.client_database_id);
        });
        
    }else if(trimmedMessage == "!stats"){
        messageQueue.push(getResponse(data.invokerid,data.invokername,"Sorry! stats coming real soon. Check it out manually for now! =) [url=http://tessustats.ovh/app/#/users]http://tessustats.ovh/app/#/users[/url]"));
    }
};

var afterRegister = function(){
    console.log("Register done!");
    cl.on("textmessage",function(data){
        if(data.invokername != "HerGGuBot (BOT)"){
            if(data.targetmode == 1){
                handleTextMessage(data);
            }
            console.log("<- " + data.invokername + " : " + data.msg + "\n");
        }
    });
    cl.on("clientmoved",function(data){

    });
    cl.on("cliententerview",function(data){
        if(welcomeSent.indexOf(data.clid) == -1){
            welcomeSent.push(data.clid);
            messageQueue.push(getResponse(data.clid,data.invokername,getWelcomeMessage()));
            setTimeout(function(){
                if(welcomeSent.indexOf(data.clid) != -1){
                    welcomeSent.splice(welcomeSent.indexOf(data.clid),1);
                }
            },2000);
        }
    });
    setTimeout(responseQueue,1000);
};
var registerForOneEvent = function(callback,index){
    var eventTypes =  ["server","textserver","textprivate"];
    if(index == eventTypes.length){
        cl.send("servernotifyregister",{event: "channel", id: 1}, function(err, response, rawResponse){
            callback();
        });
        return;
    }
    cl.send("servernotifyregister",{event: eventTypes[index]}, function(err, response, rawResponse){
    
    });
    setTimeout(registerForOneEvent,config.TIME_BETWEEN_QUERIES,callback,++index);
};

var operate = function(){
    setTimeout(sendCommand,config.TIME_BETWEEN_QUERIES,"login",{client_login_name: config.botlogin, client_login_password: config.botpass}, function(response,err){
        setTimeout(sendCommand,config.TIME_BETWEEN_QUERIES,"use",{ sid: 1}, function(response,err){
            setTimeout(sendCommand,config.TIME_BETWEEN_QUERIES,"clientupdate",{client_nickname : "HerGGuBot (BOT)"}, function(response,err){
                console.log("Registering to notifyevents...");
                setTimeout(registerForOneEvent,config.TIME_BETWEEN_QUERIES,afterRegister,0);
            });
        });
    });
};
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var getWelcomeMessage = function(){
    var options = ["Hojo Hojo!", "Hello!", "Hey there!", "What's up?","Hi!", "Hey!", "Sup?" , "Howdy!", "Well hello!", "Yo.", "Greetings!", "Look who it is!", "I've been waiting for you!"];
    var message = "\n";
    message += options[getRandomInt(0,options.length-1)];
    message += " I'm your personal slave and assistant! Currently available commands: \n \n";
    message += "    !help Displays a full list of commands. \n";
    message += "    !survey Sends you a link to the latest strawpoll. \n";
    message += "    !ignore Adds you to the ignore list and I won't message you anymore. \n";
    message += "    !stats Sends you your tessustats statistics. \n \n";
    //message += "    !rps (r|p|s)(planned) Rock paper scissors game \n \n";
    message += "I will also deliver important server notifications and do some light server adminstration. \n";
    message += "Complaints, feature suggestions, comments or questions can be directed to Arnold. I hope you enjoy your time here!";
    return message;

};

var getHelpMessage = function(){
    var message = "\n \n";
    message += "    !help Displays a full list of commands. \n";
    message += "    !survey Sends you a link to the latest strawpoll. \n";
    message += "    !ignore Adds you to the ignore list and I won't message you anymore. \n";
    message += "    !stats Sends you your tessustats statistics. \n \n";
    message += "Contact Arnold if you have any problems or questions";
    return message;

};

module.exports = {
    activate : function(){
       operate();
    }
}*/