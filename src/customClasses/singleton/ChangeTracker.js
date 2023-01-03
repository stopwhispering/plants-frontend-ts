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
var ImageRegistryHandler_1 = require("./ImageRegistryHandler");
/**
 * @namespace plants.ui.customClasses.singleton
 */
var ChangeTracker = /** @class */ (function (_super) {
    __extends(ChangeTracker, _super);
    function ChangeTracker(oPlantsModel, oEventsModel, oPlantPropertiesModel, oTaxonPropertiesModel, oTaxonModel) {
        var _this = _super.call(this) || this;
        _this._oPlantsModel = oPlantsModel;
        _this._oEventsModel = oEventsModel;
        ;
        _this._oPlantPropertiesModel = oPlantPropertiesModel;
        _this._oTaxonPropertiesModel = oTaxonPropertiesModel;
        _this._oTaxonModel = oTaxonModel;
        _this._oPlantsDataClone = {};
        _this._oEventsDataClone = {};
        _this._oTaxonDataClone = { TaxaDict: {} };
        _this._oImageRegistryClone = {};
        _this._oPlantPropertiesDataClone = {};
        _this._oTaxonPropertiesDataClone = {};
        return _this;
    }
    ChangeTracker.createInstance = function (oPlantsModel, oEventsModel, oPlantPropertiesModel, oTaxonPropertiesModel, oTaxonModel) {
        if (ChangeTracker._instance)
            throw new Error('ChangeTracker instance already created');
        ChangeTracker._instance = new ChangeTracker(oPlantsModel, oEventsModel, oPlantPropertiesModel, oTaxonPropertiesModel, oTaxonModel);
    };
    ChangeTracker.getInstance = function () {
        if (!ChangeTracker._instance) {
            throw new Error('ChangeTracker instance not created yet');
        }
        return ChangeTracker._instance;
    };
    ChangeTracker.prototype.getModifiedPlants = function () {
        // get plants model and identify modified items
        var dDataPlants = this._oPlantsModel.getData();
        var aModifiedPlants = [];
        var aOriginalPlants = this._oPlantsDataClone['PlantsCollection'];
        for (var i = 0; i < dDataPlants['PlantsCollection'].length; i++) {
            if (!Util_1["default"].dictsAreEqual(dDataPlants['PlantsCollection'][i], aOriginalPlants[i])) {
                // we need to check if our modified object differs only in structure of parent plant but still
                // has same parent pland id or none
                var oModified = Util_1["default"].getClonedObject(dDataPlants['PlantsCollection'][i]);
                if (!!oModified.parent_plant && !oModified.parent_plant.id) {
                    oModified.parent_plant = null;
                }
                if (!!oModified.parent_plant_pollen && !oModified.parent_plant_pollen.id) {
                    oModified.parent_plant_pollen = null;
                }
                if (!Util_1["default"].dictsAreEqual(oModified, aOriginalPlants[i])) {
                    aModifiedPlants.push(dDataPlants['PlantsCollection'][i]);
                }
            }
        }
        return aModifiedPlants;
    };
    ChangeTracker.prototype.getModifiedTaxa = function () {
        // get taxon model and identify modified items
        // difference to plants and images: data is stored with key in a dictionary, not in an array
        // we identify the modified sub-dictionaries and return a list of these
        // note: we don't check whether there's a new taxon as after adding a taxon, it is added
        //	     to the clone as well
        // we don't check for deleted taxa as there's no function for doing this in frontend
        var dDataTaxon = this._oTaxonModel.getData().TaxaDict;
        var dDataTaxonOriginal = this._oTaxonDataClone['TaxaDict'];
        //get taxon id's, i.e. keys of the taxa dict
        var keys_s = Object.keys(dDataTaxonOriginal);
        var keys = keys_s.map(function (k) { return parseInt(k); });
        //for each key, check if it's value is different from the clone
        var aModifiedTaxonList = [];
        keys.forEach(function (key) {
            if (!Util_1["default"].dictsAreEqual(dDataTaxonOriginal[key], dDataTaxon[key])) {
                aModifiedTaxonList.push(dDataTaxon[key]);
            }
        }, this);
        return aModifiedTaxonList;
    };
    ChangeTracker.prototype.getModifiedEvents = function () {
        // returns a dict with events for those plants where at least one event has been modified, added, or deleted
        var oDataEvents = this._oEventsModel.getData().PlantsEventsDict;
        //get plants for which we have events in the original dataset
        //then, for each of them, check whether events have been changed
        var oModifiedEventsDict = {};
        var keys_clones = Object.keys(this._oEventsDataClone);
        var keys_clone = keys_clones.map(function (k) { return parseInt(k); });
        var that = this;
        keys_clone.forEach(function (key) {
            // if(!Util.arraysAreEqual(dDataEventsClone[key],
            if (!Util_1["default"].objectsEqualManually(that._oEventsDataClone[key], oDataEvents[key])) {
                oModifiedEventsDict[key] = oDataEvents[key];
            }
        }, this);
        //added plants
        var keys_s = Object.keys(oDataEvents);
        var keys = keys_s.map(function (k) { return parseInt(k); });
        keys.forEach(function (key) {
            if (!that._oEventsDataClone[key]) {
                oModifiedEventsDict[key] = oDataEvents[key];
            }
        }, this);
        return oModifiedEventsDict;
    };
    ChangeTracker.prototype.getModifiedPlantProperties = function () {
        // returns a dict with properties for those plants where at least one property has been modified, added, or deleted
        // for these plants, properties are supplied completely; modifications are then identified in backend
        var dDataProperties = this._oPlantPropertiesModel.getData().propertiesPlants;
        // clean up the properties model data (returns a clone, not the original object!)
        var dDataPropertiesCleaned = this.getPropertiesSansTaxa(dDataProperties);
        // const dDataPropertiesOriginal: LPlantIdToPropertyCollectionMap = this.oComponent.oPropertiesDataClone;
        // get plants for which we have properties in the original dataset
        // then, for each of them, check whether properties have been changed
        var dModifiedPropertiesDict = {};
        var keys_clone_s = Object.keys(this._oPlantPropertiesDataClone);
        var keys_clone = keys_clone_s.map(function (k) { return parseInt(k); });
        var that = this;
        keys_clone.forEach(function (key) {
            // loop at plants
            if (!Util_1["default"].objectsEqualManually(that._oPlantPropertiesDataClone[key], dDataPropertiesCleaned[key])) {
                dModifiedPropertiesDict[key] = dDataPropertiesCleaned[key];
            }
        }, this);
        return dModifiedPropertiesDict;
    };
    ChangeTracker.prototype.getModifiedTaxonProperties = function () {
        var oDataPropertiesTaxon = this._oTaxonPropertiesModel.getData();
        var oPropertiesTaxon = oDataPropertiesTaxon.propertiesTaxon; // todo fix entity
        // const oPropertiesTaxon: LCategoryToPropertiesInCategoryMap = oDataPropertiesTaxon.propertiesTaxon;  // todo fix entity
        // const oPropertiesTaxonOriginal: LCategoryToPropertiesInCategoryMap = this.oComponent.oPropertiesTaxonDataClone;
        if (!this._oTaxonPropertiesDataClone) {
            return {};
        }
        // get taxa for which we have properties in the original dataset
        // then, for each of them, check whether properties have been changed
        var oModifiedPropertiesDict = {};
        var keys_clone_s = Object.keys(this._oTaxonPropertiesDataClone);
        var keys_clone = keys_clone_s.map(function (key) { return parseInt(key); });
        var that = this;
        keys_clone.forEach(function (key) {
            // loop at plants
            if (!Util_1["default"].objectsEqualManually(that._oTaxonPropertiesDataClone[key], oPropertiesTaxon[key])) {
                oModifiedPropertiesDict[key] = oPropertiesTaxon[key];
            }
        }, this);
        return oModifiedPropertiesDict;
    };
    ChangeTracker.prototype.getModifiedImages = function () {
        // identify modified images by comparing images with their clones (created after loading)
        // var oImages: LImageMap = this.oComponent.imagesRegistry;
        // var oImagesClone: LImageMap = this.oComponent.imagesRegistryClone;
        var _this = this;
        var aModifiedImages = [];
        var oImageRegistryHandler = ImageRegistryHandler_1["default"].getInstance();
        var aImageFilenames = oImageRegistryHandler.getFilenamesInImageRegistry();
        aImageFilenames.forEach(function (sFilename) {
            // if (!(path in this._oImageRegistryClone) || !Util.dictsAreEqual(this._oImageRegistry[path], this._oImageRegistryClone[path])) {
            var oImage = oImageRegistryHandler.getImageInRegistry(sFilename);
            var oImageOriginal = _this._oImageRegistryClone[sFilename];
            if (!oImageOriginal || !Util_1["default"].dictsAreEqual(oImage, oImageOriginal)) {
                aModifiedImages.push(oImage);
            }
        });
        return aModifiedImages;
    };
    ChangeTracker.prototype.getPropertiesSansTaxa = function (dProperties_) {
        var dProperties = Util_1["default"].getClonedObject(dProperties_);
        for (var i = 0; i < Object.keys(dProperties).length; i++) {
            var iPlantId = parseInt(Object.keys(dProperties)[i]);
            var oTaxonPropertiesInCategories = dProperties[iPlantId];
            for (var j = 0; j < oTaxonPropertiesInCategories.categories.length; j++) {
                var oCategory = oTaxonPropertiesInCategories.categories[j];
                // reverse-loop as we might need to delete a property (name) node within the loop
                for (var k = oCategory.properties.length - 1; k >= 0; k--) {
                    var oProperty = oCategory.properties[k];
                    // remove taxon property value
                    var foundTaxonProperty = oProperty.property_values.find(function (element) { return element["type"] === "taxon"; });
                    if (foundTaxonProperty) {
                        var iIndex = oProperty.property_values.indexOf(foundTaxonProperty);
                        oProperty.property_values.splice(iIndex, 1);
                    }
                    // if there's no plant property value, just remove the whole property name noe
                    var foundPlantProperty = oProperty.property_values.find(function (element) { return element["type"] === "plant"; });
                    if (!foundPlantProperty)
                        oCategory.properties.splice(k, 1);
                }
            }
        }
        return dProperties;
    };
    ChangeTracker.prototype.setOriginalPlants = function (oPlantsData) {
        // reset plants clone completely to supplied plants data
        this._oPlantsDataClone = Util_1["default"].getClonedObject(oPlantsData);
    };
    ChangeTracker.prototype.addOriginalPlant = function (oPlant) {
        var oPlantClone = Util_1["default"].getClonedObject(oPlant);
        this._oPlantsDataClone.PlantsCollection.push(oPlantClone);
    };
    ChangeTracker.prototype.removeOriginalPlant = function (oPlant) {
        //delete from model clone
        var aPlantsDataClone = this._oPlantsDataClone.PlantsCollection;
        //can't find position with object from above, so we use the unique id
        var oPlantClone = aPlantsDataClone.find(function (element) {
            return element.id === oPlant.id;
        });
        if (oPlantClone) {
            aPlantsDataClone.splice(aPlantsDataClone.indexOf(oPlantClone), 1);
        }
        else {
            throw new Error("Plant " + oPlant.plant_name + " not found in clone");
        }
    };
    ChangeTracker.prototype.setOriginalEventsForPlant = function (aEvents, iPlantId) {
        //reset all events data for supplied plant ID
        this._oEventsDataClone[iPlantId] = Util_1["default"].getClonedObject(aEvents);
    };
    ChangeTracker.prototype.setOriginalEvents = function (oPlantIdToEventsMap) {
        // reset events clone completely to supplied events data
        this._oEventsDataClone = Util_1["default"].getClonedObject(oPlantIdToEventsMap);
    };
    ChangeTracker.prototype.removeOriginalImage = function (filename) {
        // delete image from images model clone
        delete this._oImageRegistryClone[filename];
    };
    ChangeTracker.prototype.setOriginalImagesFromImageRegistry = function () {
        var oImageMap = ImageRegistryHandler_1["default"].getInstance().getImageRegistry();
        this._oImageRegistryClone = Util_1["default"].getClonedObject(oImageMap);
    };
    ChangeTracker.prototype.addOriginalImage = function (oImage) {
        this._oImageRegistryClone[oImage.filename] = Util_1["default"].getClonedObject(oImage);
    };
    ChangeTracker.prototype.addOriginalImages = function (aImages) {
        var _this = this;
        aImages.forEach(function (oImage) {
            _this._oImageRegistryClone[oImage.filename] = Util_1["default"].getClonedObject(oImage);
        });
    };
    ChangeTracker.prototype.resetOriginalImages = function () {
        this._oImageRegistryClone = {};
    };
    ChangeTracker.prototype.resetOriginalTaxa = function () {
        this._oTaxonDataClone = {
            TaxaDict: {}
        };
    };
    ChangeTracker.prototype.addOriginalTaxon = function (oTaxon) {
        this._oTaxonDataClone.TaxaDict[oTaxon.id] = Util_1["default"].getClonedObject(oTaxon);
    };
    ChangeTracker.prototype.setOriginalTaxa = function (oTaxonData) {
        // todo remove , probably not used
        this._oTaxonDataClone = Util_1["default"].getClonedObject(oTaxonData);
    };
    ChangeTracker.prototype.hasOriginalTaxon = function (iTaxonId) {
        return iTaxonId in this._oTaxonDataClone.TaxaDict;
    };
    ChangeTracker.prototype.addPlantPropertyCollection = function (oPropertyCollectionForPlant, oPlant) {
        // add/overwrite properties for a single plant
        this._oPlantPropertiesDataClone[oPlant.id] = Util_1["default"].getClonedObject(oPropertyCollectionForPlant);
    };
    ChangeTracker.prototype.setPlantPropertyCollections = function (oPlantIdToPropertyCollectionMap) {
        // set properties for all plants 
        this._oPlantPropertiesDataClone = Util_1["default"].getClonedObject(oPlantIdToPropertyCollectionMap);
    };
    ChangeTracker.prototype.addTaxonPropertiesInCategory = function (oPropertiesInCategory, iTaxonId) {
        // add/overwrite properties for a single taxon
        this._oTaxonPropertiesDataClone[iTaxonId] = Util_1["default"].getClonedObject(oPropertiesInCategory);
    };
    ChangeTracker.prototype.setTaxonProperties = function (oTaxonToPropertyCategoryMap) {
        // set properties for all taxa
        this._oTaxonPropertiesDataClone = Util_1["default"].getClonedObject(oTaxonToPropertyCategoryMap);
    };
    return ChangeTracker;
}(ManagedObject_1["default"]));
exports["default"] = ChangeTracker;
