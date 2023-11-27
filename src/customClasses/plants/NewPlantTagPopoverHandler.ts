import Popover, { Popover$AfterCloseEvent } from "sap/m/Popover";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import View from "sap/ui/core/mvc/View";
import Fragment from "sap/ui/core/Fragment";
import { LTagInput, LTagInputStatus } from "plants/ui/definitions/entities";
import JSONModel from "sap/ui/model/json/JSONModel";
import { BPlant } from "plants/ui/definitions/Plants";
import PlantTagger from "./PlantTagger";
import { Button$PressEvent } from "sap/m/Button";
import { Input$SubmitEvent } from "sap/m/Input";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class NewPlantTagPopoverHandler extends ManagedObject {
	private _oNewPlantTagPopover: Popover;
	private _aPlants: BPlant[];
	private _oPlantTagger: PlantTagger;

	public constructor(oPlantsModel: JSONModel) {
		super();
		this._oPlantTagger = new PlantTagger(oPlantsModel);
	}

	private async _initPopover(oAttachTo: View){
		this._oNewPlantTagPopover = <Popover>await Fragment.load({
			name: "plants.ui.view.fragments.detail.DetailTagAdd",
			id: oAttachTo.getId(),
			controller: this
		});
		
		// .then((oControl: Control | Control[]) => {
		// 	this._oNewPlantTagPopover = <Popover>oControl;
		// })
	}

	public async openNewPlantTagPopover(aPlants: BPlant[], oOpenBy: Control, oAttachTo: View, bDisplayTaxonOption: boolean) {
		// this._oPlant = aPlants;
		this._aPlants = aPlants;

		if (!this._oNewPlantTagPopover) {
			await this._initPopover(oAttachTo);
			const aTagStatusCollection = [
				<LTagInputStatus>{ selected: false, 'text': 'None', 'state': 'None' },
				<LTagInputStatus>{ selected: false, 'text': 'Indication01', 'state': 'Indication01' },
				<LTagInputStatus>{ selected: false, 'text': 'Success', 'state': 'Success' },
				<LTagInputStatus>{ selected: true, 'text': 'Information', 'state': 'Information' },
				<LTagInputStatus>{ selected: false, 'text': 'Error', 'state': 'Error' },
				<LTagInputStatus>{ selected: false, 'text': 'Warning', 'state': 'Warning' }
			]
			const oTagInputData = <LTagInput>{
				TagStatusCollection: aTagStatusCollection,
				Value: '',
				TagPlant: true,
				TagTaxon: false,
				DisplayTaxonOption: bDisplayTaxonOption, 
			};
			const oTagInputModel = new JSONModel(oTagInputData);
			this._oNewPlantTagPopover.setModel(oTagInputModel, 'tagInput');
			oAttachTo.addDependent(this._oNewPlantTagPopover);

		} else {
			// update only the display taxon option
			const oTagInputModel = <JSONModel>this._oNewPlantTagPopover.getModel('tagInput');
			const oTagInputData = <LTagInput>oTagInputModel.getData();
			oTagInputData.DisplayTaxonOption = bDisplayTaxonOption;
			if (!oTagInputData.DisplayTaxonOption){
				oTagInputData.TagPlant = true;
				oTagInputData.TagTaxon = false;
			}
			oTagInputModel.updateBindings(false);
		}
		
		this._oNewPlantTagPopover.openBy(oOpenBy, true);
	}
	
	public onCancelNewPlantTagDialog(oEvent: Button$PressEvent): void {
		this._oNewPlantTagPopover.close();
		
	}

	onAddTag(oEvent: Input$SubmitEvent) {
		// create a new tag inside the plant's object in the plants model
		// it will be saved in backend when saving the plant
		// new/deleted tags are within scope of the plants model modification tracking
		const oTagInputModel = <JSONModel>this._oNewPlantTagPopover.getModel('tagInput');
		const oTagInputData = <LTagInput>oTagInputModel.getData();

		// get selected ObjectStatus template (~ color)
		const oSelectedStatus = oTagInputData.TagStatusCollection.find(function (element: LTagInputStatus) {
			return element.selected;
		});

		try{
			if (oTagInputData.TagPlant)
				this._oPlantTagger.addTagToPlant(oTagInputData.Value.trim(), oSelectedStatus.state, this._aPlants);
			else {
				if (!this._aPlants[0].taxon_id){
					throw new Error('No taxon.');
				}
				// this is only called when a single plant is selected, i.e. from details view
				this._oPlantTagger.addTaxonTagToPlants(oTagInputData.Value.trim(), oSelectedStatus.state, this._aPlants[0].taxon_id);
			}
		} finally {
			this._oNewPlantTagPopover.close();
		}
	}
	onCloseNewPlantTagDialog(oEvent: Popover$AfterCloseEvent) {
		// this._oNewPlantTagPopover.destroy();
		// const oTagInputModel = <JSONModel>this._oNewPlantTagPopover.getModel('tagInput');
		// oTagInputModel.destroy();
	}	


}