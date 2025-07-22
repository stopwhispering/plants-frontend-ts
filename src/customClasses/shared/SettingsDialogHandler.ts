// Handler for the Settings Dialog
import { Button$PressEvent } from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import Util from "../shared/Util";
import Fragment from "sap/ui/core/Fragment";
import { LNewSettings } from "plants/ui/definitions/SettingsLocal";
import ErrorHandling from "./ErrorHandling";
import { UpdateSettingsResponse } from "plants/ui/definitions/Settings";

/**
 * @namespace plants.ui.customClasses.shared
 */
export default class SettingsDialogHandler extends ManagedObject {
	// protected _oSoilCRUD: SoilCRUD;
	// protected _oEventDialog: Dialog;
	// protected _oEventModel: JSONModel;  // "editOrNewEvent"
	private _oView: View;
    private _oSettingsDialog: Dialog;
    private _oSettingsModel: JSONModel; 

	// protected _oSoilDialogHandler: SoilDialogHandler;
	// private _oSuggestionsData: LSuggestions;

	public constructor(
        oView: View, 
    ) {
		super();
		this._oView = oView;  // todo refactor view out
        this._oSettingsModel = <JSONModel>this._oView.getModel('settings');
	}

    public openSettingsDialog(): void {

        // if dialog was instantiated before, then destroy new-settings model and dialog first, then re-instantiate
        if (this._oSettingsDialog){
            this._oSettingsDialog.getModel("newSettings").destroy();
            this._oSettingsDialog.setModel(null, "newSettings");
            this._oSettingsDialog.destroy();
        }
        
        Fragment.load({
            name: "plants.ui.view.fragments.menu.SettingsDialog",
            id: this._oView.getId(),
            controller: this
        }).then((oControl: Control | Control[]) => {
            this._oSettingsDialog = <Dialog>oControl;
            this._oView.addDependent(this._oSettingsDialog);
            const oSettings = (<JSONModel>this._oView.getModel('settings')).getData().settings;
            const mNewSettings: LNewSettings = {
                settings: Util.getClonedObject(oSettings),
            }
            const oNewSettingsModel = new JSONModel(mNewSettings);
            if (this._oSettingsDialog.getModel("newSettings")) {
                this._oSettingsDialog.getModel("newSettings").destroy();
            }
            this._oSettingsDialog.setModel(oNewSettingsModel, "newSettings");
            this._oSettingsDialog.open();
        });
    }

    onPressCancelSettings(event: Button$PressEvent): void {
        // we're cleaning up anyway upon opening, so no need to destroy the new settings model here
        this._oSettingsDialog.close();
    }

    onPressSaveSettings(event: Button$PressEvent): void {
        const oNewSettingsModel = <JSONModel>this._oSettingsDialog.getModel('newSettings');
        const oNewSettings = <LNewSettings>oNewSettingsModel.getData().settings;

        $.ajax({
            url: Util.getServiceUrl('settings/'),
            type: 'PUT',
            contentType: "application/json",
            data: JSON.stringify({'settings': oNewSettings}),
            context: this
        })
            .done((update_settings_response: UpdateSettingsResponse) => {
                this._oSettingsModel.setData(update_settings_response);
                // trigger reload of plants model to apply new settings
                this._oView.getModel('plants').refresh(true);
                MessageToast.show("Settings saved successfully.");
                this._oSettingsDialog.close();
            })
            .fail(ErrorHandling.onFail.bind(this, 'Save Settings (POST)'));
    }
}