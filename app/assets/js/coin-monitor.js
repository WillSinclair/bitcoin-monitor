/*
 * coin-monitor.js
 */

const request = require('request');
const $ = require('jquery');
const fs = require('fs');
const os = require('os');
const moment = require('moment-timezone');
const Highcharts = require('highcharts');
require('highcharts/modules/exporting')(Highcharts);

class CoinMonitor {
	constructor() {
		this.settingsDir = os.homedir() + "/.crypto-monitor";
		this.settingsPath = this.settingsDir + "/config.json";
		this.init();
	}

	init() {
		// either import or use defaultm settings
		this.getSettings();
		// get the conversion rates that CEX.io doesn't provide
		this.getConversionRates();
		// get the spot price to display
		this.getSpotPrice();
		// get the 24hr price history for the chart
		this.getPriceHistory();

		// update the spot price (defaults to 5 sec)
		setInterval(() => {
			this.getSpotPrice();
		}, this.settings.refreshrate);
	}


	/**
	 * Gets the USD->CAD and the USD->GBP conversion rates
	 */
	getConversionRates() {
		// CEX.io doesn't provide price data in CAD, so we have to convert manually
		request({
			url: 'http://free.currencyconverterapi.com/api/v3/convert?q=USD_CAD'
		}, (error, response, body) => {
			if (error) console.log(error);
			var data = JSON.parse(body).results.USD_CAD.val;
			this.usd_cad = Number(data);
		});
		// CEX.io also doesn't perform ETH -> GBP, so we have to conver that as well
		request({
			url: 'http://free.currencyconverterapi.com/api/v3/convert?q=USD_GBP'
		}, (error, response, body) => {
			if (error) console.log(error);
			var data = JSON.parse(body).results.USD_GBP.val;
			this.usd_gbp = Number(data);
		});
	}

	/**
	 * Creates the Highcharts price graph
	 */
	getPriceHistory() {
		var convertBackCAD = false; // store whether we have to convert back to CAD
		var convertBackGBP = false; // also store the same for GBP
		var url = "https://cex.io/api/price_stats/" + this.settings.baseCurrency + "/";
		if (this.settings.targetCurrency == "CAD") {
			// we have to convert CAD manually because CEX.io doesn't convert to CAD
			convertBackCAD = true;
			url += "USD";
		} else if (this.settings.targetCurrency == "GBP" && this.settings.baseCurrency == "ETH") {
			// CEX.io also doesn't convert ETH to GBP, so we have to do that manually as well
			convertBackGBP = true;
			url += "USD";
		} else {
			url += this.settings.targetCurrency;
		}
		// guess the user's timezone and get the offset in minutes
		var zone = moment.tz.zone(moment.tz.guess());
		var timezoneOffset = zone.parse(Date.UTC());

		request.post(url, {
			form: {
				"lastHours": this.settings.numHours,
				"maxRespArrSize": 101
			}
		}, (error, response, body) => {
			if (error) console.log(error);
			var data = JSON.parse(body);
			// chart options
			var options = {
				chart: {
					backgroundColor: null,
					spacingBottom: 25,
					marginTop: 50,
					type: 'line',
					reflow: true,
					animation: false
				},
				plotOptions: {
					series: {
						animation: false,
						marker: {
							enabled: false
						}
					}
				},
				title: {
					text: ''
				},
				xAxis: {
					type: 'datetime',
					lineColor: "#444",
					tickColor: "#444"
				},
				yAxis: {
					title: {
						text: ''
					},
					gridLineColor: "#444",
				},
				tooltip: {
					backgroundColor: "rgba(247,247,247,0.6)",
					valueDecimals: 2,
					borderWidth: 0,
					borderRadius: 5,
					hideDelay: 50
				},
				legend: {
					enabled: false
				},
				exporting: {
					enabled: false
				},
				series: [{
					name: this.settings.baseCurrency + ' Price',
					data: [],
					color: '#00bc8c'
				}],
				credits: {
					enabled: false
				}
			};

			// set the chart's time offset (timestamps come in UTC time)
			Highcharts.setOptions({
				global: {
					timezoneOffset: timezoneOffset,
					useUTC: false
				}
			});
			// plot the data
			this.chart = Highcharts.chart('mid-bar-highcharts-graph', options);
			for (var i = 0; i < data.length; i++) {
				var item = data[i];
				// get the price
				var price = Number(item.price);
				if (convertBackCAD) {
					price *= this.usd_cad;
				} else if (convertBackGBP) {
					price *= this.usd_gbp;
				}
				var time = Number(item.tmsp) * 1000;
				this.chart.series[0].addPoint([time, price]);
			}
			$("#chart-loader").hide();
			$("#mid-bar-highcharts-graph").show();
		});
	}

	/**
	 * Clears and reinitializes the price chart
	 */
	refreshPriceHistory() {
		// show a loading animation
		$("#mid-bar-highcharts-graph").hide();
		$("#chart-loader").show();
		// empty the chart data
		this.chart.series[0].setData([]);
		var convertBackCAD = false; // store whether we have to convert back to CAD
		var convertBackGBP = false; // also store the same for GBP		
		var url = "https://cex.io/api/price_stats/" + this.settings.baseCurrency + "/";
		if (this.settings.targetCurrency == "CAD") {
			convertBackCAD = true;
			url += "USD";
		} else if (this.settings.targetCurrency == "GBP" && this.settings.baseCurrency == "ETH") {
			convertBackGBP = true;
			url += "USD";
		} else {
			url += this.settings.targetCurrency;
		}

		request.post(url, {
			form: {
				"lastHours": this.settings.numHours,
				"maxRespArrSize": 101 // this makes the last tick 15 mins more current
			}
		}, (error, response, body) => {
			if (error) console.log(error);
			var data = JSON.parse(body);
			// plot the data			
			for (var i = 0; i < data.length; i++) {
				var item = data[i];
				// get the price
				var price = Number(item.price);
				if (convertBackCAD) {
					price *= this.usd_cad;
				} else if (convertBackGBP) {
					price *= this.usd_gbp;
				}
				var time = Number(item.tmsp) * 1000;
				this.chart.series[0].addPoint([time, price]);
			}
			// show the chart
			$("#chart-loader").hide();
			$("#mid-bar-highcharts-graph").show();
		});
	}

	/**
	 * Gets the last sell price
	 */
	getSpotPrice() {
		var convertBackCAD = false; // store whether or not we have to convert back to CAD
		var convertBackGBP = false; // store whether or not we have to convert back to GBP
		var symbol = "$";
		if (this.settings.targetCurrency == "EUR") {
			symbol = "€"
		} else if (this.settings.targetCurrency == "GBP") {
			symbol = "£"
		}
		var url = "https://cex.io/api/ticker/" + this.settings.baseCurrency + "/";
		if (this.settings.targetCurrency == "CAD") {
			convertBackCAD = true;
			url += "USD";
		} else if (this.settings.targetCurrency == "GBP" && this.settings.baseCurrency == "ETH") {
			convertBackGBP = true;
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
				if (convertBackCAD) {
					price = (Math.round(price * 100 * this.usd_cad) / 100).toFixed(2);
					volume = (Math.round(volume * 100 * this.usd_cad) / 100).toFixed(2);
				} else if (convertBackGBP) {
					price = (Math.round(price * 100 * this.usd_gbp) / 100).toFixed(2);
					volume = (Math.round(volume * 100 * this.usd_gbp) / 100).toFixed(2);
				}
				$("#current-price-loader").hide();
				$("#current-price-display").show();
				$("#current-price-display").text(symbol + price + " " + this.settings.targetCurrency);
				$("#daily-volume-display").text("Volume: " + symbol + volume);
			});
	}


	/**
	 * Gets the settings from $HOME/.crypto-monitor/config.json
	 */
	getSettings() {
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
				refreshrate: 5000,
				numHours: 24
			};
			this.settings = defaultSettings;
			fs.writeFile(this.settingsPath, JSON.stringify(defaultSettings), {
				encoding: 'utf8'
			}, (err) => { /* eat the error */ });
		}
		// set the UI elements with the values from settings
		// base currency
		$("#base-currency-header").text(this.settings.baseCurrency);
		$("#base-currency-display").text(this.settings.baseCurrency);
		// target currency
		$("#target-currency-display").text(this.settings.targetCurrency);
	}

	/**
	 * Updates a setting and writes it to the config file
	 * @param {string} name 
	 * @param {string} value 
	 */
	updateSetting(name, value) {
		var tempSettings = this.settings;
		tempSettings[name] = value;
		this.settings = tempSettings;
		this.changeUiFromSetting(name, value);
		fs.writeFile(this.settingsPath, JSON.stringify(tempSettings), {
			encoding: 'utf8'
		}, (err) => { /* eat the error */ });
	}

	/**
	 * [Updates UI elements to reflect settings changes]
	 * @param {string} name 
	 * @param {string} value 
	 */
	changeUiFromSetting(name, value) {
		switch (name) {
			case 'baseCurrency':
				$("#base-currency-header").text(value);
				$("#base-currency-display").text(value);
				this.getSpotPrice();
				this.refreshPriceHistory();
				break;
			case 'targetCurrency':
				$("#target-currency-display").text(value);
				this.refreshPriceHistory();
				break;
			case 'numHours':
				this.refreshPriceHistory();
				break;
		}
	}
}

module.exports = CoinMonitor;