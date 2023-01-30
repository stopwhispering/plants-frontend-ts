import Dialog from "sap/m/Dialog";
import ManagedObject from "sap/ui/base/ManagedObject";
import View from "sap/ui/core/mvc/View";
import Event from "sap/ui/base/Event";
import Fragment from "sap/ui/core/Fragment";
import Control from "sap/ui/core/Control";
import ChangeTracker from "../singleton/ChangeTracker";
import { BPlant, FBPropagationType } from "plants/ui/definitions/Plants";
import { FBImage } from "plants/ui/definitions/Images";
import { BTaxon } from "plants/ui/definitions/Taxon";
import MessageToast from "sap/m/MessageToast";
import { LDescendantPlantInput } from "plants/ui/definitions/PlantsLocal";
import PlantLookup from "./PlantLookup";
import JSONModel from "sap/ui/model/json/JSONModel";
import PlantNameGenerator from "./PlantNameGenerator";
import Toast from "sap/ui/webc/main/Toast";
import PlantCreator from "./PlantCreator";
import Input from "sap/m/Input";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class NewDescendantPlantDialogHandler extends ManagedObject {
    private _oPlantLookup: PlantLookup;
    private _oPlantCreator: PlantCreator;

    private _oNewDescendantPlantDialog: Dialog;  // "dialogCreateDescendant"

    private _oPlant: BPlant;

    public constructor(oPlantLookup: PlantLookup, oPlantsModel: JSONModel) {
        super();
        this._oPlantLookup = oPlantLookup;
        this._oPlantCreator = new PlantCreator(oPlantsModel, this._oPlantLookup);
    }

    public openNewDescendantPlantDialog(oViewAttachTo: View, oPlant: BPlant): void {

        // cancel if there are any unsaved changes
        const oChangeTracker = ChangeTracker.getInstance();
        // const aModifiedPlants: BPlant[] = oChangeTracker.getModifiedPlants();
        // const aModifiedImages: FBImage[] = oChangeTracker.getModifiedImages();
        // const aModifiedTaxa: BTaxon[] = oChangeTracker.getModifiedTaxa();
		if (oChangeTracker.hasUnsavedChanges()) {
        // if (!!aModifiedPlants.length || !!aModifiedImages.length || !!aModifiedTaxa.length) {
            MessageToast.show('There are unsaved changes. Save modified data or reload data first.');
            return;
        }

        this._oPlant = oPlant;
        Fragment.load({
            name: "plants.ui.view.fragments.detail.DetailCreateDescendant",
            id: oViewAttachTo.getId(),
            controller: this
        }).then((oControl: Control | Control[]) => {
            this._oNewDescendantPlantDialog = <Dialog>oControl;


            // create json model descendant and set it (default settings are when opening)
            const descendantPlantDataInit: LDescendantPlantInput = {
                propagationType: <FBPropagationType>'seed (collected)',
                parentPlant: this._oPlant.plant_name,
                parentPlantPollen: undefined,
                descendantPlantName: undefined,

                autoNameDescendantPlantName: true,
            };
            const oModelDescendantPlantInputModel = new JSONModel(descendantPlantDataInit);
            this._oNewDescendantPlantDialog.setModel(oModelDescendantPlantInputModel, "descendant");

            this.onUpdatePlantNameSuggestion();

            // const oNewPlantInputData: LNewPlantInputData = {
            //     newPlantName: undefined
            // };
            // const oNewPlantModel = new JSONModel(oNewPlantInputData);
            // this._oNewDescendantPlantDialog.setModel(oNewPlantModel, "newPlantInputData");

            this._oNewDescendantPlantDialog.open();
        });
    }

    public onUpdatePlantNameSuggestion(): void {
        const oModelDescendantPlantInputModel = <JSONModel>this._oNewDescendantPlantDialog.getModel('descendant');
        const oDescendantPlantInputData = <LDescendantPlantInput>oModelDescendantPlantInputModel.getData();
        if (!oDescendantPlantInputData.autoNameDescendantPlantName)
            return

        // const oCheckbox = <CheckBox>this.byId('autoNameDescendantPlantName');
        // if (!oCheckbox.getSelected()) {
        // 	return;
        // }

        // generate new plant name suggestion
        // const oDescendantModel = <JSONModel>this.byId('dialogCreateDescendant').getModel('descendant');
        // const oDescendantPlantInput = <LDescendantPlantInput>oDescendantModel.getData();
        const oPlantNameGenerator = new PlantNameGenerator(this._oPlantLookup);
        const sSuggestedName = oPlantNameGenerator.generateDescendantPlantName(oDescendantPlantInputData);

        // const oModelDescendant = <JSONModel>this.byId('dialogCreateDescendant').getModel('descendant');
        // oModelDescendant.setProperty('/descendantPlantName', sSuggestedName);
        oDescendantPlantInputData.descendantPlantName = sSuggestedName;
        oModelDescendantPlantInputModel.updateBindings(false);
    }

    onCancelCreateDescendantPlantDialog(oEvent: Event) {
        this._oNewDescendantPlantDialog.close();
    }

    onDescendantDialogAfterClose(oEvent: Event) {
        const oModelDescendantPlantInputModel = <JSONModel>this._oNewDescendantPlantDialog.getModel('descendant');
        oModelDescendantPlantInputModel.destroy();
        this._oNewDescendantPlantDialog.destroy();
    }

	onDescendantDialogSwitchParents() {
		// triggered by switch button; switch parent plant and parent plant pollen
        const oModelDescendantPlantInputModel = <JSONModel>this._oNewDescendantPlantDialog.getModel('descendant');
        const oDescendantPlantInputData = <LDescendantPlantInput>oModelDescendantPlantInputModel.getData();

        if (!oDescendantPlantInputData.parentPlantPollen || !oDescendantPlantInputData.parentPlant) {
            MessageToast.show('No parent plant pollen or parent plant selected.');
            return;
        }

		const parentPlantName = oDescendantPlantInputData.parentPlant;
        oDescendantPlantInputData.parentPlant = oDescendantPlantInputData.parentPlantPollen;
        oDescendantPlantInputData.parentPlantPollen = parentPlantName;
		// model.setProperty('/parentPlant', model.getProperty('/parentPlantPollen'));
		// model.setProperty('/parentPlantPollen', parentPlantName);

		this.onUpdatePlantNameSuggestion();
	}

	onDescendantDialogCreate(oEvent: Event) {
		// triggered from create-descendant-dialog to create the descendant plant
        const oModelDescendantPlantInputModel = <JSONModel>this._oNewDescendantPlantDialog.getModel('descendant');
        const oDescendantPlantInputData = <LDescendantPlantInput>oModelDescendantPlantInputModel.getData();
		this._oPlantCreator.createDescendantPlant(oDescendantPlantInputData);
        this._oNewDescendantPlantDialog.close();
	}

	onDescendantDialogChangeParent(oEvent: Event) {
		// reset parent plant (/pollen) input if entered plant name is invalid
		var parentPlantName = oEvent.getParameter('newValue').trim();

		if (!parentPlantName || !this._oPlantLookup.plantNameExists(parentPlantName)) {
			(<Input>oEvent.getSource()).setValue('');
			return;
		}

		this.onUpdatePlantNameSuggestion();
	}
}