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
var ManagedObject_1 = require("sap/ui/base/ManagedObject");
var Util_1 = require("plants/ui/customClasses/shared/Util");
var ModelsHelper_1 = require("plants/ui/model/ModelsHelper");
var ChangeTracker_1 = require("../singleton/ChangeTracker");
var MessageHandler_1 = require("../singleton/MessageHandler");
var library_1 = require("sap/ui/core/library");
/**
 * @namespace plants.ui.customClasses.plants
 */
var PlantsLoader = /** @class */ (function (_super) {
    __extends(PlantsLoader, _super);
    function PlantsLoader(oPlantsModel) {
        var _this = _super.call(this) || this;
        _this._oPlantsModel = oPlantsModel;
        //we need to add the event handlers to the jsonmodel here as this is executed only
        //once; if we attach them before calling, they're adding up to one more each time
        _this._oPlantsModel.attachRequestCompleted(_this._onReceivingPlantsFromBackend.bind(_this));
        // this._oPlantsModel.attachRequestFailed(ModelsHelper.onReceiveErrorGeneric.bind(this, 'Plants Model'));
        _this._oPlantsModel.attachRequestFailed(ModelsHelper_1["default"].onReceiveErrorGeneric.bind(_this, 'Plants Model'));
        return _this;
    }
    PlantsLoader.prototype.loadPlants = function () {
        var sUrl = Util_1["default"].getServiceUrl('plants/');
        this._oPlantsModel.loadData(sUrl);
        Util_1["default"].stopBusyDialog(); // todo: should be stopped only when everything has been reloaded, not only plants
    };
    PlantsLoader.prototype._onReceivingPlantsFromBackend = function (oRequestInfo) {
        // create new clone objects to track changes
        var oPlantsModel = oRequestInfo.getSource();
        ChangeTracker_1["default"].getInstance().setOriginalPlants(oPlantsModel.getData());
        //create message
        var sresource = Util_1["default"].parse_resource_from_url(oRequestInfo.getParameter('url'));
        MessageHandler_1["default"].getInstance().addMessage(library_1.MessageType.Information, 'Loaded Plants from backend', undefined, 'Resource: ' + sresource);
    };
    return PlantsLoader;
}(ManagedObject_1["default"]));
exports["default"] = PlantsLoader;
