import { FBImage } from "plants/ui/definitions/Images";
import { BPlant } from "plants/ui/definitions/Plants";
import { LRenamePlantInputData } from "plants/ui/definitions/PlantsLocal";
import { BTaxon } from "plants/ui/definitions/Taxon";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import ChangeTracker from "../singleton/ChangeTracker";
import Event from "sap/ui/base/Event";
import PlantRenamer from "./PlantRenamer";
import Navigation from "../singleton/Navigation";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class RenamePlantDialogHandler extends ManagedObject {
    private _oPlantRenamer: PlantRenamer;
    private _oRenamePlantDialog: Dialog;  // "dialogRenamePlant"

    private _oPlant: BPlant;

    public constructor(oPlantRenamer: PlantRenamer) {
        super();
        this._oPlantRenamer = oPlantRenamer;
    }

    public openRenamePlantDialog(oAttachToView: View, oPlant: BPlant): void {

        this._oPlant = oPlant;

        // check if there are any unsaved changes
        const oChangeTracker = ChangeTracker.getInstance();
        // const aModifiedPlants: BPlant[] = oChangeTracker.getModifiedPlants();
        // const aModifiedImages: FBImage[] = oChangeTracker.getModifiedImages();
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

	public onAfterCloseRenamePlantDialog(oEvent: Event): void {
        const oRenamePlantModel = this._oRenamePlantDialog.getModel('renamePlant');
        oRenamePlantModel.destroy();
		this._oRenamePlantDialog.destroy();
	}

	public onCancelRenamePlantDialog(oEvent: Event): void {
        this._oRenamePlantDialog.close();
	}

	public onPressButtonSubmitRenamePlant(oEvent: Event): void {
        const oRenamePlantModel = <JSONModel>this._oRenamePlantDialog.getModel('renamePlant');
		const oRenamePlantInputData: LRenamePlantInputData = oRenamePlantModel.getData();

		this._oPlantRenamer.renamePlant(this._oPlant, oRenamePlantInputData.newPlantName, () => {this._oRenamePlantDialog.close()});
	}

}