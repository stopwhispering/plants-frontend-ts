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
var ModelsHelper_1 = require("plants/ui/model/ModelsHelper");
var ChangeTracker_1 = require("plants/ui/customClasses/singleton/ChangeTracker");
var ImageRegistryHandler_1 = require("plants/ui/customClasses/singleton/ImageRegistryHandler");
/**
 * @namespace plants.ui.customClasses.images
 */
var UntaggedImagesHandler = /** @class */ (function (_super) {
    __extends(UntaggedImagesHandler, _super);
    function UntaggedImagesHandler(oUntaggedImagesModel) {
        var _this = _super.call(this) || this;
        _this._oUntaggedImagesModel = oUntaggedImagesModel;
        return _this;
    }
    UntaggedImagesHandler.prototype.requestUntaggedImages = function () {
        // request untagged images from backend
        $.ajax({
            url: Util_1["default"].getServiceUrl('images/untagged/'),
            context: this,
            async: true
        })
            .done(this._onReceivingUntaggedImages)
            .fail(ModelsHelper_1["default"].onReceiveErrorGeneric.bind(this, 'Plant Untagged Images (GET)'));
    };
    // load untagged images to display number as badge in top row
    UntaggedImagesHandler.prototype._onReceivingUntaggedImages = function (oData, sStatus, oReturnData) {
        this._addPhotosToRegistry(oData.ImagesCollection);
        this.resetUntaggedImages();
    };
    UntaggedImagesHandler.prototype._addPhotosToRegistry = function (aImages) {
        // add photos loaded for a plant to the registry if not already loaded with other plant
        // plus add a copy of the photo to a clone registry for getting changed photos when saving
        var oImageRegistryHandler = ImageRegistryHandler_1["default"].getInstance();
        aImages.forEach(function (oImage) {
            // if (!(image.filename in this.imagesRegistry)){
                //todo replace with id
            if (!oImageRegistryHandler.isImageInRegistry(oImage.filename)) {
                oImageRegistryHandler.addImageToRegistry(oImage);
                ChangeTracker_1["default"].getInstance().addOriginalImage(oImage);
            }
        });
    };
    UntaggedImagesHandler.prototype.resetUntaggedImages = function () {
        //(re-)set untagged photos in untagged images model
        // @ts-ignore // works, but typescript doesn't like it
        //TODO REMOVE THIS WHEN CODE IS UNDERSTOOD!
        var tempimagesRegistry = ImageRegistryHandler_1["default"].getInstance().tempGetImagesRegistry();
        // const aPhotoValues = <any[][]> Object.entries(this.imagesRegistry).filter(t => (!t[1].plants.length));
        var aPhotoValues = Object.entries(tempimagesRegistry).filter(function (t) { return (!t[1].plants.length); });
        var aPhotos = aPhotoValues.map(function (p) { return p[1]; });
        this._oUntaggedImagesModel.setProperty('/ImagesCollection', aPhotos);
    };
    return UntaggedImagesHandler;
}(ManagedObject_1["default"]));
exports["default"] = UntaggedImagesHandler;
