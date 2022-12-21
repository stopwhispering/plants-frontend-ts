sap.ui.define(["sap/ui/model/json/JSONModel", "sap/ui/Device"], function (JSONModel, Device) {
  /**
   * @namespace plants.ui.model
   */
  function createDeviceModel() {
    var oModel = new JSONModel(Device);
    oModel.setDefaultBindingMode("OneWay");
    return oModel;
  }
  var __exports = {
    __esModule: true
  };
  __exports.createDeviceModel = createDeviceModel;
  return __exports;
});
//# sourceMappingURL=models.js.map