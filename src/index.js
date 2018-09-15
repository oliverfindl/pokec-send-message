/**
 * pokec-send-message v1.0.0 (2018-09-15)
 * Copyright 2018 Oliver Findl
 * @license MIT
 */

"use strict";

/* Require all dependencies */
const { request } = require("https");

/* Define default options object */
const DEFAULT_OPTIONS = Object.freeze({ _verbose: false });

/* Define default cookies object */
const DEFAULT_COOKIES = Object.freeze([ { key: "about_cookie_usage", value: true } ]);

/* Define default token string */
const DEFAULT_TOKEN = "";

/**
 * Simple Pokec Web API wrapper class
 */
class PokecAPI {

	/**
	 * Class constructor accepting options object
	 * @param {Object} options Options object
	 */
	constructor(options = {}) {
		this.$options = Object.freeze(Object.assign({}, DEFAULT_OPTIONS, options));

		this.$patterns = Object.freeze({
			jsonp: /^jsonp\(|\);?$/g
		});

		this._cookies = DEFAULT_COOKIES;
		this._token = DEFAULT_TOKEN;
	}

	/**
	 * Method for obtaining all available rooms
	 * @returns {Promise} Promise object containing grouped rooms by category
	 */
	getRooms() {
		if(this.$options._verbose) console.log("getRooms");

		return new Promise((resolve, reject) => {
			const req = request({
				hostname: "pokec-sklo.azet.sk",
				port: 443,
				path: "/zoznam-miestnosti/",
				method: "GET",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
					"Cookie": this._stringifyCookies(this._cookies)
				}
			}, res => {
				let data = ""; 
				res.on("data", chunk => data += chunk);
				res.on("end", () => {
					try {
						data = JSON.parse(data);
					} catch(error) {
						if(this.$options._verbose) console.error(error);
						reject(new Error("Get rooms json parse failed!"));
					}

					let groups = [];
					data.forEach(group => {
						const g = { // g = group
							_id: group[2],
							title: group[0],
							rooms: []
						};
						if(group[1].length) {
							group[1].forEach(room => {
								const r = { // r = room
									_id: room[1],
									title: room[0],
									chatters: room[2]
								};
								if(r.chatters) {
									g.rooms.push(r);
								}
								//console.log("room", room);
							});
						}
						if(g.rooms.length) {
							groups.push(g);
						}
						//console.log("group", group);
					});

					resolve({
						data: groups
					});
				});
			});
			req.on("error", error => {
				if(this.$options._verbose) console.error(error);
				reject(new Error("Get rooms request failed!"));
			});
			req.end();
		});
	}

	/**
	 * Method for obtaining token and cookies
	 * @param {String} username Account username
	 * @param {String} password Account password
	 * @returns {Promise} Promise object containing token string and cookies array
	 */
	login(username = "", password = "") {
		if(this.$options._verbose) console.log("login", username, password);

		return new Promise((resolve, reject) => {
			if(!username || !password) reject(new Error("Missing required arguments!"));

			this.logout();

			const form = this._stringify({
				"form[username]": username,
				"form[password]": password
			});

			const req = request({
				hostname: "prihlasenie.azet.sk",
				port: 443,
				path: "/overenie?isWap=0",
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
					"Content-Length": form.length,
					"Cookie": this._stringifyCookies(this._cookies)
				}
			}, res => {
				this._cookies = (this._cookies || []).concat(this._parseCookies(res.headers["set-cookie"])).filter(cookie => cookie.key !== "loginToken");
				
				let data = ""; 
				res.on("data", chunk => data += chunk);
				res.on("end", () => {
					const token = data.match(/i9[\"\' =]+(.+?)[\"\' ;]+/);
					if(token && token.length === 2) {
						this._token = token.pop();
						
						resolve({
							data: {
								token: this._token,
								cookies: this._cookies
							}
						});
					} else {
						reject(new Error("Login failed!"));
					}
				});
			});
			req.on("error", error => {
				if(this.$options._verbose) console.error(error);
				reject(new Error("Login request failed!"));
			});
			req.write(form);
			req.end();
		});
	}

	/**
	 * Method for clearing token and cookies
	 * @returns {Object} Object containing token string and cookies array
	 */
	logout() {
		if(this.$options._verbose) console.log("logout");

		this._cookies = DEFAULT_COOKIES;
		this._token = DEFAULT_TOKEN;

		return {
			token: this._token,
			cookies: this._cookies
		};
	}

	/**
	 * Method for sending message (this is not RP)
	 * @param {String} message Message to send
	 * @param {Number} roomId ID of room to which should be message sent
	 * @param {String} to Name of user to which should be message sent
	 * @returns {Promise} Promise containing nothing
	 */
	sendMessage(message = "", roomId = 0, to = "all") {
		if(this.$options._verbose) console.log("sendMessage", message, roomId, to);

		return new Promise((resolve, reject) => {
			if(!this._token) reject(new Error("Login required!"));

			if(!message || !roomId || !to) reject(new Error("Missing required arguments!"));

			const form = this._stringify({
				idRoom: roomId | 0,
				message,
				to
			});

			const req = request({
				hostname: "pokec-sklo.azet.sk",
				port: 443,
				path: `/_s/sklo/posliPrispevok.php?i9=${this._token}`,
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
					"Content-Length": form.length,
					"Cookie": this._stringifyCookies(this._cookies)
				}
			}, res => {
				let data = ""; 
				res.on("data", chunk => data += chunk);
				res.on("end", () => {
					try {
						data = JSON.parse(data);
					} catch(error) {
						if(this.$options._verbose) console.error(error);
						reject(new Error("Send message json parse failed!"));
					}

					if(data.hasOwnProperty("sendMessage") && data.sendMessage === 1) {
						resolve();
					} else {
						let error = "Send message failed!";
						if(data.hasOwnProperty("errorMessage") && data.errorMessage.length) {
							error += " " + data.errorMessage;
						}
						reject(new Error(error));
					}
				});
			});
			req.on("error", error => {
				if(this.$options._verbose) console.error(error);
				reject(new Error("Send message request failed!"));
			});
			req.write(form);
			req.end();
		});
	}

	/**
	 * Method for obtaining status data
	 * @returns {Promise} Promise object containing all status data
	 */
	ping() {
		if(this.$options._verbose) console.log("ping");

		return new Promise((resolve, reject) => {
			if(!this._token) reject(new Error("Login required!"));

			const req = request({
				hostname: "pokec.azet.sk",
				port: 443,
				path: `/_s/system/ping.php?i9=${this._token}&callback=jsonp&st=&cf=0&_=${new Date().getTime()}`,
				method: "GET",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
					"Cookie": this._stringifyCookies(this._cookies)
				}
			}, res => {
				let data = ""; 
				res.on("data", chunk => data += chunk);
				res.on("end", () => {
					try {
						data = JSON.parse(data.replace(this.$patterns.jsonp, ""));
					} catch(error) {
						if(this.$options._verbose) console.error(error);
						reject(new Error("Ping json parse failed!"));
					}

					resolve({
						data
					});
				});
			});
			req.on("error", error => {
				if(this.$options._verbose) console.error(error);
				reject(new Error("Ping request failed!"));
			});
			req.end();
		});
	}

	/**
	 * Private method for stringifying object
	 * @param {Object} object Object to stringify 
	 * @returns {String} Stringified object 
	 */
	_stringify(object = {}) {
		if(this.$options._verbose) console.log("_stringify", object);

		if(!object) return;

		return Object.keys(object).map(key => [key, object[key]].join("=")).join("&");
	}

	/**
	 * Private method for parsing cookies
	 * @param {Array} cookies Array of cookies to parse
	 * @returns {Array} Parsed cookie array
	 */
	_parseCookies(cookies = []) {
		if(this.$options._verbose) console.log("_parseCookies", cookies);

		if(!cookies) return;

		if(!Array.isArray(cookies)) cookies = Array.from(cookies);

		let array = [];
		cookies.forEach(cookie => {
			let [key, value] = cookie.split(";").shift().trim().split("=");
			array.push({
				key: key,
				value: value
			});
		});

		return array;
	}

	/**
	 * Private method for stringifying cookies
	 * @param {Array} cookies Array of cookies to stringify
	 * @returns {String} Stringified cookie array
	 */
	_stringifyCookies(cookies = []) {
		if(this.$options._verbose) console.log("_stringifyCookies", cookies);

		if(!cookies) return;

		if(!Array.isArray(cookies)) cookies = Array.from(cookies);

		return cookies.map(cookie => [cookie.key, cookie.value].join("=")).join(";");
	}

};

module.exports = PokecAPI;
