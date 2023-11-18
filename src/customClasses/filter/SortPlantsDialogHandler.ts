import ViewSettingsDialog, { ViewSettingsDialog$ConfirmEvent } from "sap/m/ViewSettingsDialog";
import ManagedObject from "sap/ui/base/ManagedObject";
import ListBinding from "sap/ui/model/ListBinding";
import View from "sap/ui/core/mvc/View";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import Sorter from "sap/ui/model/Sorter";
/**
 * @namespace plants.ui.customClasses.filter
 */
export default class SortPlantsDialogHandler extends ManagedObject {
	private _oPlantsTableBinding: ListBinding;

    private _oSortPlantsDialog: ViewSettingsDialog;

    public constructor(oPlantsTableBinding: ListBinding) {
        super();
        this._oPlantsTableBinding = oPlantsTableBinding;
    }

    openSortDialog(oAttachToView: View) {
		if (!this._oSortPlantsDialog) {
			Fragment.load({
				name: "plants.ui.view.fragments.master.MasterSort",
				id: oAttachToView.getId(),
				controller: this
			}).then((oControl: Control|Control[]) => {
                this._oSortPlantsDialog = <ViewSettingsDialog>oControl;
                oAttachToView.addDependent(this._oSortPlantsDialog);
                this._oSortPlantsDialog.open();
            });
		} else {
            this._oSortPlantsDialog.open();
		}
    }

    onSortDialogConfirm(oEvent: ViewSettingsDialog$ConfirmEvent) {
		const oSortItem = oEvent.getParameter('sortItem');
		const bDescending = oEvent.getParameter('sortDescending');
		const aSorters = [];
		const sPath = oSortItem.getKey();
		aSorters.push(new Sorter(sPath, bDescending));

		// apply the selected sort and group settings
		this._oPlantsTableBinding.sort(aSorters);
	}
}