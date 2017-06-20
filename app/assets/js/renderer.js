const $ = require('jquery');
const remote = require('electron').remote;
const clipboard = require('electron').clipboard;
const CoinMonitor = require('./coin-monitor');
const bootstrap = require('bootstrap');
const monitor = new CoinMonitor();

$(document).ready(function () {
	var window = remote.getCurrentWindow();
	window.on('resize', function () {
		var size = window.getContentSize();
		monitor.chart.setSize(size[0] - 30, size[1] - 60, true);
	});

	// minimize and close buttons
	document.getElementById('minimize-button').addEventListener('click', () => {
		window.minimize();
	});
	document.getElementById('close-button').addEventListener('click', () => {
		window.close();
	});

	// copy the price to clipboard when the user click on it
	$("#current-price-display").on('click', function () {
		clipboard.writeText($(this).text());
	});

	// dropdown currency selectors
	$("#base-currency-options").find("a").on('click', function () {
		$("#current-price-display").hide();
		$("#current-price-loader").show();
		var newCurrency = $(this).text();
		monitor.updateSetting('baseCurrency', newCurrency);
		monitor.getSpotPrice();
	});

	$("#target-currency-options").find("a").on('click', function () {
		$("#current-price-display").hide();
		$("#current-price-loader").show();
		var newCurrency = $(this).text();
		monitor.updateSetting('targetCurrency', newCurrency);
		monitor.getSpotPrice();
	});

	$(".timespan-option").on('click', (e) => {
		var unit = $(e.target).attr("name");
		var hours;
		switch (unit) {
			case "hour":
				hours = 1;
				break;
			case "day":
				hours = 24;
				break;
			case "week":
				hours = 168;
				break;
			case "month":
				hours = 744;
				break;
		}
		monitor.updateSetting("numHours", hours);
	});

	// notification generation
	$("#new-notification-btn").on('click', function () {
		var newNotification = document.createElement("div");
		newNotification.className = "row justify-content-center";
		newNotification.innerHTML = `
		<div class="col col-2">
			<button class="btn btn-outline-success dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">BTC</button>
			<div class="dropdown-menu">
				<a class="dropdown-item" href="#">BTC</a>
				<a class="dropdown-item" href="#">ETH</a>
			</div>
		</div>
		<div class="col col-10">
			<div class="input-group">
				<div class="input-group-addon">$</div>
				<input type="text" class="form-control" id="exampleInputAmount" placeholder="Amount">
				<div class="input-group-addon btn-group">
					<button class="btn btn-sm btn-secondary dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">BTC</button>
					<div class="dropdown-menu">
						<a class="dropdown-item" href="#">USD</a>
						<a class="dropdown-item" href="#">CAD</a>
						<a class="dropdown-item" href="#">EUR</a>
						<a class="dropdown-item" href="#">GBP</a>
					</div>
				</div>
				<button type="button" class="close notification-delete-btn">
					<span aria-hidden="true">&times;</span>
				</button>
			</div>
		</div>`;
		$("#notifications-area").append(newNotification);
		$("#notifications-area-placeholder").hide();
		$(".notification-delete-btn").on('click', function () {
			$(this).parent().parent().parent().remove();
			if ($("#notifications-area div").length == 0) {
				$("#notifications-area-placeholder").show();
			}
		});
	});

	// chart toggle button
	$("#show-price-chart-btn").on('click', function () {
		if ($("#mid-bar-price-content").is(':visible')) {
			var windowSize = (window.getContentSize());
			monitor.chart.setSize(windowSize[0] - 30, windowSize[1] - 50, true);
			$("#mid-bar-price-content").hide();
			$("#highcharts-outer-container").show();
			$("#mid-bar-highcharts-graph").show();
			$("#show-price-chart-btn").text("Spot Price");
			$("#timespan-btns").show();
			console.log($(this).text());
		} else {
			$("#mid-bar-price-content").show();
			$("#highcharts-outer-container").hide();
			$("#mid-bar-highcharts-graph").hide();
			$("#show-price-chart-btn").text("Price Graph");
			$("#timespan-btns").hide();
		}
	});
});