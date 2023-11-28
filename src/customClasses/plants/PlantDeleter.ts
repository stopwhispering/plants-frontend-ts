import Util from "plants/ui/customClasses/shared/Util";
import MessageBox from "sap/m/MessageBox";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { PlantRead } from "plants/ui/definitions/Plants";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker";
import ErrorHandling from "../shared/ErrorHandling";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantDeleter extends ManagedObject {

	private _oPlantsModel: JSONModel;
	private fnCloseDetails: Function;


	public constructor(oPlantsModel: JSONModel, fnCloseDetails: Function) {
		super();
		this._oPlantsModel = oPlantsModel;
		this.fnCloseDetails = fnCloseDetails;
	}	

	public askToDeletePlant(oPlant: PlantRead, bCompact: boolean): void {
		//open confirmation dialog
		const mOptions = {
			title: "Delete",
			stretch: false,
			onClose: this._confirmDeletePlant.bind(this, oPlant),
			actions: ['Delete', 'Cancel'],
			styleClass: bCompact ? "sapUiSizeCompact" : ""
		}
		MessageBox.confirm("Delete plant " + oPlant.plant_name + "?", mOptions);
	}

	private _confirmDeletePlant(oPlant: PlantRead, sAction: string): void {
		if (sAction !== 'Delete') {
			return;
		}
		this._deletePlant(oPlant);
	}
	
	private _deletePlant(oPlant: PlantRead): void {

		Util.startBusyDialog('Deleting', 'Deleting ' + oPlant.plant_name);
		$.ajax({
			url: Util.getServiceUrl('plants/' + oPlant.id),
			type: 'DELETE',
			contentType: "application/json",
			context: this
		})
			.done(this._onPlantDeleted.bind(this, oPlant))
			.fail(ErrorHandling.onFail.bind(this, 'Plant (DELETE)'));
	}

	private _onPlantDeleted(oPlantDeleted: PlantRead, oMsg: any, sStatus: string, oReturnData: any): void {
		Util.stopBusyDialog();
		// this.fnOnAjaxSimpleSuccess(oMsg, sStatus, oReturnData); 
		ModelsHelper.onGenericSuccessWithMessage(oMsg, sStatus, oReturnData);

		//remove from plants model and plants model clone
		//find deleted image in model and remove there
		const aPlantsData = this._oPlantsModel.getData().PlantsCollection;
		const iPosition = aPlantsData.indexOf(oPlantDeleted);
		aPlantsData.splice(iPosition, 1);
		this._oPlantsModel.refresh();

		// //delete from model clone (used for tracking changes) as well
		// const aPlantsDataClone: FPlant[] = this._oPlantsDataClone.PlantsCollection;

		// //can't find position with object from above
		// const oPlantClone = aPlantsDataClone.find(function (element) {
		// 	return element.plant_name === oPlantDeleted.plant_name;
		// });
		// if (oPlantClone !== undefined) {
		// 	aPlantsDataClone.splice(aPlantsDataClone.indexOf(oPlantClone), 1);
		// }
		ChangeTracker.getInstance().removeOriginalPlant(oPlantDeleted);

		//return to one-column-layout (plant in details view was deleted)
		this.fnCloseDetails();  // todo implement this in a better way
	}		
}