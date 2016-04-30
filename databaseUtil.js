var config = require('./config');
var sqlite3 = require('sqlite3').verbose();
var database = new sqlite3.Database(config.database_path);
var fs = require('fs');

module.exports = {
	resetDatabase : function(){
        var sql = [
	        "DROP TABLE IF EXISTS ignorelist;",
	        "DROP TABLE IF EXISTS serverchatlog;",
	        "DROP TABLE IF EXISTS privatechatlog;",
	        "DROP TABLE IF EXISTS actionlog;",
            "DROP TABLE IF EXISTS serveractionlog;",
            "DROP TABLE IF EXISTS errorlog;",
            "DROP TABLE IF EXISTS mutedusers;",

	        "CREATE TABLE ignorelist",
	        "(",
	        "date datetime,",
	        "databaseid INTEGER",
	        ");",

	        "CREATE TABLE serverchatlog",
	        "(",
	        "date datetime,",
	        "text TEXT,",
	        "sender TEXT,",
	        "databaseid INTEGER",
	        ");",

	        "CREATE TABLE privatechatlog",
	        "(",
	        "date datetime,",
	        "text TEXT,",
	        "sender TEXT,",
	        "databaseid INTEGER",
	        ");",

	        "CREATE TABLE actionlog",
	        "(",
	        "date datetime,",
	        "text TEXT",
	        ");",

            "CREATE TABLE serveractionlog",
            "(",
            "date datetime,",
            "text TEXT,",
            "actiontype TEXT",
            ");",

			"CREATE TABLE errorlog",
			"(",
			"date datetime,",
			"errormessage TEXT,",
			"reporter TEXT",
			");",

			"CREATE TABLE mutedusers",
            "(",
            "expires datetime,",
            "databaseid INTEGER,",
            "username TEXT",
		];
        database.exec(sql.join(""));
    },
    logError : function(errormessage, reporter){
    	database.run("INSERT INTO errorlog (date,errormessage,reporter) VALUES (?,?,?)",new Date(), errormessage, reporter);
    },
    logAction : function(actionString) {
        database.run("INSERT INTO actionlog (text,date) VALUES (?,?)",actionString,new Date());
    },
    writeConfigJS : function(file){
    	var stream = fs.createWriteStream("config.js");
    	stream.once('open', function(fd) {
  			stream.write(file.content);
  			stream.end();
		});
		stream.on('finish', () => {
  			logAction("Finished writing config.js");
		});
		stream.on('error', () => {
  			logError("Error while writing config.js","database-util");
		});
    }
};