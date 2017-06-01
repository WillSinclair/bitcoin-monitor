const $ = require('jquery');
const remote = require('electron').remote;
const win = remote.getCurrentWindow();
const CoinMonitor = require('./coin-monitor');
const bootstrap = require('bootstrap');
var settings = remote.getGlobal('settings');
var monitor = new CoinMonitor(settings);


$("#spot-price-update-button").on('click', function () {
	monitor.getSpotPrice((err, res) => {
		if (err) return console.log(err);
		var data = JSON.parse(res);
		console.log(data.ticker);
		$("#current-price-display").text("$" + data.data.amount + " " + data.data.currency);
	});
	return false;
});