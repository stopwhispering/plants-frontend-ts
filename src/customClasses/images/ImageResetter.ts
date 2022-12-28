import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import ChangeTracker from "../singleton/ChangeTracker";
import ImageRegistryHandler from "../singleton/ImageRegistryHandler";

/**
 * @namespace plants.ui.customClasses.images
 */
export default class ImageResetter extends ManagedObject {

    private _oImagesModel: JSONModel;
    private _oUntaggedImagesModel: JSONModel;

    public constructor(oImagesModel: JSONModel, oUntaggedImagesModel: JSONModel){
        super();

        this._oImagesModel = oImagesModel;
        this._oUntaggedImagesModel = oUntaggedImagesModel;
    }

    resetImages() {
		// completely reset images, i.e. images registry, list of plants with images loaded, 
		// and original image data in change tracker
		// update image-related models
		const oImageRegistryHandler = ImageRegistryHandler.getInstance();
		oImageRegistryHandler.resetImageRegistry();
		ChangeTracker.getInstance().resetOriginalImages();
		oImageRegistryHandler.resetPlantsWithImagesLoaded();
		this._oImagesModel.updateBindings(false);
		this._oUntaggedImagesModel.updateBindings(false);
	}
}