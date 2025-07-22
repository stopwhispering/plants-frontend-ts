// Handler for the Settings Dialog
import { LEventEditData } from "plants/ui/definitions/EventsLocal";
import Button, { Button$PressEvent } from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import List from "sap/m/List";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import View from "sap/ui/core/mvc/View";
import Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import SoilDialogHandler from "./SoilDialogHandler";
import RadioButton from "sap/m/RadioButton";
import Util from "../shared/Util";
import { ObservationCreateUpdate, SoilRead, PotCreateUpdate } from "plants/ui/definitions/Events";
import SoilCRUD from "./SoilCRUD";
import { LSuggestions } from "plants/ui/definitions/PlantsLocal";
import { ListBase$SelectionChangeEvent } from "sap/m/ListBase";
import { Image$PressEvent } from "sap/m/Image";
import Fragment from "sap/ui/core/Fragment";
import { LNewSettings } from "plants/ui/definitions/SettingsLocal";
import ErrorHandling from "./ErrorHandling";

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
    private _oNewSettingsModel: JSONModel; 

	// protected _oSoilDialogHandler: SoilDialogHandler;
	// private _oSuggestionsData: LSuggestions;

	public constructor(
        oView: View, 
    ) {
		super();
		this._oView = oView;  // todo refactor view out
		this._oSettingsModel = new JSONModel(<LEventEditData>{});
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
            const oDisplaySettings = (<JSONModel>this._oView.getModel('settings')).getData().display_settings;
            const mNewSettings: LNewSettings = {
                display_settings: Util.getClonedObject(oDisplaySettings),
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
        const oSettingsModel = <JSONModel>this._oSettingsDialog.getModel('newSettings');

        $.ajax({
            url: Util.getServiceUrl('settings'),
            type: 'POST',
            contentType: "application/json",
            data: JSON.stringify(oSettingsModel.getData()),
            context: this
        })
            .done(() => {
                MessageToast.show("Settings saved successfully.");
                this._oSettingsDialog.close();
            })
            .fail(ErrorHandling.onFail.bind(this, 'Save Settings (POST)'));
    }
}