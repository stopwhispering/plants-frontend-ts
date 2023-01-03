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
var Util_1 = require("plants/ui/customClasses/shared/Util");
var MessageToast_1 = require("sap/m/MessageToast");
var ManagedObject_1 = require("sap/ui/base/ManagedObject");
var ModelsHelper_1 = require("plants/ui/model/ModelsHelper");
var ChangeTracker_1 = require("./ChangeTracker");
var MessageHandler_1 = require("./MessageHandler");
/**
 * @namespace plants.ui.customClasses.singleton
 */
var Saver = /** @class */ (function (_super) {
    __extends(Saver, _super);
    function Saver(oPlantsModel, oEventsModel, oPlantPropertiesModel, oTaxonPropertiesModel, oTaxonModel) {
        var _this = _super.call(this) || this;
        _this._bSavingPlants = false;
        _this._bSavingImages = false;
        _this._bSavingTaxa = false;
        _this._bSavingEvents = false;
        _this._bSavingPlantProperties = false;
        _this._bSavingTaxonProperties = false;
        _this._oPlantsModel = oPlantsModel;
        _this._oEventsModel = oEventsModel;
        ;
        _this._oPlantPropertiesModel = oPlantPropertiesModel;
        _this._oTaxonPropertiesModel = oTaxonPropertiesModel;
        _this._oTaxonModel = oTaxonModel;
        return _this;
    }
    Saver.createInstance = function (oPlantsModel, oEventsModel, oPlantPropertiesModel, oTaxonPropertiesModel, oTaxonModel) {
        if (Saver._instance)
            throw new Error('ChangeTracker instance already created');
        Saver._instance = new Saver(oPlantsModel, oEventsModel, oPlantPropertiesModel, oTaxonPropertiesModel, oTaxonModel);
    };
    Saver.getInstance = function () {
        if (!Saver._instance) {
            throw new Error('Saver instance not created yet');
        }
        return Saver._instance;
    };
    Saver.prototype.saveMajorResources = function () {
        Util_1["default"].startBusyDialog('Saving...', 'Plants and Images');
        this._bSavingPlants = false;
        this._bSavingImages = false;
        this._bSavingTaxa = false;
        this._bSavingEvents = false;
        this._bSavingPlantProperties = false;
        this._bSavingTaxonProperties = false;
        var oChangeTracker = ChangeTracker_1["default"].getInstance();
        var aModifiedPlants = oChangeTracker.getModifiedPlants();
        var aModifiedImages = oChangeTracker.getModifiedImages();
        var aModifiedTaxa = oChangeTracker.getModifiedTaxa();
        var dModifiedEvents = oChangeTracker.getModifiedEvents();
        var dModifiedPropertiesPlants = oChangeTracker.getModifiedPlantProperties();
        var dModifiedPropertiesTaxa = oChangeTracker.getModifiedTaxonProperties();
        // cancel busydialog if nothing was modified (callbacks not triggered)
        if ((aModifiedPlants.length === 0) && (aModifiedImages.length === 0) && (aModifiedTaxa.length === 0)
            && (Object.keys(dModifiedEvents).length === 0) && (Object.keys(dModifiedPropertiesPlants).length === 0) && (Object.keys(dModifiedPropertiesTaxa).length === 0)) {
            MessageToast_1["default"].show('Nothing to save.');
            Util_1["default"].stopBusyDialog();
            return;
        }
        // save plants
        if (aModifiedPlants.length > 0) {
            this._bSavingPlants = true; // required in callback function  to find out if both savings are finished
            var dPayloadPlants = { 'PlantsCollection': aModifiedPlants };
            $.ajax({
                url: Util_1["default"].getServiceUrl('plants/'),
                type: 'POST',
                contentType: "application/json",
                data: JSON.stringify(dPayloadPlants),
                context: this
            })
                .done(this._onAjaxSuccessSave)
                .fail(ModelsHelper_1["default"].onReceiveErrorGeneric.bind(this, 'Plant (POST)'));
        }
        // save images
        if (aModifiedImages.length > 0) {
            this._bSavingImages = true;
            var dPayloadImages = { 'ImagesCollection': aModifiedImages };
            $.ajax({
                url: Util_1["default"].getServiceUrl('images/'),
                type: 'PUT',
                contentType: "application/json",
                data: JSON.stringify(dPayloadImages),
                context: this
            })
                .done(this._onAjaxSuccessSave)
                .fail(ModelsHelper_1["default"].onReceiveErrorGeneric.bind(this, 'Image (PUT)'));
        }
        // save taxa
        if (aModifiedTaxa.length > 0) {
            this._bSavingTaxa = true;
            // cutting occurrence images (read-only)
            var aModifiedTaxaUnattached = Util_1["default"].getClonedObject(aModifiedTaxa);
            var aModifiedTaxaSave = aModifiedTaxaUnattached.map(function (m) {
                // @ts-ignore
                delete m.occurrence_images;
                return m;
            });
            var dPayloadTaxa = { 'ModifiedTaxaCollection': aModifiedTaxaSave };
            $.ajax({
                url: Util_1["default"].getServiceUrl('taxa/'),
                type: 'PUT',
                contentType: "application/json",
                data: JSON.stringify(dPayloadTaxa),
                context: this
            })
                .done(this._onAjaxSuccessSave)
                .fail(ModelsHelper_1["default"].onReceiveErrorGeneric.bind(this, 'Taxon (POST)'));
        }
        // save events
        if (Object.keys(dModifiedEvents).length > 0) {
            this._bSavingEvents = true;
            var dPayloadEvents = { 'plants_to_events': dModifiedEvents };
            $.ajax({
                url: Util_1["default"].getServiceUrl('events/'),
                type: 'POST',
                contentType: "application/json",
                data: JSON.stringify(dPayloadEvents),
                context: this
            })
                .done(this._onAjaxSuccessSave)
                .fail(ModelsHelper_1["default"].onReceiveErrorGeneric.bind(this, 'Event (POST)'));
        }
        // save properties
        if (Object.keys(dModifiedPropertiesPlants).length > 0) {
            this._bSavingPlantProperties = true;
            var dPayloadProperties = { 'modifiedPropertiesPlants': dModifiedPropertiesPlants };
            $.ajax({
                url: Util_1["default"].getServiceUrl('plant_properties/'),
                type: 'POST',
                contentType: "application/json",
                data: JSON.stringify(dPayloadProperties),
                context: this
            })
                .done(this._onAjaxSuccessSave)
                .fail(ModelsHelper_1["default"].onReceiveErrorGeneric.bind(this, 'plant_properties (POST)'));
        }
        // save properties taxa
        if (Object.keys(dModifiedPropertiesTaxa).length > 0 || Object.keys(dModifiedPropertiesTaxa).length > 0) {
            this._bSavingTaxonProperties = true;
            var dPayloadPropertiesTaxa = { 'modifiedPropertiesTaxa': dModifiedPropertiesTaxa };
            $.ajax({
                url: Util_1["default"].getServiceUrl('taxon_properties/'),
                type: 'POST',
                contentType: "application/json",
                data: JSON.stringify(dPayloadPropertiesTaxa),
                context: this
            })
                .done(this._onAjaxSuccessSave)
                .fail(ModelsHelper_1["default"].onReceiveErrorGeneric.bind(this, 'taxon_properties (POST)'));
        }
    };
    Saver.prototype._onAjaxSuccessSave = function (oMsg, sStatus, oReturnData) {
        // cancel busydialog only if neither saving plants nor images or taxa is still running
        var sResource = oMsg.resource;
        if (sResource === 'PlantResource') {
            this._bSavingPlants = false;
            var dDataPlants = this._oPlantsModel.getData();
            ChangeTracker_1["default"].getInstance().setOriginalPlants(dDataPlants);
        }
        else if (sResource === 'ImageResource') {
            this._bSavingImages = false;
            // var oImageMap: LImageMap = this.oComponent.imagesRegistry;
            // ChangeTracker.getInstance().setOriginalImages(oImageMap);
            ChangeTracker_1["default"].getInstance().setOriginalImagesFromImageRegistry();
        }
        else if (sResource === 'TaxonResource') {
            this._bSavingTaxa = false;
            var dDataTaxon = this._oTaxonModel.getData();
            ChangeTracker_1["default"].getInstance().setOriginalTaxa(dDataTaxon);
        }
        else if (sResource === 'EventResource') {
            this._bSavingEvents = false;
            var dDataEvents = this._oEventsModel.getData();
            ChangeTracker_1["default"].getInstance().setOriginalEvents(dDataEvents.PlantsEventsDict);
            MessageHandler_1["default"].getInstance().addMessageFromBackend(oMsg.message);
        }
        else if (sResource === 'PlantPropertyResource') {
            this._bSavingPlantProperties = false;
            var dDataProperties = this._oPlantPropertiesModel.getData();
            var propertiesPlantsWithoutTaxa = ChangeTracker_1["default"].getInstance().getPropertiesSansTaxa(dDataProperties.propertiesPlants);
            ChangeTracker_1["default"].getInstance().setPlantPropertyCollections(propertiesPlantsWithoutTaxa);
            MessageHandler_1["default"].getInstance().addMessageFromBackend(oMsg.message);
        }
        else if (sResource === 'TaxonPropertyResource') {
            this._bSavingTaxonProperties = false;
            var dDataPropertiesTaxa = this._oTaxonPropertiesModel.getData();
            var oTaxonToPropertyCategoryMap = dDataPropertiesTaxa.propertiesTaxon;
            ChangeTracker_1["default"].getInstance().setTaxonProperties(oTaxonToPropertyCategoryMap);
            MessageHandler_1["default"].getInstance().addMessageFromBackend(oMsg.message);
        }
        if (!this._bSavingPlants && !this._bSavingImages && !this._bSavingTaxa && !this._bSavingEvents && !this._bSavingPlantProperties && !this._bSavingTaxonProperties) {
            Util_1["default"].stopBusyDialog();
        }
    };
    return Saver;
}(ManagedObject_1["default"]));
exports["default"] = Saver;
