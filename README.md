# Meteorium
A Discord bot developed by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev) as a side (and personal) project, written in Javascript using Node.js and Discord.js, also being used as a way for me to learn Javascript.

## Installing required dependencies
You must have ffmpeg/avconv installed in your system. (only ffmpeg was tested, you can use ``ffmpeg-static`` from npm aswell to install ffmpeg)
Simply do ``npm i``/``npm install`` on the root directory or do the following command:
```
npm i @discordjs/builders @discordjs/rest @discordjs/voice axios discord-api-types discord.js holodex.js mongoose neko-love.js ytdl-core
npm i discord-player @discordjs/opus --save
```

## Configuration file
The ``config.json`` is normally under .gitignore and is required for the bot to run, the file content example is shown below:
```
{
    "mongodb_urlstring": "insert mongodb server url connection here",
    "token": "token here",
    "prefix": "mt!",
    "applicationId": "application id here",
    "targetGuildIds": [
        "put guild ids where you want to register interaction commands into (or leave empty)"
    ],
    "holodexApiKey": "holodex api key here, optional, see https://holodex.stoplight.io/docs/holodex/ZG9jOjQ2Nzk1-getting-started",
    "ratelimitMaxLimit": put a number here (like 20), this controls on the max amount of time the bot can reconnect under ``ratelimitMaxLimitTime`` seconds,
    "ratelimitMaxLimitTime": put a number here (like 5), this controls ``ratelimitMaxLimit``, also it's in seconds
}
```

## Running the bot
The bot is using discord.js v13, which requires node.js v16, make sure you have node.js v16 before attempting to run the bot (otherwise it will crash)

## TODO(s)
- [ ] Use .env instead of a plain text config json