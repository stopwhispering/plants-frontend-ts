
import MessageToast from "sap/m/MessageToast";
import Util from "plants/ui/customClasses/shared/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import { BPlant } from "plants/ui/definitions/Plants";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler";
import Dialog from "sap/m/Dialog";
import { BConfirmation } from "plants/ui/definitions/Messages";
import PlantLookup from "./PlantLookup";
import PlantImagesLoader from "./PlantImagesLoader";
import PlantsLoader from "./PlantsLoader";
import JSONModel from "sap/ui/model/json/JSONModel";
import ImageResetter from "../images/ImageResetter";

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

	public renamePlant(oPlant: BPlant, sNewPlantName: string, oDialogRenamePlant: Dialog): void {
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
		var dPayload = {
			'OldPlantName': oPlant.plant_name,
			'NewPlantName': sNewPlantName
		};
		$.ajax({
			url: Util.getServiceUrl('plants/'),
			type: 'PUT',
			contentType: "application/json",
			data: JSON.stringify(dPayload),
			context: this
		})
			.done(this._onReceivingPlantNameRenamed.bind(this, oPlant, oDialogRenamePlant))
			.fail(ModelsHelper.onReceiveErrorGeneric.bind(this, 'Plant (PUT)'));
	}

	private _onReceivingPlantNameRenamed(oPlant: BPlant, oDialogRenamePlant: Dialog, oMsg: BConfirmation): void {
		//plant was renamed in backend
		Util.stopBusyDialog();
		MessageToast.show(oMsg.message.message);
		MessageHandler.getInstance().addMessageFromBackend(oMsg.message);

		Util.startBusyDialog('Loading...', 'Loading plants and images data');

		const oPlantsLoader = new PlantsLoader(this._oPlantsModel);
		oPlantsLoader.loadPlants();
		
		// this.modelsHelper.reloadPlantsFromBackend();
		new ImageResetter(this._oImagesModel, this._oUntaggedImagesModel).resetImages();
		// this.modelsHelper.resetImages();

		// _fnRequestImagesForPlant(oPlant.id!);  // todo do this in a better way
		this._oPlantImagesLoader.requestImagesForPlant(oPlant.id);
		oDialogRenamePlant.close();
	}

}