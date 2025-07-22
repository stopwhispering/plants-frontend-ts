import ModelsHelper from "plants/ui/model/ModelsHelper";
import Menu from "sap/m/Menu";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import ErrorHandling from "./ErrorHandling";
import Util from "./Util";
import Dialog from "sap/m/Dialog";
import Event from "sap/ui/base/Event";
import { MenuItem$PressEvent } from "sap/m/MenuItem";
import MessageToast from "sap/m/MessageToast";
import { Button$PressEvent } from "sap/m/Button";
import JSONModel from "sap/ui/model/json/JSONModel";
import EditEventDialogHandler from "../events/EditEventDialogHandler";
import SettingsDialogHandler from "./SettingsDialogHandler";

/**
 * @namespace plants.ui.customClasses.shared
 */
export default class ShellBarMenuHandler extends ManagedObject {

    private _oShellBarMenu: Menu;  // "menuShellBarMenu"
    private _oSettingsDialog: Dialog;
    private _oSettingsDialogHandler: SettingsDialogHandler;

    constructor(oView: View) {
        super();
        this._oSettingsDialogHandler = new SettingsDialogHandler(
            oView
        );
    }

    public openShellBarMenu(oViewAttachTo: View, oOpenBy: Control): void {

        if (this._oShellBarMenu) {
            this._oShellBarMenu.openBy(oOpenBy, true);
            return;
        }

        Fragment.load({
            name: "plants.ui.view.fragments.menu.ShellBarMenu",
            id: oViewAttachTo.getId(),
            controller: this
        }).then((oControl: Control | Control[]) => {
            this._oShellBarMenu = <Menu>oControl;
            oViewAttachTo.addDependent(this._oShellBarMenu);
            this._oShellBarMenu.openBy(oOpenBy, true);
        });
    }

	generateMissingThumbnails() {
		$.ajax({
			url: Util.getServiceUrl('generate_missing_thumbnails'),
			type: 'POST',
			contentType: "application/json",
			context: this
		})
			.done(ModelsHelper.onGenericSuccessWithMessage)
			.fail(ErrorHandling.onFail.bind(this, 'Generate Missing Thumbnails (POST)'));
	}

    openSettingsDialog(event: MenuItem$PressEvent): void {
        this._oSettingsDialogHandler.openSettingsDialog();
    }

}