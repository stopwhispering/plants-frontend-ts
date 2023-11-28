import Dialog, { Dialog$AfterCloseEvent } from "sap/m/Dialog";
import ManagedObject from "sap/ui/base/ManagedObject";
import View from "sap/ui/core/mvc/View";
import Fragment from "sap/ui/core/Fragment";
import Control from "sap/ui/core/Control";
import ChangeTracker from "../singleton/ChangeTracker";
import { PlantRead, FBPropagationType } from "plants/ui/definitions/Plants";
import MessageToast from "sap/m/MessageToast";
import { LDescendantPlantInput } from "plants/ui/definitions/PlantsLocal";
import PlantLookup from "./PlantLookup";
import JSONModel from "sap/ui/model/json/JSONModel";
import PlantNameGenerator from "./PlantNameGenerator";
import PlantCreator from "./PlantCreator";
import Input from "sap/m/Input";
import formatter from "plants/ui/model/formatter";
import SuggestionService from "../shared/SuggestionService";
import { Button$PressEvent } from "sap/m/Button";
import { InputBase$ChangeEvent } from "sap/m/InputBase";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class NewDescendantPlantDialogHandler extends ManagedObject {
    private _oPlantLookup: PlantLookup;
    private _oPlantCreator: PlantCreator;

    private _oNewDescendantPlantDialog: Dialog;  // "dialogCreateDescendant"

    private _oPlant: PlantRead;
    private _oSuggestionsModel: JSONModel;
    private _oPlantsModel: JSONModel;
    public formatter: formatter;
    public suggestionService: SuggestionService;

    public constructor(oPlantLookup: PlantLookup, oPlantsModel: JSONModel, oSuggestionsModel: JSONModel) {
        super();
        this.formatter = new formatter();
        this._oPlantLookup = oPlantLookup;
        this._oPlantCreator = new PlantCreator(oPlantsModel, this._oPlantLookup);
        this.suggestionService = SuggestionService.getInstance();
        this._oSuggestionsModel = oSuggestionsModel;
        this._oPlantsModel = oPlantsModel;
    }

    public openNewDescendantPlantDialog(oViewAttachTo: View, oPlant: PlantRead): void {

        // cancel if there are any unsaved changes
        const oChangeTracker = ChangeTracker.getInstance();
        // const aModifiedPlants: PlantRead[] = oChangeTracker.getModifiedPlants();
        // const aModifiedImages: ImageRead[] = oChangeTracker.getModifiedImages();
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

            // todo why required here, not in other popups?
            this._oNewDescendantPlantDialog.setModel(this._oSuggestionsModel, "suggestions");
            // todo why required here, not in other popups?
            this._oNewDescendantPlantDialog.setModel(this._oPlantsModel, "plants");

            this.onUpdatePlantNameSuggestion();
            this._oNewDescendantPlantDialog.open();
        });
    }

    public onUpdatePlantNameSuggestion(): void {
        const oModelDescendantPlantInputModel = <JSONModel>this._oNewDescendantPlantDialog.getModel('descendant');
        const oDescendantPlantInputData = <LDescendantPlantInput>oModelDescendantPlantInputModel.getData();
        if (!oDescendantPlantInputData.autoNameDescendantPlantName)
            return
        const oPlantNameGenerator = new PlantNameGenerator(this._oPlantLookup);
        const sSuggestedName = oPlantNameGenerator.generateDescendantPlantName(oDescendantPlantInputData);

        oDescendantPlantInputData.descendantPlantName = sSuggestedName;
        oModelDescendantPlantInputModel.updateBindings(false);
    }

    onCancelCreateDescendantPlantDialog(oEvent: Button$PressEvent) {
        this._oNewDescendantPlantDialog.close();
    }

    onDescendantDialogAfterClose(oEvent: Dialog$AfterCloseEvent) {
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

	onDescendantDialogCreate(oEvent: Button$PressEvent) {
		// triggered from create-descendant-dialog to create the descendant plant
        const oModelDescendantPlantInputModel = <JSONModel>this._oNewDescendantPlantDialog.getModel('descendant');
        const oDescendantPlantInputData = <LDescendantPlantInput>oModelDescendantPlantInputModel.getData();
		this._oPlantCreator.createDescendantPlant(oDescendantPlantInputData);
        this._oNewDescendantPlantDialog.close();
	}

	onDescendantDialogChangeParent(oEvent: InputBase$ChangeEvent) {
		// reset parent plant (/pollen) input if entered plant name is invalid
		var parentPlantName = oEvent.getParameter('value').trim();

		if (!parentPlantName || !this._oPlantLookup.plantNameExists(parentPlantName)) {
			(<Input>oEvent.getSource()).setValue('');
			return;
		}

		this.onUpdatePlantNameSuggestion();
	}
}