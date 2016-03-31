DROP TABLE IF EXISTS ignorelist;
DROP TABLE IF EXISTS serverchatlog;
DROP TABLE IF EXISTS privatechatlog;
DROP TABLE IF EXISTS actionlog;
DROP TABLE IF EXISTS serveractionlog;
DROP TABLE IF EXISTS errorlog;
DROP TABLE IF EXISTS mutedusers;

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
text TEXT
);

CREATE TABLE serveractionlog
(
date datetime,
text TEXT,
actiontype TEXT
);

CREATE TABLE errorlog
(
date datetime,
errormessage TEXT,
reporter TEXT
);

CREATE TABLE mutedusers
(
expires datetime,
databaseid INTEGER,
username TEXT
);