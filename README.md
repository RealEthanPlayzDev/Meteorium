# Meteorium
A Discord bot developed by RadiatedExodus (ItzEthanPlayz_YT/RealEthanPlayzDev) as a side (and personal) project, written in Javascript using Node.js and Discord.js, also being used as a way for me to learn Javascript.

## Configuration file
The ``config.json`` is normally under .gitignore and is required for the bot to run, the file content example is shown below:
```
{
    "token": "token here",
    "prefix": "mt!",
    "applicationId": "application id here",
    "targetGuildIds": [
        "put guild ids where you want to register interaction commands into (or leave empty)"
    ],
    "holodexApiKey": "holodex api key here, optional, see https://holodex.stoplight.io/docs/holodex/ZG9jOjQ2Nzk1-getting-started"
}
```

## Running the bot
The bot is using discord.js v13, which requires node.js v16, make sure you have node.js v16 before attempting to run the bot (otherwise it will crash)