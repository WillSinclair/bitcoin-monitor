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
			url: "https://api.coinbase.com/v2/prices/BTC-CAD/spot",
			headers: {
				"CB-VERSION": "2017-05-31"
			}
		},
			(error, response, body) => {
				if (error) return callback(new Error('Spot price request failed'));
				return callback(null, body);
			});
	}
}

module.exports = CoinMonitor;