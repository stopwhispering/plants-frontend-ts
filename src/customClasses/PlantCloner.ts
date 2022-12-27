import MessageToast from "sap/m/MessageToast";
import * as Util from "plants/ui/customClasses/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { BResultsPlantCloned, FPlantsUpdateRequest } from "../definitions/Plants";
import PlantLookup from "./PlantLookup"
import { BPlant} from "../definitions/Plants";
import Navigation from "./Navigation";
import ModelsHelper from "../model/ModelsHelper";
import Dialog from "sap/m/Dialog";
import MessageHandler from "./MessageHandler";
import ChangeTracker from "./ChangeTracker";

/**
 * @namespace plants.ui.customClasses
 */
export default class PlantCloner extends ManagedObject {

	private _oPlantsModel: JSONModel;
    private _oPlantLookup: PlantLookup;

	public constructor(oPlantsModel: JSONModel, oPlantLookup: PlantLookup) {
		super();
		this._oPlantsModel = oPlantsModel;
        this._oPlantLookup = oPlantLookup;
	}	

	public clonePlant(oPlant: BPlant, sClonedPlantName: string, oDialogClonePlant: Dialog ): void {
		// use ajax to clone plant in backend, then add clone to plants model and open in details view, also add
		// cloned plant to the plants model clone to track changes

		// check if duplicate
		if (sClonedPlantName === '') {
			MessageToast.show('Empty not allowed.');
			return;
		}

		//check if new
		if (this._oPlantLookup.plantNameExists(sClonedPlantName)) {
			MessageToast.show('Plant Name already exists.');
			return;
		}

		// ajax call
		Util.startBusyDialog("Cloning...", '"' + oPlant.plant_name + '" to "' + sClonedPlantName + '"');
		$.ajax({
			url: Util.getServiceUrl('plants/' + oPlant.id + '/clone?plant_name_clone=' + sClonedPlantName),
			type: 'POST',
			contentType: "application/json",
			context: this
		})
			.done(this._onReceivingPlantCloned.bind(this, oDialogClonePlant))
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Clone Plant (POST)'));
	}

	private _onReceivingPlantCloned(oDialogClonePlant: Dialog, oBackendResultPlantCloned: BResultsPlantCloned): void {
		// Cloning plant was successful; add clone to model and open in details view
		oDialogClonePlant.close();
		MessageHandler.getInstance().addMessageFromBackend(oBackendResultPlantCloned.message);

		var oPlantSaved = <BPlant>oBackendResultPlantCloned.plant;
		var aPlants = this._oPlantsModel.getProperty('/PlantsCollection');
		aPlants.push(oPlantSaved);  // append at end to preserve change tracking with clone 
		this._oPlantsModel.updateBindings(false);

		// ...and add to cloned plants to allow change tracking
		// var oPlantClone = Util.getClonedObject(oPlantSaved);
		// this._oPlantsDataClone.PlantsCollection.push(oPlantClone);
		ChangeTracker.getInstance().addOriginalPlant(oPlantSaved);
		MessageToast.show(oBackendResultPlantCloned.message.message);

		// finally navigate to the newly created plant in details view
		Navigation.getInstance().navToPlantDetails(oPlantSaved.id!);
		Util.stopBusyDialog();
	}	   



}