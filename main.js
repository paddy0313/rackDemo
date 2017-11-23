var box = new twaver.ElementBox();
var network = new Network(box);
var templateTitleDiv = document.createElement('div');
var deviceTree = new DeviceTree();
var templateDataDiv = document.createElement('div');
var template = {};


function init() {
  initNetwork();
  Util.registerBasePanel();
}

function initNetwork() {
  templatePane = new twaver.controls.BorderPane(templateDataDiv, templateTitleDiv);
  templatePane.setCenter(deviceTree);
  var mainPane = new twaver.controls.BorderPane(network, '', '', '', templatePane);
  document.getElementById('main').appendChild(mainPane.getView());
  Util.getPaneStyle(mainPane, null, templatePane);
  window.onresize = function() {
    mainPane.invalidate();
  };
}