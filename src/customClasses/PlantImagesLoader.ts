import * as Util from "plants/ui/customClasses/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import ModelsHelper from "../model/ModelsHelper";
import ImageRegistryHandler from "./ImageRegistryHandler";

/**
 * @namespace plants.ui.customClasses
 */
export default class PlantImagesLoader extends ManagedObject {

	private _oImagesModel: JSONModel;
	private _setImagesPlantsLoaded: Set<int>;
		

	public constructor(
		oImagesModel: JSONModel, 
		setImagesPlantsLoaded: Set<int>,
		) {

		super();
		this._oImagesModel = oImagesModel;
		this._setImagesPlantsLoaded = setImagesPlantsLoaded
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

	private _onReceivingImagesForPlant(iPlantId: int, oData: any): void {
		ImageRegistryHandler.getInstance().addPhotosToRegistry(oData);
		this._setImagesPlantsLoaded.add(iPlantId);
		ImageRegistryHandler.getInstance().resetImagesCurrentPlant(iPlantId);
		this._oImagesModel.updateBindings(false);
	}


}