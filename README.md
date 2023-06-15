# Meteorium
A Discord bot developed by RadiatedExodus (RealEthanPlayzDev) as a side (and personal) project, written in Javascript using Node.js and Discord.js, also being used as a way for me to learn JavaScript and TypeScript.

Since the ts rewrite, some of the source might ressemble [PojavBot](https://github.com/PojavLauncherTeam/PojavBot) as I took several references from there.

## UNSTABLE - THIS IS A FULL REWRITE
This branch is a full rewrite, not all features have been implemented!

## Installing required dependencies
Ensure ``yarn`` is installed (``npm install --global yarn``), then just run it at the root of the repository
```
yarn
```

## Building and running
To build:
```
yarn compile
```

To run the bot:
```
yarn start
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
GENIUSAPIKEY=genius_api_key_here
```

## Credits
- [discord.js](https://github.com/discordjs/discord.js)
- [holodex.js](https://github.com/HolodexNet/holodex.js)
- [noblox.js](https://github.com/noblox/noblox.js)
- [mongodb](https://github.com/mongodb/node-mongodb-native)
- [dotenv](https://github.com/motdotla/dotenv)
- [neko-love](https://github.com/Androz2091/neko-love)

## Acknowledgements
- All discord.js contributors and authors
- All holodex.js contributors and authors
- All noblox.js contributors and authors
- All mongodb contributors and authors
- All dotenv contributors and authors
- All [neko-love.xyz](https://neko-love.xyz) (and neko-love) contributors and authors
- Syjalo
