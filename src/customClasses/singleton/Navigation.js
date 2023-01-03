"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
// helper class for navigation/route-specific methods used applied in multiple controllers
var UriParameters_1 = require("sap/base/util/UriParameters");
var FlexibleColumnLayoutSemanticHelper_1 = require("sap/f/FlexibleColumnLayoutSemanticHelper");
var library_1 = require("sap/f/library");
var ManagedObject_1 = require("sap/ui/base/ManagedObject");
/**
 * @namespace plants.ui.customClasses.singleton
 */
var Navigation = /** @class */ (function (_super) {
    __extends(Navigation, _super);
    function Navigation(oRootControl, oRouter) {
        var _this = _super.call(this) || this;
        _this._oRootControl = oRootControl;
        _this._oRouter = oRouter;
        return _this;
    }
    Navigation.createInstance = function (oRootControl, oRouter) {
        if (Navigation._instance)
            throw new Error("MessageHandler already initialized");
        Navigation._instance = new Navigation(oRootControl, oRouter);
    };
    Navigation.getInstance = function () {
        if (!Navigation._instance)
            throw new Error("MessageHandler not initialized.");
        return Navigation._instance;
    };
    Navigation.prototype.getFCLHelper = function () {
        var oFlexibleColumnLayout = this._oRootControl.byId("idFlexibleColumnLayout");
        var oParams = UriParameters_1["default"].fromQuery();
        var oSettings = {
            defaultTwoColumnLayoutType: library_1.LayoutType.TwoColumnsMidExpanded,
            defaultThreeColumnLayoutType: library_1.LayoutType.ThreeColumnsMidExpanded,
            mode: oParams.get("mode"),
            initialColumnsCount: oParams.get("initial"),
            maxColumnsCount: oParams.get("max")
        };
        return FlexibleColumnLayoutSemanticHelper_1["default"].getInstanceFor(oFlexibleColumnLayout, oSettings);
    };
    Navigation.prototype.navToPlantDetails = function (iPlant) {
        // todo refactored... adjust comments etc
        // requires the plant index in plants model
        // open requested plants detail view in the mid column; either via...
        // - detail route (two-columns, default)
        // - untagged route (three-colums, only if untagged route already active)
        if (this.getFCLHelper().getCurrentUIState().layout !== "OneColumn") {
            var oNextUIState = this.getFCLHelper().getCurrentUIState();
        }
        else {
            oNextUIState = this.getFCLHelper().getNextUIState(1);
        }
        // use detail (two-col) route or untagged(three-col) route
        var aHash = this._oRouter.getHashChanger().getHash().split('/');
        var sLastItem = aHash.pop(); // e.g. "TwoColumnsMidExpanded"
        if (sLastItem === 'untagged') {
            this._oRouter.navTo("untagged", { layout: oNextUIState.layout, plant_id: iPlant });
        }
        else {
            this._oRouter.navTo("detail", { layout: oNextUIState.layout, plant_id: iPlant });
        }
    };
    Navigation.prototype.navToPlant = function (oPlant) {
        //similar to navToPlantDetails with two differences:
        //  - requires the plant object instead of plant id
        //  - requires component to be supplied as parameter (therefore we don't have to bind this to the calling function)
        if (this.getFCLHelper().getCurrentUIState().layout !== "OneColumn") {
            var oNextUIState = this.getFCLHelper().getCurrentUIState();
        }
        else {
            oNextUIState = this.getFCLHelper().getNextUIState(1);
        }
        // use detail (two-col) route or untagged(three-col) route
        var aHash = this._oRouter.getHashChanger().getHash().split('/');
        var sLastItem = aHash.pop();
        if (sLastItem === 'untagged') {
            this._oRouter.navTo("untagged", { layout: oNextUIState.layout, plant_id: oPlant.id });
        }
        else {
            this._oRouter.navTo("detail", { layout: oNextUIState.layout, plant_id: oPlant.id });
        }
    };
    return Navigation;
}(ManagedObject_1["default"]));
exports["default"] = Navigation;
