import Util from "plants/ui/customClasses/shared/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { BResultsImageResource, FBImage } from "../../definitions/Images";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker";
import ImageRegistryHandler from "plants/ui/customClasses/singleton/ImageRegistryHandler";

/**
 * @namespace plants.ui.customClasses.images
 */
export default class UntaggedImagesHandler extends ManagedObject {

	private _oUntaggedImagesModel: JSONModel;
		

	public constructor(oUntaggedImagesModel: JSONModel) {
		super();
		this._oUntaggedImagesModel = oUntaggedImagesModel;
	}

	public requestUntaggedImages(): void {
		// request untagged images from backend
		$.ajax({
			url: Util.getServiceUrl('images/untagged/'),
			context: this,
			async: true
		})
		.done(this._onReceivingUntaggedImages)
		.fail(ModelsHelper.onReceiveErrorGeneric.bind(this,'Plant Untagged Images (GET)'));	
	}

	// load untagged images to display number as badge in top row
	private _onReceivingUntaggedImages(oData: BResultsImageResource, sStatus: any, oReturnData: any){
		this._addPhotosToRegistry(<FBImage[]>oData.ImagesCollection);
		this.resetUntaggedImages();
	}

	private _addPhotosToRegistry(aImages: FBImage[]): void {
		// add photos loaded for a plant to the registry if not already loaded with other plant
		// plus add a copy of the photo to a clone registry for getting changed photos when saving
		const oImageRegistryHandler = ImageRegistryHandler.getInstance();
		aImages.forEach((oImage: FBImage) => {
			if (!oImageRegistryHandler.isImageIdInRegistry(oImage.id)){
				oImageRegistryHandler.addImageToRegistry(oImage);
				ChangeTracker.getInstance().addOriginalImage(oImage);
			}
		});
	}

	public resetUntaggedImages(): void {
		//(re-)set untagged photos in untagged images model
		//TODO REMOVE THIS WHEN CODE IS UNDERSTOOD!
		const tempImageIdRegistry = ImageRegistryHandler.getInstance().getImageIdRegistry();
		const aImageValues = <any[][]> Object.entries(tempImageIdRegistry).filter(t => (!t[1].plants.length));
		var aImages = aImageValues.map(p => p[1]);

		this._oUntaggedImagesModel.setProperty('/ImagesCollection',aImages);
	}
}