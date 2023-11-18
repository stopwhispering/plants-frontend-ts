import { LNewPlantInputData } from "plants/ui/definitions/PlantsLocal";
import Dialog from "sap/m/Dialog";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import PlantCreator from "./PlantCreator";
import PlantLookup from "plants/ui//customClasses/plants/PlantLookup"
import MessageToast from "sap/m/MessageToast";
import { Button$PressEvent } from "sap/m/Button";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class NewPlantDialogHandler extends ManagedObject {
    private _oPlantsModel: JSONModel;
    
    private _oNewPlantDialog: Dialog;
    private _oPlantLookup: PlantLookup;
    private _oPlantCreator: PlantCreator;

    constructor(oPlantsModel: JSONModel) {
        super();
        this._oPlantsModel = oPlantsModel;

        this._oPlantLookup = new PlantLookup(this._oPlantsModel);
        this._oPlantCreator = new PlantCreator(this._oPlantsModel, this._oPlantLookup);
    }

    public openNewPlantDialog(oViewAttachTo: View): void{
		if (!this._oNewPlantDialog) {
			Fragment.load({
				name: "plants.ui.view.fragments.master.MasterNewPlant",
				id: oViewAttachTo.getId(),
				controller: this
			}).then((oControl: Control | Control[]) => {
                this._oNewPlantDialog = <Dialog>oControl;
                const oNewPlantInputData: LNewPlantInputData = {
                    newPlantName: undefined
                };
                const oNewPlantModel = new JSONModel(oNewPlantInputData);
                this._oNewPlantDialog.setModel(oNewPlantModel, "newPlantInputData");
				this._oNewPlantDialog.open();
			});
		} else {
			this._oNewPlantDialog.open();
		}
    }

	public onSaveNewPlantButton(oEvent: Button$PressEvent): void {
        const oNewPlantInputData: LNewPlantInputData = (<JSONModel>this._oNewPlantDialog.getModel("newPlantInputData")).getData();
        if (!oNewPlantInputData.newPlantName){
            MessageToast.show("Please enter a name for the new plant");
			return;
        }
        
        const cbCloseDialog = () => this._oNewPlantDialog.close();
		this._oPlantCreator.addNewPlantAndSave(oNewPlantInputData.newPlantName, cbCloseDialog);
	}
	onCancelNewPlantDialog(oEvent: Button$PressEvent) {
		this._oNewPlantDialog.close();
	}
}