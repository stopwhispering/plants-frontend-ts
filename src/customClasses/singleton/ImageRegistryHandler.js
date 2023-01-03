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
var ManagedObject_1 = require("sap/ui/base/ManagedObject");
/**
 * @namespace plants.ui.customClasses.singleton
 */
// export default class ImageRegistryHandler extends ManagedObject {
var ImageRegistryHandler = /** @class */ (function (_super) {
    __extends(ImageRegistryHandler, _super);
    function ImageRegistryHandler(oImagesModel) {
        var _this = _super.call(this) || this;
        _this._oImagesModel = oImagesModel;
        _this._oImageRegistry = {};
        _this._oSetImagesPlantsLoaded = new Set();
        return _this;
    }
    ImageRegistryHandler.createInstance = function (oImagesModel) {
        if (ImageRegistryHandler._instance)
            throw new Error('ImageRegistryHandler instance already created');
        ImageRegistryHandler._instance = new ImageRegistryHandler(oImagesModel);
    };
    ImageRegistryHandler.getInstance = function () {
        if (!ImageRegistryHandler._instance) {
            throw new Error('ImageRegistryHandler instance not created yet');
        }
        return ImageRegistryHandler._instance;
    };
    ImageRegistryHandler.prototype.resetImagesForPlant = function (iPlantId) {
        // reset data in images model to image data in image registy for supplied plant
        // @ts-ignore // typescript doesn't like Object.entries
        var aPhotosArr = Object.entries(this._oImageRegistry).filter(function (t) { return (t[1].plants.filter(function (p) { return p.plant_id === iPlantId; })).length == 1; });
        var aPhotos = aPhotosArr.map(function (p) { return p[1]; });
        this._oImagesModel.setProperty('/ImagesCollection', aPhotos);
        Util_1["default"].stopBusyDialog(); // had been started in details onPatternMatched
    };
    ImageRegistryHandler.prototype.resetImageRegistry = function () {
        // Object.keys(this._component.imagesRegistry).forEach(key => delete this._component.imagesRegistry[key]);
        this._oImageRegistry = {};
    };
    ImageRegistryHandler.prototype.addImageToImagesRegistry = function (aImages) {
        var _this = this;
        // add photos loaded for a plant to the registry if not already loaded with other plant
        // note: to avoid cross dependency, we don't add a copy of the photo to a clone registry
        //       caller needs to do that separately 
        aImages.forEach(function (oImage) {
            if (!(_this.isImageInRegistry(oImage.filename))) {
                _this._oImageRegistry[oImage.filename] = oImage;
            }
        });
    };
    ImageRegistryHandler.prototype.addImageToRegistry = function (oImage) {
        this._oImageRegistry[oImage.filename] = oImage;
    };
    ImageRegistryHandler.prototype.removeImageFromRegistry = function (sFilename) {
        delete this._oImageRegistry[sFilename];
    };
    ImageRegistryHandler.prototype.getFilenamesInImageRegistry = function () {
        return Object.keys(this._oImageRegistry);
    };
    ImageRegistryHandler.prototype.tempGetImagesRegistry = function () {
        //TODO REMOVE THIS WHEN CODE IS UNDERSTOOD!
        return this._oImageRegistry;
    };
    ImageRegistryHandler.prototype.getImageInRegistry = function (sFilename) {
        return this._oImageRegistry[sFilename];
    };
    ImageRegistryHandler.prototype.getImageRegistry = function () {
        return this._oImageRegistry;
    };
    ImageRegistryHandler.prototype.isImageInRegistry = function (sFilename) {
        return sFilename in this._oImageRegistry;
    };
    ImageRegistryHandler.prototype.resetPlantsWithImagesLoaded = function () {
        this._oSetImagesPlantsLoaded.clear();
    };
    ImageRegistryHandler.prototype.addPlantToPlantsWithImagesLoaded = function (iPlantId) {
        this._oSetImagesPlantsLoaded.add(iPlantId);
    };
    ImageRegistryHandler.prototype.isPlantInPlantsWithImagesLoaded = function (iPlantId) {
        return this._oSetImagesPlantsLoaded.has(iPlantId);
    };
    return ImageRegistryHandler;
}(ManagedObject_1["default"]));
exports["default"] = ImageRegistryHandler;
