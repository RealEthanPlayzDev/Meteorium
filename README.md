# Meteorium
A Discord bot developed by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev) as a side (and personal) project, written in Javascript using Node.js and Discord.js, also being used as a way for me to learn Javascript.

## Installing required dependencies
You must have ffmpeg/avconv installed in your system. (only ffmpeg was tested, you can use ``ffmpeg-static`` from npm aswell to install ffmpeg)
Simply do ``npm ci`` on the root directory or do the following command:
```
npm i @discordjs/builders @discordjs/rest @discordjs/voice axios discord-api-types discord.js holodex.js mongoose neko-love.js ytdl-core discord-player @discordjs/opus dotenv ffmpeg-static play-dl youtube-sr --save
```

## Running the bot
TODO: FINISH THIS SECTION!
Since the bot now uses TypeScript, you have to install the ``typescript`` npm module:
```
npm i typescript -G
```

## Configuration file
The configuration file uses ``dotenv``, create a file named ".ENV" on the project root and use the following example:
```
METEORIUMBOTTOKEN=bot_token_here
METEORIUMMONGODBURI=mongodb_uri_here
METEORIUMHOLODEXTOKEN=holodex_token_here_optional
METEORIUMAPPLICATIONID=bot_app_id_here
RATELIMITMAXLIMIT=rate_limit_maximum_limit_before_nodejs_terminates_PUT_A_NUMBER_HERE
RATELIMITMAXLIMITTIME=after_when_should_ratelimit_reset_PUT_A_NUMBER_HERE
DEPLOYGUILDIDS=guildids_for_deployment_seperated_by,commas,and_so_on
```

## Running the bot
The bot is using discord.js v13, which requires node.js v16 or above, make sure you have node.js v16 or above before attempting to run the bot (otherwise it will crash)

## TODO(s)
- [x] Use .env instead of a plain text config json
- [x] Music player
- [x] Use ``play-dl`` instead of ``ytdl-core``
- [ ] TypeScript rewrite!
- [ ] Finish moderation commands