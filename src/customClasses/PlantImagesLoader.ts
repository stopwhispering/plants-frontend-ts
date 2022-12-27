import * as Util from "plants/ui/customClasses/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { FBImage } from "../definitions/Images";
import ModelsHelper from "../model/ModelsHelper";
import ChangeTracker from "./ChangeTracker";
import ImageRegistryHandler from "./ImageRegistryHandler";

/**
 * @namespace plants.ui.customClasses
 */
export default class PlantImagesLoader extends ManagedObject {

	private _oImagesModel: JSONModel;
		

	public constructor(oImagesModel: JSONModel) {
		super();
		this._oImagesModel = oImagesModel;
	}
	
	public requestImagesForPlant(iPlantId: int): void {
		// request data from backend
		// note: unlike plants, properties, events, and taxon, we don't need to bind a path
		// to the view for images as the image model contains only the current plant's images
		var sId = encodeURIComponent(iPlantId);
		var uri = 'plants/' + sId + '/images/';

		$.ajax({
			url: Util.getServiceUrl(uri),
			// data: ,
			context: this,
			async: true
		})
			.done(this._onReceivingImagesForPlant.bind(this, iPlantId))
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Plant Images (GET)'));
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