/*
 * coin-monitor.js
 */

const request = require('request');
const $ = require('jquery');
const fs = require('fs');
const os = require('os');

class CoinMonitor {
	constructor() {
		this.settingsDir = os.homedir() + "/.bitcoin-monitor";
		this.settingsPath = this.settingsDir + "/config.json";
		this.refreshSettings();
		this.getSpotPrice();

		setInterval(() => {
			this.getSpotPrice();
		}, this.settings.refreshrate);
	}

	getSpotPrice() {
		var base = this.settings.baseCurrency.toLowerCase();
		var target = this.settings.targetCurrency.toLowerCase();
		request({
				url: "https://api.cryptonator.com/api/ticker/" + base + "-" + target
			},
			(error, response, body) => {
				if (error) console.log('oops');
				var data = JSON.parse(body).ticker;
				console.log(data);
				data.price = Math.round(data.price * 100) / 100;
				$("#current-price-display").text("$" + data.price + " " + data.target);
			});
	}

	refreshSettings() {
		// create the app's home folder if it doesn't exist
		if (!fs.existsSync(this.settingsDir)) {
			fs.mkdirSync(this.settingsDir);
		}
		// if the config file exists
		if (fs.existsSync(this.settingsPath)) {
			// read it into the object
			this.settings = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
		}
		// if no config file exists
		else {
			// write one with default settings
			var defaultSettings = {
				baseCurrency: "BTC",
				targetCurrency: "CAD",
				refreshrate: "3000"
			};
			this.settings = defaultSettings;
			fs.writeFile(this.settingsPath, JSON.stringify(defaultSettings), {
				encoding: 'utf8'
			});
		}
		this.setUiFromSettings();
	}

	updateSetting(name, value) {
		try {
			var tempSettings = this.settings;
			tempSettings.name = value;
			this.settings = tempSettings;
			this.changeUiFromSetting(name, value);
			fs.writeFile(this.settingsPath, JSON.stringify(tempSettings), {
				encoding: 'utf8'
			});
		} catch (Error) {
			console.log('Failed to set setting' + name + ' to ' + value);
		}
	}

	changeUiFromSetting(name, value) {
		switch (name) {
			case 'baseCurrency':
				$("#base-currency-display").text(value);
				break;
			case 'targetCurrency':
				$("#target-currency-display").text(value);
				break;
		}
	}

	setUiFromSettings() {
		// base currency
		$("#base-currency-display").text(this.settings.baseCurrency);
		// target currency
		$("#target-currency-display").text(this.settings.targetCurrency);
	}
}

module.exports = CoinMonitor;