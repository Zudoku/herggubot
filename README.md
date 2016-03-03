# HerGGuBot #


```
#!Shell

Version: 0.1.1
```


Module based Node.js TeamSpeak 3 bot. It utilizes TeamSpeaks own ServerQuery API and is fully configurable. 

###Install###
Check that you have npm installed.
Run this oneliner to install:
```
#!shell

git clone https://bitbucket.org/Arap/herggubot.git; cd herggubot; npm install 
```

###Installing with Docker###
[What is Docker?](https://docs.docker.com/)

Working DockerFile is provided with the repository:
```
#!shell

git clone https://bitbucket.org/Arap/herggubot.git; cd herggubot;

docker build  -t herggu/herggubot . 
```

###Run###
To run the bot:

```
#!shell

node start.js
```

To make the bot restart on crash:

```
#!shell

node wrapper.js
```

**Example config.js**


```
#!Shell
var config = {};

config.virtual_server_id = 1; 
config.ts_ip = "ExampleTSIP";
config.serverquery_username = "ExampleUsername";
config.serverquery_password = "ExamplePassword";

config.nickname = "HerGGuBot";

config.reset_database = false;
config.database_path = "botdatabase";
config.debug_network = false;
config.wrapper_restart_time = 10;

config.launch_bot_in_startup = true;
//------------------------------------
// MODULES
//------------------------------------
config.module_monitor_chat = {
	enabled: true,
	spam_message : "Please do not spam the server chat.",
	ban_punish: true,
	ban_length: 60,
	spam_limit: 4,
	spam_timeframe: 5000
};

config.tessu_stats_integration = {
        enabled: true,
        site_root: "yourtessustatsdomain.com/"
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

# Config.js #

## Configuration ##

**config.virtual_server_id**

If there are more than 1 virtual server in the Teamspeak server you are in, you might need to change this to the specific one you want the bot to use.
```
#!Shell

config.virtual_server_id = 1 // integer
```


**config.ts_ip**

This should be the TeamSpeak servers IP address / domain-name 
```
#!Shell

config.ts_ip = "ExampleTSIP"; // String
```


**config.serverquery_username**

This should be the ServerQuery account username. If you don't know how to make a serverquery account, [this](http://forum.teamspeak.com/threads/53364-How-can-I-add-a-ServerQuery-User) might help 
```
#!Shell

config.serverquery_username = "ExampleUsername"; // String
```


**config.serverquery_password**

This should be the ServerQuery account password. If you don't know how to make a serverquery account, [this](http://forum.teamspeak.com/threads/53364-How-can-I-add-a-ServerQuery-User) might help 
```
#!Shell

config.serverquery_password = "ExamplePassword"; // String
```

**config.nickname**

The bot will change its visible name to this one after it has connected to the channel. Can be anything, however if an user is present with the same name, it will continue to use the original serverquery login name (Or the teamspeak server will give it its own random name )
```
#!Shell

config.nickname = "HerGGuBot"; // String
```

**config.reset_database**

If the bot should reset the database every time it is launched (BE CAREFUL WITH THIS ONE) This can be used to reset the bots database: 

First close the bot, edit config.reset_database to true and start the server, once it has started, close it down again and edit config.reset_database back to false.
```
#!Shell

config.reset_database = false; // true|false
```

**config.database_path**

The SQLite database filepath. Default is **"botdatabase"**
```
#!Shell

config.database_path = "botdatabase"; //String
```

**config.debug_network**

If set to true, it will print to console every packet coming in and out. Set to false in production.
```
#!Shell

config.debug_network = false; // true|false
```

**config.wrapper_restart_time**

When bot crashes while using wrapper.js the bot will get restarted in *config.wrapper_restart_time* minutes
```
#!Shell

config.wrapper_restart_time = 10; // number (minutes)
```

**config.launch_bot_in_startup**

If this is set to false, It will only try to reset database (if config.reset_database=true) and start the webserver (if config.module_web_interface.enabled=true)
```
#!Shell

config.launch_bot_in_startup = true; // true|false
```

## Modules ##

### monitor-chat ###

A module to prevent spamming in the server chat. Automatically detects spamming and kicks or bans the spammer.
This module also logs the server and private chat and needs to be enabled for text commands used by other modules.

Config

```
#!Shell

config.module_monitor_chat = {
	enabled: true, // true|false 
	spam_message : "Please do not spam the server chat.", //Custom kick-message (String)
	ban_punish: true, //true|false  true = ban false=kick
	ban_length: 60, //Ban time in minutes
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

Example channels:

![examplechannels.png](https://bitbucket.org/repo/5G659X/images/2375189037-examplechannels.png)

Module working:

![channelsinuse.png](https://bitbucket.org/repo/5G659X/images/1580754854-channelsinuse.png)

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

### TessuStats integration ###

A module that enables [TessuStats](https://bitbucket.org/Arap/tessustats) integration by introducing !whoami command. The bot responds with a link to their profile in a TessuStats domain provided in the config.

**NEEDS monitor-chat MODULE TO BE ENABLED TO WORK**

Config


```
#!Shell

config.tessu_stats_integration = {
	enabled: true,
	site_root: "http://tessustats.ovh/app/"   //your domain where your tessustats is exposed to the internet (can also be ip address)
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


### Library documentation and help for developing ###

[node-sqlite3](https://github.com/mapbox/node-sqlite3/wiki/API)

[node-teamspeak](https://www.npmjs.com/package/node-teamspeak)

[Serverquery pdf](http://media.teamspeak.com/ts3_literature/TeamSpeak%203%20Server%20Query%20Manual.pdf)