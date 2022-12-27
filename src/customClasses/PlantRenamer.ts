
import MessageToast from "sap/m/MessageToast";
import * as Util from "plants/ui/customClasses/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import { BPlant } from "../definitions/Plants";
import ModelsHelper from "../model/ModelsHelper";
import MessageHandler from "./MessageHandler";
import Dialog from "sap/m/Dialog";
import { BConfirmation } from "../definitions/Messages";
import PlantLookup from "./PlantLookup";
import PlantImagesLoader from "./PlantImagesLoader";

/**
 * @namespace plants.ui.customClasses
 */
export default class PlantRenamer extends ManagedObject {
	private modelsHelper = ModelsHelper.getInstance();
	private _oPlantLookup: PlantLookup
	private _oPlantImagesLoader: PlantImagesLoader;

	public constructor(oPlantLookup: PlantLookup, oPlantImagesLoader: PlantImagesLoader) {
		super();
		this._oPlantLookup = oPlantLookup;
		this._oPlantImagesLoader = oPlantImagesLoader;
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
			.fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Plant (PUT)'));
	}

	private _onReceivingPlantNameRenamed(oPlant: BPlant, oDialogRenamePlant: Dialog, oMsg: BConfirmation): void {
		//plant was renamed in backend
		Util.stopBusyDialog();
		MessageToast.show(oMsg.message.message);
		MessageHandler.getInstance().addMessageFromBackend(oMsg.message);

		Util.startBusyDialog('Loading...', 'Loading plants and images data');

		this.modelsHelper.reloadPlantsFromBackend();
		this.modelsHelper.resetImages();

		// _fnRequestImagesForPlant(oPlant.id!);  // todo do this in a better way
		this._oPlantImagesLoader.requestImagesForPlant(oPlant.id);
		oDialogRenamePlant.close();
	}

}