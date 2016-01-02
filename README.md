# HerGGuBot #

Module based Node.js TeamSpeak 3 bot. It utilizes TeamSpeaks own ServerQuery API and is fully configurable. 

###Install###
Check that you have npm installed.
Run this oneliner to install:
```
#!shell

git clone https://bitbucket.org/Arap/herggubot.git; cd herggubot; npm install 
```

Then, edit the configuration file **config.js**

To do a quick run:

```
#!shell

node start.js
```

Example config.js


```
#!Shell

var config = {};

config.VIRTUAL_SERVER_ID = 1;
config.TS_IP = "mytsdomain.com";
config.DATABASE_PATH = 'botdatabase';
config.SERVERQUERY_USERNAME = "ExampleUsername";
config.SERVERQUERY_PASSWORD = "ExamplePassword";
config.QUERY_TIME_LIMIT = 1;
config.NICKNAME = "HerGGuBot";
config.resetDatabase = false;

config.DEBUG_NETWORK = false;
config.launchBotOnStartUp = true;
//------------------------------------
// MODULES
//------------------------------------
config.module_monitor_chat = {
	enabled: true,
	spam_message : "Please do not spam the server chat.",
	spam_limit: 4,
	spam_timeframe: 5000
};

config.module_monitor_channel_slots = {
	enabled: true,
	channel_delete_time: 5
};

config.module_extra_logs = {
	enabled: true
};

config.module_web_interface = {
	enabled: true,
	port: 9090
};

module.exports = config;
```


## Modules ##

### monitor-chat ###

A module to prevent spamming in the server chat. Automatically detects spamming and kicks the spammer.

Config

```
#!Shell

config.module_monitor_chat = {
	enabled: true, // true|false 
	spam_message : "Please do not spam the server chat.", //Custom kick-message (String)
	spam_limit: 4, //How many messages is allowed in a time-span
	spam_timeframe: 5000 //How long the time-span is (ms)
};
```


### monitor-limited-slot-channels ###

A module to maintain public channels that have limited slot property.  Creates new channels when they are being used and deletes the empty unused ones.
When this is  enabled, create channels ending with 
```
#!Shell

(Max. #)
```
 where # is the number of max limit of users in the channel. The module automatically detects them and does everything else for you!

Config

```
#!Shell

config.module_monitor_channel_slots = {
	enabled: true, // true|false
	channel_delete_time: 5 //The amount of seconds channel has to be empty before it gets deleted
};
```


### extra-logs ###

A module that saves server logs to a database. It listens for events from the Teamspeak server (for example Server edit, channel edit, channel joins, server chat, kicks , bans) and saves them.
This is recommended if you use web-server module.

Config


```
#!Shell

config.module_extra_logs = {
	enabled: true // true|false
};
```

### web-server ###

A module that creates a small admin panel where you can browse the logs of the bot. Useful when figuring out who has done harm in the server (kicking people or something)
Recommended to have extra-logs module enabled. 

Config


```
#!Shell

config.module_web_interface = {
	enabled: true, // true|false
	port: 9090 //The port the webserver binds to
};
```


### License ###

```
#!license

The MIT License (MIT)

Copyright (c) 2015 HerGGuBot, HerGGu-team Arttu Siren <arttu.siren@gmail.com> , Hugo Kiiski <hugo.kiiski@hotmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```