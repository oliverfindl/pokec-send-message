# pokec-send-message

[![npm](https://img.shields.io/npm/v/pokec-send-message.svg?style=flat)](https://www.npmjs.com/package/pokec-send-message)
[![npm](https://img.shields.io/npm/dt/pokec-send-message.svg?style=flat)](https://www.npmjs.com/package/pokec-send-message)
[![npm](https://img.shields.io/npm/l/pokec-send-message.svg?style=flat)](https://www.npmjs.com/package/pokec-send-message)
[![paypal](https://img.shields.io/badge/donate-paypal-blue.svg?colorB=0070ba&style=flat)](https://paypal.me/oliverfindl)

Simple wrapper class for sending messages to chatrooms on [Pokec](https://pokec.azet.sk/) social network.

> This package cannot send RP messages.

---

## Install

Via [npm](https://npmjs.com/) [[package](https://www.npmjs.com/package/pokec-send-message)]:
```bash
$ npm install pokec-send-message
```

Via [yarn](https://yarnpkg.com/en/) [[package](https://yarnpkg.com/en/package/pokec-send-message)]:
```bash
$ yarn add pokec-send-message
```

## Usage

```javascript
// require lib
const PokecAPI = require("pokec-send-message");

// init lib
const pokec = new PokecAPI();

// get list of pokec chatrooms
pokec.getRooms().then(console.log).catch(console.error);

// login to pokec
pokec.login(
	"username",
	"password"
).then(response => {
	console.log(response);
	
	// send message
	pokec.sendMessage(
		"hello :)", // message
		9, // room id, for list of available rooms use getRooms method
		"somebody" // [optional] for user, defaults to "all"
	).then(console.log).catch(console.error);

	// set interval for ping
	setInterval(() => pokec.ping().then(console.log).catch(console.error));

}).catch(console.error);
```

---

## License

[MIT](http://opensource.org/licenses/MIT)
