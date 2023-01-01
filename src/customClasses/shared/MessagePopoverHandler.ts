import MessagePopover from "sap/m/MessagePopover";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import MessageHandler from "../singleton/MessageHandler";

/**
 * @namespace plants.ui.customClasses.shared
 */
export default class MessagePopoverHandler extends ManagedObject {

    private _oMessagePopover: MessagePopover;  // "MessagePopover"

    constructor() {
        super();
    }

    public toggleMessagePopover(oViewAttachTo: View, oOpenBy: Control): void {

        if (this._oMessagePopover) {
            // if already open, close it
            if (this._oMessagePopover.isOpen())
                this._oMessagePopover.close();
            else
                this._oMessagePopover.openBy(oOpenBy);
            return;
        }

        Fragment.load({
            name: "plants.ui.view.fragments.menu.MessagePopover",
            id: oViewAttachTo.getId(),
            controller: this
        }).then((oControl: Control | Control[]) => {
            this._oMessagePopover = <MessagePopover>oControl;
            oViewAttachTo.addDependent(this._oMessagePopover);
            this._oMessagePopover.openBy(oOpenBy);
        });
    }

	onClearMessages(oEvent: Event) {
		//clear messages in message popover fragment
		MessageHandler.getInstance().removeAllMessages();
	}


}