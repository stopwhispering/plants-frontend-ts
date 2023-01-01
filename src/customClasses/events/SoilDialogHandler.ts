import Dialog from "sap/m/Dialog";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { LSoilEditData } from "plants/ui/definitions/EventsLocal";
import { FBSoil } from "plants/ui/definitions/Events"
import Fragment from "sap/ui/core/Fragment";
import Control from "sap/ui/core/Control";
import Button from "sap/m/Button";
import SoilCRUD from "./SoilCRUD";
import Event from "sap/ui/base/Event";

/**
 * @namespace plants.ui.customClasses.events
 */
export default class SoilDialogHandler extends ManagedObject {
	private _oSoilDialog: Dialog;  // used for both new and edit soil
	private _oSoilCRUD: SoilCRUD;

	public constructor(oSoilCRUD: SoilCRUD) {
		super();

		this._oSoilCRUD = oSoilCRUD;
	}

	public openDialogNewSoil(oAttachTo: Dialog): void {
		// open the new/edit-soil dialog
		var dNewSoil = <LSoilEditData>{
			dialog_title: 'New Soil',
			btn_text: 'Create',
			new: true,
			id: undefined,
			soil_name: '',
			description: '',
			mix: ''
		}
		var oNewSoilModel = new JSONModel(dNewSoil);

		// the dialog is always destroyed upon closing, so we don't need to check for existence
		Fragment.load({
			name: "plants.ui.view.fragments.events.EditSoil",
			id: oAttachTo.getId(),
			controller: this
		}).then((oControl: Control | Control[]) => {
			this._oSoilDialog = <Dialog>oControl;
			this._oSoilDialog.setModel(oNewSoilModel, 'editedSoil');
			this._oSoilDialog.bindElement({
				path: '/',
				model: "editedSoil"
			});
			oAttachTo.addDependent(this._oSoilDialog);
			this._oSoilDialog.open();
		});
	}

	openDialogEditSoil(oSoil: FBSoil, oAttachTo: Dialog): void {
		// open the new/edit-soil dialog when it's promise is resolved
		var dEditedSoil = <LSoilEditData>{
			dialog_title: 'Edit Soil (ID ' + oSoil.id + ')',
			btn_text: 'Update',
			new: false,
			id: oSoil.id,
			soil_name: oSoil.soil_name,
			description: oSoil.description,
			mix: oSoil.mix
		}
		var oEditedSoilModel = new JSONModel(dEditedSoil);


		Fragment.load({
			name: "plants.ui.view.fragments.events.EditSoil",
			id: oAttachTo.getId(),
			controller: this
		}).then((oControl: Control | Control[]) => {
			this._oSoilDialog = <Dialog>oControl;
			this._oSoilDialog.setModel(oEditedSoilModel, 'editedSoil');
			this._oSoilDialog.bindElement({
				path: '/',
				model: "editedSoil"
			});
			oAttachTo.addDependent(this._oSoilDialog);
			this._oSoilDialog.open();
		});	
	}

	onUpdateOrCreateSoil(oEvent: Event) {
		const oEditedSoil = <LSoilEditData>(<Button>oEvent.getSource()).getBindingContext('editedSoil')!.getObject();
		this._oSoilCRUD.updateOrCreateSoil(oEditedSoil, this._oSoilDialog);
	}
	onCancelEditSoil(oEvent: Event) {
		this._oSoilDialog.close();
	}

}