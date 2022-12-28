import Dialog from "sap/m/Dialog";
import ManagedObject from "sap/ui/base/ManagedObject"
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import { SoilEditData } from "plants/ui/definitions/EventsLocal";
import { FBSoil } from "plants/ui/definitions/Events"

/**
 * @namespace plants.ui.customClasses.events
 */
export default class SoilDialogHandler extends ManagedObject {

	public constructor() {
		super();
	}

	public openDialogNewSoilWhenPromiseResolved(oPromise: Promise<Dialog>, oView: View): void {
		// open the new/edit-soil dialog when it's promise is resolved
		var dNewSoil = <SoilEditData>{
			dialog_title: 'New Soil',
			btn_text: 'Create',
			new: true,
			id: undefined,
			soil_name: '',
			description: '',
			mix: ''
		}
		var oNewSoilModel = new JSONModel(dNewSoil);

		oPromise.then((oDialog: Dialog) => {
			oDialog.setModel(oNewSoilModel, 'editedSoil');
			oDialog.bindElement({
				path: '/',
				model: "editedSoil"
			});
			oView.addDependent(oDialog);
			oDialog.open();
		});
	}

	openDialogEditSoilWhenPromiseResolved(oSoil: FBSoil, oPromise: Promise<Dialog>, oView: View): void {
		// open the new/edit-soil dialog when it's promise is resolved
		var dEditedSoil = <SoilEditData>{
			dialog_title: 'Edit Soil (ID ' + oSoil.id + ')',
			btn_text: 'Update',
			new: false,
			id: oSoil.id,
			soil_name: oSoil.soil_name,
			description: oSoil.description,
			mix: oSoil.mix
		}
		var oEditedSoilModel = new JSONModel(dEditedSoil);

		oPromise.then((oDialog: Dialog) => {
			oDialog.setModel(oEditedSoilModel, 'editedSoil');
			oDialog.bindElement({
				path: '/',
				model: "editedSoil"
			});
			oView.addDependent(oDialog);
			oDialog.open();
		});	
	}

}