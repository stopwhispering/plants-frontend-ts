import Dialog from "sap/m/Dialog";
import ManagedObject from "sap/ui/base/ManagedObject";
import Event from "sap/ui/base/Event";
import View from "sap/ui/core/mvc/View";
import Fragment from "sap/ui/core/Fragment";
import Control from "sap/ui/core/Control";

/**
 * @namespace plants.ui.customClasses.taxonomy
 */
export default class LeafletMapHandler extends ManagedObject {

    private _oLeafletMapDialog: Dialog;  // "dialogLeafletMap"

    public constructor() {
        super();
    }

    public openLeafletMapDialog(oAttachTo: View): void {
        if (!this._oLeafletMapDialog) {
            Fragment.load({
                name: "plants.ui.view.fragments.taxonomy.DetailTaxonomyMap",
                id: oAttachTo.getId(),
                controller: this
            }).then((oControl: Control | Control[]) => {
                this._oLeafletMapDialog = <Dialog>oControl;
                oAttachTo.addDependent(this._oLeafletMapDialog);
                this._oLeafletMapDialog.open();
            });
        } else {
            this._oLeafletMapDialog.open()
        }
        
    }

	onCloseLeafletMap(oEvent: Event) {
		this._oLeafletMapDialog.close();
	}

	// afterCloseLeafletMap(oEvent: Event) {
	// 	this._oLeafletMapDialog.destroy();
	// }

}