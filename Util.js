var Util = {
  rackWidth: 450,
  rackUnitHeight: 44.45,
  rackLeftGap: 120.2,
  rackTopGap: 66.5,
  registerNormalImage: (function() {
    var loadingImages = {};
    return function(url, name, view) {
      if (loadingImages[url]) {
        loadingImages[url].push(callback);
        return;
      }
      if (twaver.Util.getImageAsset(name)) {
        return;
      }
      loadingImages[url] = [callback];
      var image = new Image();
      image.src = url;

      // Fix IE bug
      if (twaver.Util.isIE && url.substr(url.length - 4) === '.svg') {
        image.style.visibility = 'hidden';
        network.getView().appendChild(image);
        image.onload = function() {
          setTimeout(function() {
            twaver.Util.registerImage(name, image, image.clientWidth, image.clientHeight);
            image.onload = null;
            network.getView().removeChild(image);
            loadingImages[url].forEach(function(cb) {
              cb();
            });
            delete loadingImages[url];
          }, 200);
        };
      } else {
        image.onload = function() {
          twaver.Util.registerImage(name, image, image.width, image.height);
          image.onload = null;
          loadingImages[url].forEach(function(cb) {
            cb();
          });
          delete loadingImages[url];
        };
      }

      function callback() {
        if (view.invalidateElementUIs) {
          view.invalidateElementUIs();
        } else if (view.invalidateDisplay) {
          view.invalidateDisplay();
        } else {
          view(image);
        }
      }
    };
  })(),
  appendChild: function(e, parent, top, right, bottom, left) {
    e.style.position = 'absolute';
    if (left != null) e.style.left = left + 'px';
    if (top != null) e.style.top = top + 'px';
    if (right != null) e.style.right = right + 'px';
    if (bottom != null) e.style.bottom = bottom + 'px';
    parent.appendChild(e);
  },

  getPaneStyle: function(mainPane, rightPane, leftPane) {
    this.viewInit(mainPane.getView(), 0);
    this.addTitleDiv(templateTitleDiv, '模版', '', '');
    mainPane.setLeftWidth(240);
    leftPane.getView().style.outline = 'solid 1px LightGrey';
    mainPane.setHGap(6);
  },

  addTitleDiv: function(div, title, fontSty, icon) {
    var titleDiv = document.createElement('div');
    div.appendChild(titleDiv);
    titleDiv.style.width = div.style.width;
    titleDiv.style.height = '30px';
    titleDiv.style.backgroundColor = '#eeeeee';
    titleDiv.innerText = '　' + title;
    titleDiv.textContent = '　' + title;
    titleDiv.style.lineHeight = titleDiv.style.height;
    return titleDiv;
  },

  viewInit: function(view, t, r, b, l) {
    var t = t || 0;
    var r = r || t;
    var b = b || t;
    var l = l || t;
    view.style.top = t + 'px';
    view.style.right = r + 'px';
    view.style.bottom = b + 'px';
    view.style.left = l + 'px';
  },


  registerBasePanel: function() {
    /**
     * 板卡
     */
    make.Default.register('twaver.idc.card.panel', function(json) {

      make.Default.copyProperties({
        style: {
          'body.type': 'vector',
          'vector.fill.color': '#444444'
        },
        client: {
          host: true,
          resizeable: true,
          editable: true,
        }
      }, json);
      return make.Default.createFollower(json);
    }, {
      name: 'card',
      modelDefaultParameters: {
        width: {
          name: "宽度",
          value: 100,
          type: make.Default.PARAMETER_TYPE_INT,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR
        },
        height: {
          name: "高度",
          value: 30,
          type: make.Default.PARAMETER_TYPE_INT,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR
        }
      },
      category: '面板背板',
      icon: Util.getIdcIconPath('network_panel.png'),
      host: true,
    });

    /**
     * 面板槽位
     */
    make.Default.register('twaver.idc.slot.panel', function(json) {

      make.Default.copyProperties({
        style: {
          'body.type': 'vector',
          'vector.fill.color': 'gray'
        },
        client: {
          host: false,
          resizeable: true,
          editable: true,
          slot: true
        }
      }, json);
      return make.Default.createFollower(json);
    }, {
      name: 'slot',
      modelDefaultParameters: {
        position: {
          name: "位置[x,y,z]",
          value: [0, 0, 0],
          type: make.Default.PARAMETER_TYPE_ARRAY_NUMBER,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_FIELD,
          hidden: true,
        },
        x: {
          name: "X轴位置",
          value: 0,
          type: make.Default.PARAMETER_TYPE_NUMBER,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR,
          exportable: false,
        },
        y: {
          name: "Y轴位置",
          value: 0,
          type: make.Default.PARAMETER_TYPE_NUMBER,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR,
          exportable: false,
        },
        width: {
          name: "宽度",
          value: 100,
          type: make.Default.PARAMETER_TYPE_INT,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR
        },
        height: {
          name: "高度",
          value: 30,
          type: make.Default.PARAMETER_TYPE_INT,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR
        },
        bid: {
          name: "业务ID",
          value: undefined,
          type: make.Default.PARAMETER_TYPE_STRING,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_CLIENT,
          index: 0
        }
      },
      category: '面板部件',
      icon: Util.getIdcIconPath('network_panel.png'),
      host: false,
    });

    make.Default.register('twaver.idc.panel.loader', function(json) {

      var data = json.data || [];
      var scale = json.scale || 1;
      var x = json.x || 0;
      var y = json.y || 0;

      if (!data || data.length == 0) {
        return;
      }
      data.forEach(function(d) {
        d.scale = scale;
      });

      var elements = make.Default.load(data);
      if (make.Default.getOtherParameter(data[0].id, 'host')) {

        var nodes = elements;
        var parentNode = nodes[0];
        for (var i = 1; i < nodes.length; i++) {
          nodes[i].setMovable(false);
          nodes[i].setHost(parentNode);
          nodes[i].setParent(parentNode);
          parentNode.addChild(nodes[i]);
        }
        make.Default.setObject2dCSProps(parentNode, json);
        parentNode.setLocation(x, y);
        return parentNode;
      } else {
        var result = [];
        var nodeMap = {},
          nodeArray = [],
          linkArray = [];
        elements.forEach(function(element, index) {
          element.index = index;
          if (make.Default.getOtherParameter(make.Default.getId(element), 'link')) {
            linkArray.push(element);
          } else {
            nodeArray.push(element);
            var bid = element.getClient('bid');
            if (bid && bid.length > 0) {
              nodeMap[bid] = element;
            }
          }
        })
        nodeArray.forEach(function(n) {
          n.setMovable(false);
          result.push(n);
        })
        linkArray.forEach(function(link) {
          var linkData = data[link.index];
          link.setFromNode(nodeMap[linkData.from]);
          link.setToNode(nodeMap[linkData.to]);
          result.push(link);
        })
        return result;
      }
    });

    //添加面板背板
    Util.setServerBackPanel(backPanelJson);
    //添加面板部件
    Util.setServerPanelComp(panelComp);
  },
  setServerBackPanel: function(data) {
    var dataBackPanel = data;
    for (var name in dataBackPanel) {
      this.registerServerBackPanel(name, dataBackPanel[name]);
    }
  },
  setServerPanelComp: function(data) {
    var dataPanelComp = data;
    for (var name in dataPanelComp) {
      this.registerServerPanelCompImage(name, dataPanelComp[name]);
    }
  },
  setServerPanel: function(data) {
    var dataDevicePanel = data;
    for (var name in dataDevicePanel) {
      if (dataDevicePanel[name].data) {
        this.registerDeviceFrontPanel(name, dataDevicePanel[name]);
      }
    }
  },
  /**
   * 注册面板背板
   */
  registerServerBackPanel: function(name, args) {
    var self = this;
    var id = 'twaver.idc.' + name + '.panel';
    make.Default.register(id, function(json) {

      make.Default.copyProperties({
        imageUrl: self.getIdcSVGPath(name),
        client: {
          category: 'networkDevice-panel',
          host: true,
          editable: true,
          size: args.size
        }
      }, json);
      var follower = make.Default.createFollower(json);
      return follower;
    }, this.getServerBackPanelParams(args));
  },

  /**
   * ai默认是72分辨率,1PT = 1/72英寸 = 1/72 * 25.4 mm = 0.3528mm  所以要除以比例系数
   * 10 换算成mm
   * 0.35277778 比例系数
   */
  getServerBackPanelParams: function(args) {
    return {
      name: args.label,
      modelDefaultParameters: {
        width: {
          name: "宽度",
          value: args.relWidth || (make.Default.getEquipmentWidth()) * 10, //换算成mm
          type: make.Default.PARAMETER_TYPE_INT,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR
        },
        height: {
          name: "高度",
          value: args.relHeight || (make.Default.getEquipmentHeight(args.size || 1)) * 10, //换算成mm
          type: make.Default.PARAMETER_TYPE_INT,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR
        },
        halfDepth: {
          name: "半深设备",
          value: false,
          type: make.Default.PARAMETER_TYPE_BOOLEAN,
          propertyType: make.Default.PARAMETER_PROPERTY_TYPE_CLIENT
        }
      },
      category: '面板背板',
      icon: this.getIdcIconPath(args.label + '.png'),
      host: true,
    }
  },

  /**
   * 注册面板部件
   */
  registerServerPanelCompImage: function(name, args) {
    var self = this;
    var id = 'twaver.idc.' + name + '.panel';
    make.Default.register(id, function(json) {

      make.Default.copyProperties({
        imageUrl: self.getIdcSVGPath(name),
        client: {
          category: 'device-panel-comp',
          host: false,
        }
      }, json);
      var follower = make.Default.createFollower(json);
      return follower;
    }, this.getServerPanelCompParams(args));
  },

  getServerPanelCompParams: function(args) {
    var modelDefaultParameters = {
      width: {
        name: "宽度",
        value: args.width,
        type: make.Default.PARAMETER_TYPE_NUMBER,
        propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR
      },
      height: {
        name: "高度",
        value: args.height,
        type: make.Default.PARAMETER_TYPE_NUMBER,
        propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR
      },
      position: {
        name: "位置[x,y,z]",
        value: [0, 0, 0],
        type: make.Default.PARAMETER_TYPE_ARRAY_NUMBER,
        propertyType: make.Default.PARAMETER_PROPERTY_TYPE_FIELD,
        hidden: true,
      },
      x: {
        name: "X轴位置",
        value: 0,
        type: make.Default.PARAMETER_TYPE_NUMBER,
        propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR,
        exportable: false,
      },
      y: {
        name: "Y轴位置",
        value: 0,
        type: make.Default.PARAMETER_TYPE_NUMBER,
        propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR,
        exportable: false,
      },
      rotation: {
        name: "旋转[x,y,z]",
        value: [0, 0, 0],
        type: make.Default.PARAMETER_TYPE_ARRAY_NUMBER,
        propertyType: make.Default.PARAMETER_PROPERTY_TYPE_FIELD,
        hidden: true,
      },
      angle: {
        name: "Z轴旋转",
        value: 0,
        type: make.Default.PARAMETER_TYPE_NUMBER,
        propertyType: make.Default.PARAMETER_PROPERTY_TYPE_ACCESSOR,
        exportable: false,
      },
      decoration: {
        name: "装饰部件",
        value: args.decoration,
        type: make.Default.PARAMETER_TYPE_BOOLEAN,
        propertyType: make.Default.PARAMETER_PROPERTY_TYPE_CLIENT,
        hidden: true,
      },
    };
    if (!args.decoration) {
      modelDefaultParameters['bid'] = {
        name: "业务ID",
        value: undefined,
        type: make.Default.PARAMETER_TYPE_STRING,
        propertyType: make.Default.PARAMETER_PROPERTY_TYPE_CLIENT,
        index: 0
      }
    }
    var result = {
      name: args.label,
      modelDefaultParameters: modelDefaultParameters,
      category: '面板部件',
      icon: this.getIdcIconPath(args.label + '.png'),
    }
    return result;
  },

  /**
   * 注册设备面板
   */
  registerDeviceFrontPanel: function(name, props) {
    var self = this;
    var size = props.size;

    //面板图数据
    make.Default.register('twaver.idc.' + name + '.panel.data', function(json) {

      return props.data;
    }, {
      icon: self.getDeviceIconPath2D(name),
      name: name,
      category: '设备面板',
      size: size
    })

    //面板图
    make.Default.copy('twaver.idc.' + name + '.panel.loader', 'twaver.idc.panel.loader', {
      data: props.data,
      client: {
        card: props.card
      }
    }, {
      icon: self.getDeviceIconPath2D(name),
      size: size,
      card: props.card
    })
  },
  getDeviceIconPath2D: function(icon) {
    return make.Default.path + 'model/idc/icons/device/' + icon + '_front.png';
  },
  getIdcIconPath: function(icon) {
    if (icon.indexOf('/') > 0) {
      return icon;
    }
    return 'model/idc/icons/' + icon;
  },
  getIdcSVGPath: function(image) {
    if (image.indexOf('/') > 0) {
      return image;
    }
    if (image.length > 4 && image.lastIndexOf('.svg') == image.length - 4) {
      return make.Default.path + 'model/idc/svg/' + image;
    } else {
      return make.Default.path + 'model/idc/svg/' + image + '.svg';
    }
  },

  createDevice: function(data) {
    var self = this;
    var device;
    var total_u = data.endU - data.startU;
    var device;
    device = make.Default.load(this.getIDFromType(data.template_id));
    device.setClient('data', data);
    device.setClient('device', true);
    return device;
  },

  getIDFromType: function(type) {
    return 'twaver.idc.' + type + '.panel.loader';
  },
  scaleDevice: function(device) {
    var self = this;
    var uSize = device.getClient('size');
    var zoom = device.getHost().getClient('zoom');
    var scale = {
      x: Util.rackWidth * zoom / device.getWidth(),
      y: Util.rackUnitHeight * zoom / device.getHeight() * uSize
    };
    device.setSize(Util.rackWidth * zoom, Util.rackUnitHeight * zoom * uSize);
    device.getChildren().forEach(function(child) {
      child.setSize(child.getWidth() * scale.x, child.getHeight() * scale.y);
      child.setLocation(child.getX() * scale.x, child.getY() * scale.y);
    });
  },
};