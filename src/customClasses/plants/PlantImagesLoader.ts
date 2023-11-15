import Util from "plants/ui/customClasses/shared/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { FBImage } from "plants/ui/definitions/Images";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker";
import ImageRegistryHandler from "plants/ui/customClasses/singleton/ImageRegistryHandler";
import ErrorHandling from "../shared/ErrorHandling";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantImagesLoader extends ManagedObject {

	private _oImagesModel: JSONModel;
		

	public constructor(oImagesModel: JSONModel) {
		super();
		this._oImagesModel = oImagesModel;
	}
	
	public async requestImagesForPlant(iPlantId: int) {
		// request data from backend
		// note: unlike plants, properties, events, and taxon, we don't need to bind a path
		// to the view for images as the image model contains only the current plant's images
		var sId = encodeURIComponent(iPlantId);
		
		const oResult: FBImage[] = await Util.get(Util.getServiceUrl('plants/' + sId + '/images/'));
		this._onReceivingImagesForPlant(iPlantId, oResult);
		// todo: error handling
		
		// var uri = 'plants/' + sId + '/images/';
		// $.ajax({
		// 	url: Util.getServiceUrl(uri),
		// 	// data: ,
		// 	context: this,
		// 	async: true
		// })
		// 	.done(this._onReceivingImagesForPlant.bind(this, iPlantId))
		// 	.fail(ErrorHandling.onFail.bind(this, 'Plant Images (GET)'));
	}

	private _onReceivingImagesForPlant(iPlantId: int, aImages: FBImage[]): void {
		const oImageRegistryHandler = ImageRegistryHandler.getInstance();
		oImageRegistryHandler.addImageToImagesRegistry(aImages);
		ChangeTracker.getInstance().addOriginalImages(aImages);
		// this._setImagesPlantsLoaded.add(iPlantId);
		oImageRegistryHandler.addPlantToPlantsWithImagesLoaded(iPlantId);
		oImageRegistryHandler.resetImagesForPlant(iPlantId);
		this._oImagesModel.updateBindings(false);
	}


}