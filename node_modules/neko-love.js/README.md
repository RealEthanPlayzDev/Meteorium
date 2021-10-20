[![npm](https://img.shields.io/npm/v/neko-love.js.svg)](https://www.npmjs.com/package/neko-love.js)
[![npm](https://img.shields.io/npm/dt/neko-love.js.svg?maxAge=3600)](https://www.npmjs.com/package/neko-love.js)
[![install size](https://packagephobia.now.sh/badge?p=neko-love.js)](https://packagephobia.now.sh/result?p=neko-love.js)

 
[![NPM](https://nodei.co/npm/neko-love.js.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/neko-love.js/)


# Neko-love.JS
Official module of the Neko-Love API

## Installation
```
npm install neko-love.js --save
```

## Example

Await/Async example
```js
const Neko = require('neko-love.js');

async function test() {
  console.log(await Neko("neko")); // https://neko-love.xyz/v1/neko/neko-love_314.png
}
test();


```

Promise example
```js
const Neko = require("neko-love.js");

Neko("neko").then((url) => {
    console.log(url); // https://neko-love.xyz/v1/neko/neko-love_314.png
});
```

## Endpoints

### SFW

| Function | Description |
| -------- | ----------- |
| `neko` | Get a URL of a neko image |
| `slap` | Gets a URL of a slap image/gif |
| `pat`  | Get a URL of a pat image/gif |
| `kiss` | Get a URL of a kiss image/gif |
| `hug`  | Get a URL of a hug image/gif |
| `kitsune` | Get a URL of a fox girl image |
| `pat` | Get a URL of a pat image/gif |
| `cry` | Get a URL of a cry image/gif |
| `waifu` | Get a URL of a waifu image |

### NSFW

| Function | Description |
| -------- | ----------- |
| `nekolewd` | Get a URL of a neko hentai image |


[Full Neko Love API documentation](https://docs.neko-love.xyz/)

## Links

*   [Website](https://neko-love.xyz)
*   [Documentation](https://docs.neko-love.xyz/)
*   [Discord](https://discord.gg/byThR3v)
*   [NPM](https://npmjs.com/neko-love.js)
