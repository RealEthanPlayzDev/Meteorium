# Retired
As of September 15 2024, Meteorium has officially released EoL and has been retired. No new updates will come anymore.

# Meteorium

This is a hobby Discord bot I've written, the bot is only used for a few servers.
Feel free to look around, make suggestion, and report bugs.

## FULL REWRITE (v3)

This branch is a full rewrite, not all features have been implemented!

## Feature parity with v2

-   [x] Moderation
-   [x] Settings
-   [x] Music
-   [ ] HolodexAPI
-   [ ] MojangAPI
-   [ ] RbxAPI
-   [ ] ServerInfo
-   [ ] UserInfo
-   [ ] Tag
-   [ ] Ping
-   [x] Welcome & left member logging

## Installing required dependencies

Meteorium uses `yarn` to manage Node packages. Ensure `yarn` is installed (`npm install --global yarn`), then just run it at the root of the repository

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
yarn prisma db push
yarn start
```

## Configuration file

See the `.env.example`

## Special thanks

-   [@Abdelrahmanwalidhassan's `ms` fork](https://github.com/Abdelrahmanwalidhassan/ms)
