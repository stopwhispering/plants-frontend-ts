sap.ui.define(["sap/ui/base/ManagedObject"], function (ManagedObject) {
  /**
   * @namespace plants.ui.customClasses
   */
  const Navigation = ManagedObject.extend("plants.ui.customClasses.Navigation", {
    constructor: function _constructor(oComponent) {
      ManagedObject.prototype.constructor.call(this);
      this._component = oComponent;
    },
    navToPlantDetails: function _navToPlantDetails(iPlant) {
      // todo refactored... adjust comments etc
      // requires the plant index in plants model
      // open requested plants detail view in the mid column; either via...
      // - detail route (two-columns, default)
      // - untagged route (three-colums, only if untagged route already active)
      if (this._component.getHelper().getCurrentUIState().layout !== "OneColumn") {
        var oNextUIState = this._component.getHelper().getCurrentUIState();
      } else {
        oNextUIState = this._component.getHelper().getNextUIState(1);
      }

      // use detail (two-col) route or untagged(three-col) route
      var aHash = this._component.getRouter().getHashChanger().getHash().split('/');
      var sLastItem = aHash.pop(); // e.g. "TwoColumnsMidExpanded"
      if (sLastItem === 'untagged') {
        this._component.getRouter().navTo("untagged", {
          layout: oNextUIState.layout,
          plant_id: iPlant
        });
      } else {
        this._component.getRouter().navTo("detail", {
          layout: oNextUIState.layout,
          plant_id: iPlant
        });
      }
    },
    navToPlant: function _navToPlant(oPlant, oComponent) {
      //similar to navToPlantDetails with two differences:
      //  - requires the plant object instead of plant id
      //  - requires component to be supplied as parameter (therefore we don't have to bind this to the calling function)
      if (oComponent.getHelper().getCurrentUIState().layout !== "OneColumn") {
        var oNextUIState = oComponent.getHelper().getCurrentUIState();
      } else {
        oNextUIState = oComponent.getHelper().getNextUIState(1);
      }

      // use detail (two-col) route or untagged(three-col) route
      var aHash = oComponent.getRouter().getHashChanger().getHash().split('/');
      var sLastItem = aHash.pop();
      if (sLastItem === 'untagged') {
        oComponent.getRouter().navTo("untagged", {
          layout: oNextUIState.layout,
          plant_id: oPlant.id
        });
      } else {
        oComponent.getRouter().navTo("detail", {
          layout: oNextUIState.layout,
          plant_id: oPlant.id
        });
      }
    }
  });
  Navigation.getInstance = function getInstance(oComponent) {
    if (!Navigation._instance && !oComponent) {
      throw new Error("MessageUtil not initialized and no context supplied");
    } else if (Navigation._instance && oComponent) {
      throw new Error("MessageUtil already initialized");
    } else if (!Navigation._instance && oComponent) {
      Navigation._instance = new Navigation(oComponent);
    }
    return Navigation._instance;
  };
  return Navigation;
});
//# sourceMappingURL=Navigation.js.map