const $ = require('jquery');
const remote = require('electron').remote;
const CoinMonitor = require('./coin-monitor');
const bootstrap = require('bootstrap');
var monitor = new CoinMonitor();

$(document).ready(function() {
  function init() {
    // minimize and close buttons
    document.getElementById('minimize-button').addEventListener('click', (e) => {
      var window = remote.getCurrentWindow();
      window.minimize();
    });
    document.getElementById('close-button').addEventListener('click', (e) => {
      var window = remote.getCurrentWindow();
      window.close();
    });
  }
  document.onreadystatechange = () => {
    if (document.readyState == 'complete') {
      init();
    }
  }
  $("#base-currency-options").find("a").on('click', function(e) {
    console.log($(this).text());
    var newCurrency = $(this).text();
    monitor.updateSetting('baseCurrency', newCurrency);
    monitor.getSpotPrice();
  });

  $("#target-currency-options").find("a").on('click', function() {
    console.log($(this).text());
    var newCurrency = $(this).text();
    monitor.updateSetting('targetCurrency', newCurrency);
    monitor.getSpotPrice();
  });
});