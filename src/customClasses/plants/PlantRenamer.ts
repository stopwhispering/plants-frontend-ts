
import MessageToast from "sap/m/MessageToast";
import Util from "plants/ui/customClasses/shared/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import { PlantRead, PlantRenameRequest } from "plants/ui/definitions/Plants";
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler";
import { BackendConfirmation } from "plants/ui/definitions/Messages";
import PlantLookup from "./PlantLookup";
import PlantImagesLoader from "./PlantImagesLoader";
import PlantsLoader from "plants/ui/customClasses/singleton/PlantsLoader"
import JSONModel from "sap/ui/model/json/JSONModel";
import ImageResetter from "../images/ImageResetter";
import ErrorHandling from "../shared/ErrorHandling";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantRenamer extends ManagedObject {
	private _oPlantLookup: PlantLookup
	private _oPlantImagesLoader: PlantImagesLoader;
	private _oPlantsModel: JSONModel;
	private _oImagesModel: JSONModel;
	private _oUntaggedImagesModel: JSONModel;

	public constructor(oPlantLookup: PlantLookup, oPlantImagesLoader: PlantImagesLoader, oPlantsModel: JSONModel, oImagesModel: JSONModel, oUntaggedImagesModel: JSONModel) {
		super();
		this._oPlantLookup = oPlantLookup;
		this._oPlantImagesLoader = oPlantImagesLoader;
		this._oPlantsModel = oPlantsModel;
		this._oImagesModel = oImagesModel;
		this._oUntaggedImagesModel = oUntaggedImagesModel;
	}

	public renamePlant(oPlant: PlantRead, sNewPlantName: string, closeDialogFn: Function): void {
		// use ajax to rename plant in backend

		// check if duplicate
		if (sNewPlantName === '') {
			MessageToast.show('Empty not allowed.');
			return;
		}

		//check if new
		if (this._oPlantLookup.plantNameExists(sNewPlantName)) {
			MessageToast.show('Plant Name already exists.');
			return;
		}

		// ajax call
		Util.startBusyDialog("Renaming...", '"' + oPlant.plant_name + '" to "' + sNewPlantName + '"');
		var dPayload: PlantRenameRequest = {
			'new_plant_name': sNewPlantName
		};
		$.ajax({
			url: Util.getServiceUrl('plants/' + oPlant.id.toString() + '/rename'),
			type: 'PUT',
			contentType: "application/json",
			data: JSON.stringify(dPayload),
			context: this
		})
			.done(this._onReceivingPlantNameRenamed.bind(this, oPlant, closeDialogFn))
			.fail(ErrorHandling.onFail.bind(this, 'Plant (PUT)'));
	}

	private _onReceivingPlantNameRenamed(oPlant: PlantRead, closeDialogFn: Function, oMsg: BackendConfirmation): void {
		//plant was renamed in backend
		Util.stopBusyDialog();
		MessageToast.show(oMsg.message.message);
		MessageHandler.getInstance().addMessageFromBackend(oMsg.message);

		Util.startBusyDialog('Loading...', 'Loading plants and images data');

		// const oPlantsLoader = new PlantsLoader(this._oPlantsModel);
		PlantsLoader.getInstance().loadPlants(oPlant.id);

		// new ImageResetter(this._oImagesModel, this._oUntaggedImagesModel).resetImages();
		// this._oPlantImagesLoader.requestImagesForPlant(oPlant.id);
		
		closeDialogFn();
	}

}