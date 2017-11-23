var Network = function(box) {
  Network.superClass.constructor.call(this, box);
  this.init();
};

twaver.Util.ext(Network, twaver.vector.Network, {
  init: function() {
    var self = this;
    this.addInteractionListener(self.interactionHandler, self);
    var focusSpaceNode = self.focusSpaceNode = new twaver.Node();
    focusSpaceNode.setStyle('body.type', 'vector');
    focusSpaceNode.setStyle('vector.outline.width', 1);
    focusSpaceNode.setStyle('vector.fill', false);
    focusSpaceNode.setLayerId('focusLayer');
    focusSpaceNode.setVisible(false);
    var focusLayer = new twaver.Layer('focusLayer');
    self.getElementBox().getLayerBox().add(focusLayer);
    this.addInteractionListener(function(e) {
      self.interactionHandler(e);
    });
    this.getView().addEventListener('dragover', function(e) {
      e.preventDefault();
      self.handleDragover(e);
    });
    this.getView().addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      self.handleDrop(e);
    });
    this.getView().addEventListener('dragleave', function(e) {
      e.preventDefault();
      self.handleDragleave(e);
    });
    this.loadRack();
  },
  interactionHandler: function(e) {
    var self = this;
    if (e.kind === 'liveMoveStart') {
      var element = this.getSelectionModel().getLastData();
      var host = element.getHost && element.getHost();
      var movePort = false;
      if (element.getClient('device')) {
        this.device = element;
      }
      if (host && host.getClient('device')) {
        movePort = true;
        this.device = host;
      }
      if (movePort) {
        this.port = element;
        if (this.device) {
          this.device.setClient('oldHost', this.device.getHost());
          this.device.setHost(this.port);
        }
      }
      if (this.device) {
        this._oldULocation = this.device.getClient('startU');
        this.refreshFocusSpaceNodeForDevice(e.event);
      }
    }
    if (e.kind === 'liveMoveBetween') {
      if (this.device) {
        this.refreshFocusSpaceNodeForDevice(e.event);
      }
    }
    if (e.kind === 'liveMoveEnd') {
      if (this.device) {
        this.setDeviceLocation(this.device, this.uLocation && this._canInsert ? (this.uLocation - this._locationDiff) : this._oldULocation);
        this.focusSpaceNode.setVisible(false);
        this._locationDiff = null;
      }
      this.device = null;
      this._rack = null;
    }
  },
  loadRack: function() {
    var self = this;
    var viewRect = self.getViewRect();
    if (viewRect.width === 0 || viewRect.height === 0) {
      setTimeout(function() {
        self.loadRack();
      }, 10);
    } else {
      self._loadRack();
    }
  },
  _loadRack: function() {
    var self = this;
    self.clean();
    var rackTotal_u = 42;
    var image = 'model/idc/svg/rack' + rackTotal_u + 'U.svg';
    if (twaver.Util.getImageAsset(image)) {
      self._addRack(image);
    } else {
      Util.registerNormalImage(image, image, function() {
        self._addRack(image);
      });
    }
  },
  _addRack: function(image) {
    var uAmount = parseInt(42);
    var box = this.getElementBox();
    var viewRect = this.getViewRect();
    var racks = [];
    var rack = new twaver.Node();
    rack.setClient('uAmount', uAmount);
    rack.setImage(image);
    rack.setClient('rack', true);
    var width = rack.getWidth();
    var height = rack.getHeight();
    var zoom = Math.min(viewRect.width / width, viewRect.height / height);
    zoom *= 0.85;
    width *= zoom;
    height *= zoom;
    rack.setClient('zoom', zoom);
    rack.setSize(width, height);
    this.addUplace(rack);
    box.add(rack);
    racks.push(rack);
    this.arrangeRacks(racks);
    return rack;
  },
  addUplace: function(rack) {
    var box = this.getElementBox();
    var uAmount = rack.getClient('uAmount');
    var zoom = rack.getClient('zoom');
    var rackLocation = rack.getLocation();
    var uWidth = Util.rackWidth * zoom;
    var uHeight = Util.rackUnitHeight * zoom;
    for (var i = 1; i <= uAmount; i++) {
      var ui = 'U' + i;
      var uPlace = new twaver.Follower(rack.getId() + 'U' + i);
      uPlace.setHost(rack);
      uPlace.setStyle('select.padding', -1);
      uPlace.setStyle('select.style', 'border');
      uPlace.setStyle('select.width', 1);
      uPlace.setStyle('body.type', 'vector');
      uPlace.setStyle('vector.outline.width', 1);
      uPlace.setStyle('vector.outline.color', 'gray');
      uPlace.setStyle('vector.fill.color', '#eee');
      uPlace.setToolTip(ui);
      uPlace.setStyle('label.color', 'rgba(0,0,0,0)');
      uPlace.setStyle('label.font', 'bold 10px Calibri');
      uPlace.setStyle('label.position', 'center');
      uPlace.setStyle('label.yoffset', 0);
      uPlace.setSize(uWidth, uHeight);
      uPlace.setLocation(
        rackLocation.x + Util.rackLeftGap * zoom,
        rackLocation.y + Util.rackTopGap * zoom + uHeight * (uAmount - i)
      );
      uPlace.setMovable(false);
      box.add(uPlace);
    }
  },
  arrangeRacks: function(racks) {
    var viewRect = this.getViewRect();
    var totalWidth = 0;
    racks.forEach(function(rack) {
      totalWidth += rack.getWidth();
    });
    var gap = Math.max(50, (viewRect.width - totalWidth) / (racks.length + 1));
    var x = gap;
    racks.forEach(function(rack, i) {
      rack.setLocation(x, (viewRect.height - rack.getHeight()) * 0.7);
      x = x + gap + rack.getWidth();
    });
  },
  handleDragover: function(e) {
    var self = this;
    self.refreshFocusSpaceNodeForDevice(e);
    e.dataTransfer.dropEffect = self.uLocation && self._canInsert ? 'copy' : 'none';
  },

  handleDrop: function(e) {
    var self = this;
    var device;
    var target = self.getElementAt(e);
    var text = e.dataTransfer.getData('Text');
    var data = JSON.parse(text);
    if (data.int_id) {
      var deviceData = {
        type: data.type,
        template_id: data.int_id,
        startU: self.uLocation - self._locationDiff,
        endU: self.uLocation - self._locationDiff + data.data.size
      };
      device = self.addDevice(self._rack, deviceData);
      self._rack = null;
      self.uLocation = 0;
      self._locationDiff = null;
      self.focusSpaceNode.setVisible(false);
    }
  },

  handleDragleave: function(e) {
    var self = this;
    self.focusSpaceNode.setVisible(false);
    self._locationDiff = null;
    self._rack = null;
    template.data = null;
  },

  refreshFocusSpaceNodeForDevice: function(e) {
    var self = this;
    self._rack = null;
    var elements = self.getElementsAt(e);
    elements && elements._as.some(function(r) {
      if (self.device === r) {
        return false;
      }
      if (r.getClient('rack')) {
        self._rack = r;
        return true;
      }
      if (r = (r.getHost && r.getHost())) {
        if (r.getClient('rack')) {
          self._rack = r;
          return true;
        }
      }
    });
    var focusSpaceNode = self.focusSpaceNode;
    var uAmount;
    var uHeight = 1;
    if (this.device) {
      uHeight = this.device.getClient('size');
    } else {
      var type = template.data.int_id;
      type = make.Default.getParameters(Util.getIDFromType(type));
      if (type && type.size) {
        uHeight = type.size;
        if (this._locationDiff == null) {
          this._locationDiff = Math.floor(uHeight / 2);
        }
      }
    }
    var rack = self._rack;
    if (rack) {
      uAmount = rack.getClient('uAmount');
      var point = self.getLogicalPoint(e);
      var zoom = rack.getClient('zoom');
      var y = (point.y - rack.getLocation().y - Util.rackTopGap * zoom) / zoom;
      self.uLocation = uAmount - Math.floor(y / Util.rackUnitHeight);
    } else {
      self.uLocation = 0;
    }
    if (self.uLocation) {
      var zoom = rack.getClient('zoom');
      var rackLocation = rack.getLocation();
      if (self._canInsert = self.canInsertDevice(rack, self.uLocation, uHeight, self.device)) {
        focusSpaceNode.setStyle('vector.outline.color', 'blue');
      } else {
        focusSpaceNode.setStyle('vector.outline.color', 'red');
      }
      focusSpaceNode.setSize(Util.rackWidth * zoom, Util.rackUnitHeight * uHeight * zoom);
      // focusSpaceNode.setLocation(rackLocation.x + Util.rackLeftGap * zoom, rackLocation.y + (Util.rackTopGap + (uAmount - self.uLocation + self._locationDiff - uHeight + 1) * Util.rackUnitHeight) * zoom);
      focusSpaceNode.setLocation(rackLocation.x + Util.rackLeftGap * zoom, rackLocation.y + (Util.rackTopGap + (uAmount - self.uLocation - uHeight + 1) * Util.rackUnitHeight) * zoom);
      focusSpaceNode.setVisible(true);
    } else {
      focusSpaceNode.setVisible(false);
    }
  },
  canInsertDevice: function(rack, uLocation, uHeight, device) {
    if (this._locationDiff == null) {
      if (device) {
        this._locationDiff = uLocation - device.getClient('startU');
      }
    }
    this._locationDiff = null;
    var result = true;
    var startU = uLocation - this._locationDiff;
    var endU = startU + uHeight - 1;
    if (startU < 1 || endU > rack.getClient('uAmount')) {
      return false;
    }
    rack.getFollowers() && rack.getFollowers().forEach(function(follower) {
      if (follower.getClient('device') && follower !== device) {
        if (!(follower.getClient('endU') < startU || follower.getClient('startU') > endU)) {
          result = false;
        }
      }
    });
    return result;
  },
  clean: function() {
    var box = this.getElementBox();
    box.clear();
    box.add(this.focusSpaceNode);
    this.setZoom(1);
    this.setViewRect(0, 0, this.getViewRect().width, this.getViewRect().height);
  },
  addDevice: function(rack, deviceData) {
    var box = this.getElementBox();
    var uLocation = parseInt(deviceData.startU);
    var device = this.createDevice(rack, deviceData);
    device.setClient('_id', device.getClient('data').int_id);
    this.setDeviceLocation(device, uLocation);
    box.addByDescendant(device);
    return device;
  },

  createDevice: function(rack, data) {
    var device;
    device = Util.createDevice(data);
    device.setHost(rack);
    device.setClient('parent', rack.getClient('data'));
    device.setClient('device', true);
    device.setClient('data', data);
    device.setClient('startU', parseInt(data.startU));
    device.setClient('endU', parseInt(data.endU));
    device.setToolTip(data.zh_label);
    device.setClient('tree.label', data.zh_label);
    Util.scaleDevice(device);
    var isdevice = make.Default.load(Util.getIDFromType(data.template_id));
    if (isdevice) {}
    device.setClient('showOnTree', true);
    return device;
  },
  setDeviceLocation: function(device, uLocation) {
    var rack = device.getHost();
    var zoom = rack.getClient('zoom');
    var uAmount = rack.getClient('uAmount');
    var uHeight = device.getClient('size');
    var rackLocation = rack.getLocation();
    device.setLocation(
      rackLocation.x + Util.rackLeftGap * zoom,
      rackLocation.y + (Util.rackTopGap + (uAmount - uLocation - uHeight + 1) * Util.rackUnitHeight) * zoom
    );
    device.setClient('startU', uLocation);
    device.setClient('endU', uLocation + uHeight - 1);
  },
});