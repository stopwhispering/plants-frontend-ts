import Popover from "sap/m/Popover";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import Context from "sap/ui/model/Context";

/**
 * @namespace plants.ui.customClasses.filter
 */
export default class ImagePreviewPopoverHandler extends ManagedObject {

    private _oImagePreviewPopover: Popover;  // "popoverPopupImage"

    public constructor() {
        super();
    }

    public openImagePreviewPopover(oAttachTo: View, oOpenBy: Control, oPlantBindingContext: Context): void {

        if (!this._oImagePreviewPopover) {
            Fragment.load({
                name: "plants.ui.view.fragments.master.MasterImagePopover",
                id: oAttachTo.getId(),
                controller: this
            }).then((oControl: Control | Control[]) => {
                this._oImagePreviewPopover = <Popover>oControl;
                oAttachTo.addDependent(this._oImagePreviewPopover);
				this._oImagePreviewPopover.setBindingContext(oPlantBindingContext, 'plants');
                this._oImagePreviewPopover.openBy(oOpenBy, true);
            });
        } else {
            this._oImagePreviewPopover.setBindingContext(oPlantBindingContext, 'plants');
            this._oImagePreviewPopover.openBy(oOpenBy, true);
        }

    }

	public onClickImagePopupImage(oEvent: Event): void {
		this._oImagePreviewPopover.close();
	}

}