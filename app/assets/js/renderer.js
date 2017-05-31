const $ = require('jquery');
const remote = require('electron').remote;
const win = remote.win;
const app = remote.app;
const CoinMonitor = require('./coin-monitor');
const bootstrap = require('bootstrap');

var settings = remote.getGlobal('settings');
var monitor = new CoinMonitor(settings);



$("#spot-price-update-button").on('click', function () {
	monitor.getSpotPrice((err, res) => {
		if (err) return console.log(err);
		console.log(res);
	});
	return false;
});