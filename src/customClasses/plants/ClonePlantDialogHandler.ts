import { BPlant } from "plants/ui/definitions/Plants";
import { LClonePlantInputData } from "plants/ui/definitions/PlantsLocal";
import Dialog, { Dialog$AfterCloseEvent } from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import ChangeTracker from "../singleton/ChangeTracker";
import PlantLookup from "./PlantLookup";
import PlantNameGenerator from "./PlantNameGenerator";
import PlantCloner from "./PlantCloner";
import { Button$PressEvent } from "sap/m/Button";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class ClonePlantDialogHandler extends ManagedObject {
    private _oPlantLookup: PlantLookup;

    private _oClonePlantDialog: Dialog;  // "dialogClonePlant"

    private _oPlant: BPlant;

    private _oPlantCloner: PlantCloner;

    public constructor(oPlantLookup: PlantLookup, oPlantsModel: JSONModel) {
        super();
        this._oPlantLookup = oPlantLookup;
        this._oPlantCloner = new PlantCloner(oPlantsModel, this._oPlantLookup)
    }

    public openClonePlantDialog(oViewAttachTo: View, oPlant: BPlant): void {

		// check if there are any unsaved changes
		const oChangeTracker = ChangeTracker.getInstance();
		// const aModifiedPlants: BPlant[] = oChangeTracker.getModifiedPlants();
		// const aModifiedImages: FBImage[] = oChangeTracker.getModifiedImages();
		// const aModifiedTaxa: BTaxon[] = oChangeTracker.getModifiedTaxa();
        
		if (oChangeTracker.hasUnsavedChanges()) {
		// if (!!aModifiedPlants.length || !!aModifiedImages.length || !!aModifiedTaxa.length ) {
			MessageToast.show('There are unsaved changes. Save modified data or reload data first.');
			return;
		}
        this._oPlant = oPlant;

        Fragment.load({
            name: "plants.ui.view.fragments.detail.DetailClone",
            id: oViewAttachTo.getId(),
            controller: this
        }).then((oControl: Control | Control[]) => {
            this._oClonePlantDialog = <Dialog>oControl;
			oViewAttachTo.addDependent(this._oClonePlantDialog);

            const oClonePlantInputData: LClonePlantInputData = {
                plantName: '',
            }
            const oClonePlantInputModel = new JSONModel(oClonePlantInputData);
            this._oClonePlantDialog.setModel(oClonePlantInputModel, "clonePlant");

			const oPlantNameGenerator = new PlantNameGenerator(this._oPlantLookup);
			oPlantNameGenerator.requestClonePlantName(this._oPlant, oClonePlantInputModel);

            this._oClonePlantDialog.open();
        });
    }

	onAfterCloseClonePlantDialog(oEvent: Dialog$AfterCloseEvent) {
		this._oClonePlantDialog.destroy();
	}
	onCancelClonePlantDialog(oEvent: Button$PressEvent) {
		const oClonePlantInputModel = this._oClonePlantDialog.getModel("clonePlant");
        oClonePlantInputModel.destroy();
		this._oClonePlantDialog.close();
	}

	onPressButtonSubmitClonePlant(oEvent: Button$PressEvent) {
		// use ajax to clone plant in backend
		const oClonePlantInputModel = <JSONModel>this._oClonePlantDialog.getModel("clonePlant");
        const oClonePlantInputData: LClonePlantInputData = oClonePlantInputModel.getData();
		const sClonedPlantName = oClonePlantInputData.plantName.trim();
		this._oPlantCloner.clonePlant(this._oPlant, sClonedPlantName, this._oClonePlantDialog);
	}

}