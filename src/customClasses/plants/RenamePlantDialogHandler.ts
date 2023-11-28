import { PlantRead } from "plants/ui/definitions/Plants";
import { LRenamePlantInputData } from "plants/ui/definitions/PlantsLocal";
import Dialog, { Dialog$AfterCloseEvent } from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import ChangeTracker from "../singleton/ChangeTracker";
import PlantRenamer from "./PlantRenamer";
import { Button$PressEvent } from "sap/m/Button";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class RenamePlantDialogHandler extends ManagedObject {
    private _oPlantRenamer: PlantRenamer;
    private _oRenamePlantDialog: Dialog;  // "dialogRenamePlant"

    private _oPlant: PlantRead;

    public constructor(oPlantRenamer: PlantRenamer) {
        super();
        this._oPlantRenamer = oPlantRenamer;
    }

    public openRenamePlantDialog(oAttachToView: View, oPlant: PlantRead): void {

        this._oPlant = oPlant;

        // check if there are any unsaved changes
        const oChangeTracker = ChangeTracker.getInstance();
        // const aModifiedPlants: PlantRead[] = oChangeTracker.getModifiedPlants();
        // const aModifiedImages: ImageRead[] = oChangeTracker.getModifiedImages();
        // const aModifiedTaxa: BTaxon[] = oChangeTracker.getModifiedTaxa();
		if (oChangeTracker.hasUnsavedChanges()) {
        // if (!!aModifiedPlants.length || !!aModifiedImages.length || !!aModifiedTaxa.length) {
            MessageToast.show('There are unsaved changes. Save modified data or reload data first.');
            return;
        }

        Fragment.load({
            name: "plants.ui.view.fragments.detail.DetailRename",
            id: oAttachToView.getId(),
            controller: this
        }).then((oControl: Control | Control[]) => {
            this._oRenamePlantDialog = <Dialog>oControl;
            oAttachToView.addDependent(this._oRenamePlantDialog);

            const oRenamePlantInputData: LRenamePlantInputData = {
                newPlantName: this._oPlant.plant_name
            }
            const oRenamePlantModel = new JSONModel(oRenamePlantInputData);
            this._oRenamePlantDialog.setModel(oRenamePlantModel, "renamePlant");

            this._oRenamePlantDialog.open();
        });

    }

	public onAfterCloseRenamePlantDialog(oEvent: Dialog$AfterCloseEvent): void {
        const oRenamePlantModel = this._oRenamePlantDialog.getModel('renamePlant');
        oRenamePlantModel.destroy();
		this._oRenamePlantDialog.destroy();
	}

	public onCancelRenamePlantDialog(oEvent: Button$PressEvent): void {
        this._oRenamePlantDialog.close();
	}

	public onPressButtonSubmitRenamePlant(oEvent: Button$PressEvent): void {
        const oRenamePlantModel = <JSONModel>this._oRenamePlantDialog.getModel('renamePlant');
		const oRenamePlantInputData: LRenamePlantInputData = oRenamePlantModel.getData();

		this._oPlantRenamer.renamePlant(this._oPlant, oRenamePlantInputData.newPlantName, () => {this._oRenamePlantDialog.close()});
	}

}