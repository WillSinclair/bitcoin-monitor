/*
 * coin-monitor.js
 */

const request = require('request');
const $ = require('jquery');

class CoinMonitor {
	constructor(settings) {
		this.settings = settings;
	}

	getSpotPrice(callback) {
		request({
				url: "https://api.cryptonator.com/api/ticker/btc-cad",
			},
			(error, response, body) => {
				if (error) return callback(new Error('Spot price request failed'));
				return callback(null, body);
			});
	}
}

module.exports = CoinMonitor;