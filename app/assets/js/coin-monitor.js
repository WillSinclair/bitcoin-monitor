/*
 * coin-monitor.js
 */

const request = require('request');
const $ = require('jquery');
const fs = require('fs');
const os = require('os');
const Highcharts = require('highcharts');
require('highcharts/modules/exporting')(Highcharts);

class CoinMonitor {
	constructor() {
		this.settingsDir = os.homedir() + "/.bitcoin-monitor";
		this.settingsPath = this.settingsDir + "/config.json";
		this.init();
	}

	init() {
		this.refreshSettings();
		this.getUSDtoCAD();
		this.getSpotPrice();
		this.getPriceHistory();

		setInterval(() => {
			this.getSpotPrice();
		}, this.settings.refreshrate);
	}


	getUSDtoCAD() {
		// cex.io doesn't provide proce data in CAD, so I have to convert
		request({
			url: 'http://free.currencyconverterapi.com/api/v3/convert?q=USD_CAD'
		}, (error, response, body) => {
			if (error) console.log(error);
			var data = JSON.parse(body).results.USD_CAD.val;
			this.usd_cad = data;
		});
	}


	getPriceHistory() {
		request.post('https://cex.io/api/price_stats/BTC/USD', {
			form: {
				"lastHours": 24,
				"maxRespArrSize": 100
			}
		}, (error, response, body) => {
			if (error) console.log(error);
			var data = JSON.parse(body);
			var options = {
				chart: {
					type: 'line',
					marginRight: 30,
					marginBottom: 30,
					reflow: true
				},
				title: {
					text: 'BTC price'
				},
				xAxis: {
					type: 'datetime'
				},
				tooltip: {
					valueDecimals: 2
				},
				legend: {
					enabled: false
				},
				exporting: {
					enabled: false
				},
				series: [{
					name: 'BTC Price',
					data: []
				}]
			};

			this.chart = Highcharts.chart('mid-bar-highcharts-graph', options);
			for (var i = 0; i < data.length; i++) {
				var item = data[i];
				this.chart.series[0].addPoint([item.tmsp * 1000, Number(item.price)]);
			}
		});
	}

	getSpotPrice() {
		var symbol = "$";
		if (this.settings.targetCurrency == "EUR") {
			symbol = "€"
		} else if (this.settings.targetCurrency == "GBP") {
			symbol = "£"
		}
		var url = "https://cex.io/api/ticker/" + this.settings.baseCurrency + "/";
		if (this.settings.targetCurrency == "CAD") {
			url += "USD";
		} else {
			url += this.settings.targetCurrency;
		}
		request({
				url: url
			},
			(error, response, body) => {
				if (error) console.log(error);
				var data = JSON.parse(body);
				var price = (Math.round(data.last * 100) / 100).toFixed(2);
				var volume = (Math.round(data.volume * 100) / 100).toFixed(2);
				if (this.settings.targetCurrency == "CAD") {
					price = (Math.round(price * 100 * this.usd_cad) / 100).toFixed(2);
					volume = (Math.round(volume * 100 * this.usd_cad) / 100).toFixed(2);
				}
				$("#current-price-display").text(symbol + price + " " + this.settings.targetCurrency);
				$("#daily-volume-display").text("Volume: " + symbol + volume);
			});
	}

	refreshSettings() {
		// create the app's home folder if it doesn't exist
		if (!fs.existsSync(this.settingsDir)) {
			fs.mkdirSync(this.settingsDir);
		}
		// if the config file exists
		if (fs.existsSync(this.settingsPath) && this.settings == null) {
			// read it into the object
			this.settings = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
		}
		// if no config file exists
		else {
			// write one with default settings
			var defaultSettings = {
				baseCurrency: "BTC",
				targetCurrency: "USD",
				symbol: "$",
				refreshrate: "5000"
			};
			this.settings = defaultSettings;
			fs.writeFile(this.settingsPath, JSON.stringify(defaultSettings), {
				encoding: 'utf8'
			});
		}
		this.setUiFromSettings();
	}

	updateSetting(name, value, callback) {
		var tempSettings = this.settings;
		tempSettings[name] = value;
		this.settings = tempSettings;
		this.changeUiFromSetting(name, value);
		fs.writeFile(this.settingsPath, JSON.stringify(tempSettings), {
			encoding: 'utf8'
		}, function (err) { /* literally do nothing*/ });
	}

	changeUiFromSetting(name, value) {
		switch (name) {
			case 'baseCurrency':
				$("#base-currency-header").text(value);
				$("#base-currency-display").text(value);
				break;
			case 'targetCurrency':
				$("#target-currency-display").text(value);
				break;
		}
	}

	setUiFromSettings() {
		// base currency
		$("#base-currency-header").text(this.settings.baseCurrency);
		$("#base-currency-display").text(this.settings.baseCurrency);
		// target currency
		$("#target-currency-display").text(this.settings.targetCurrency);
	}
}

module.exports = CoinMonitor;