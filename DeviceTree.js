var DeviceTree = function(box) {
  DeviceTree.superClass.constructor.call(this, box);
  Util.registerNormalImage('./tree_expand_collapse/expand.png', 'expand', this);
  Util.registerNormalImage('./tree_expand_collapse/collapse.png', 'collapse', this);
  this.init();
};

twaver.Util.ext(DeviceTree, twaver.controls.Tree, {
  init: function() {
    this.setExpandIcon('expand');
    this.setCollapseIcon('collapse');
    this.setDraggable();
    this.getRootDatas();
  },
  setDraggable: function() {
    var self = this;
    var data;
    this.getView().addEventListener('mousedown', function(e) {
      data = self.getDataAt(e);
    });
    this.getView().setAttribute('draggable', 'true');
    self.onDataRendered = function(div, data, row, selected) {
      if (div.getAttribute('draggable') != 'true') {
        div.addEventListener('selectstart', function(e) {
          this.dragDrop();
          e.preventDefault();
        }, false);
        div.setAttribute('draggable', 'true');
        div.addEventListener('dragstart', function(e) {
          dragAction(e);
        });
      }
    };

    function dragAction(e) {
      if (data) {
        var modelData = data.getClient('data');
        template.data = modelData;
        self.getSelectionModel().setSelection(data);
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('Text', JSON.stringify(modelData));
      } else {
        e.dataTransfer.setData('Text', '');
        if (e.dataTransfer.setDragImage) {
          e.dataTransfer.setDragImage(new Image(), 0, 0);
        }
      }
    }
  },
  getRootDatas: function() {
    this.setDatas(deviceData);
  },

  getD: function(datas, templates, node) {
    var self = this;
    var box = this.getDataBox();
    datas.forEach(function(data, index) {
      if (data.children) {
        var node1 = new twaver.Node();
        node1.setName(data.zh_label);
        node1.setClient('data', data);
        node1.setParent(node);
        box.add(node1);
        self.getD(data.children, templates, node1);
      } else {
        self.expand(node);
        var node1 = new twaver.Node();
        node1.setName(data.zh_label);
        node1.setClient('data', data);
        templates[data.int_id] = data.data;
        node1.setParent(node);
        box.add(node1);
      }
    });
    return templates;
  },

  setDatas: function(datas) {
    var self = this;
    var templates = {};
    self.getD(datas, templates);
    Util.setServerPanel(templates);
  },
});