var config = require('./config');
var sqlite3 = require('sqlite3').verbose();
var database = new sqlite3.Database(config.database_path);

module.exports = {
	resetDatabase : function(){
        var sql = [
	        "DROP TABLE IF EXISTS ignorelist;",
	        "DROP TABLE IF EXISTS serverchatlog;",
	        "DROP TABLE IF EXISTS privatechatlog;",
	        "DROP TABLE IF EXISTS actionlog;",
            "DROP TABLE IF EXISTS serveractionlog;",
            "DROP TABLE IF EXISTS errorlog;",

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
			");"
		];
        database.exec(sql.join(""));
    },
    logError : function(errormessage, reporter){
    	database.run("INSERT INTO errorlog (date,errormessage,reporter) VALUES (?,?,?)",new Date(), errormessage, reporter);
    },
    logAction : function(actionString) {
        database.run("INSERT INTO actionlog (text,date) VALUES (?,?)",actionString,new Date());
    }
};