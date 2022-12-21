sap.ui.define(["sap/m/MessageBox", "sap/ui/core/mvc/Controller"], function (MessageBox, Controller) {
  /**
   * @namespace plants.ui.controller
   */
  const App = Controller.extend("plants.ui.controller.App", {
    onInit: function _onInit() {
      // apply content density mode to root view
      this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
    },
    sayHello: function _sayHello() {
      MessageBox.show("Hello World!");
    }
  });
  return App;
});
//# sourceMappingURL=App.controller.js.map