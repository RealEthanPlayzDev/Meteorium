# Meteorium
A Discord bot developed by RadiatedExodus (RealEthanPlayzDev) as a side (and personal) project, written in Javascript using Node.js and Discord.js, also being used as a way for me to learn JavaScript and TypeScript.

Since the ts rewrite, some of the source might ressemble [PojavBot](https://github.com/PojavLauncherTeam/PojavBot) as I took some references from there.

## UNSTABLE - THIS IS A FULL REWRITE
This branch is a full rewrite, not all features have been implemented!

## INACTIVE DEVELOPMENT
This bot will enter a inactive development state, feel free to make a pr if you want to add or change something, however I sort of lost the motivation to work on this bot, this also means there will be no TypeScript rewrite most likely, additionally Heroku is going to stop giving free dynos by the end of November, and I don't have any other way to host it (even self-hosting isn't possible yet for me at the time I am writing this), this basically killed my motivation completely to work on this hobby project, I don't know if I will ever come back to this or not, but I suppose that's all I have to say.

## Installing required dependencies
TODO: Redo this section since ts rewrite changed how it works

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
```
