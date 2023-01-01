import Popover from "sap/m/Popover";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import View from "sap/ui/core/mvc/View";
import Event from "sap/ui/base/Event";
import Fragment from "sap/ui/core/Fragment";
import { ObjectStatusCollection } from "plants/ui/definitions/entities";
import JSONModel from "sap/ui/model/json/JSONModel";
import { BPlant } from "plants/ui/definitions/Plants";
import PlantTagger from "./PlantTagger";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class NewPlantTagPopoverHandler extends ManagedObject {
	private _oNewPlantTagPopover: Popover;
	private _oPlant: BPlant;
	private _oPlantTagger: PlantTagger;

	public constructor(oPlantsModel: JSONModel) {
		super();
		this._oPlantTagger = new PlantTagger(oPlantsModel);
	}

	public openNewPlantTagPopover(oPlant: BPlant, oOpenBy: Control, oAttachTo: View): void {
		this._oPlant = oPlant;

		if (!this._oNewPlantTagPopover) {
			Fragment.load({
				name: "plants.ui.view.fragments.detail.DetailTagAdd",
				id: oAttachTo.getId(),
				controller: this
			}).then((oControl: Control | Control[]) => {
				this._oNewPlantTagPopover = <Popover>oControl;

				const mObjectStatusSelection = <ObjectStatusCollection>{
					ObjectStatusCollection: [
						{ selected: false, 'text': 'None', 'state': 'None' },
						{ selected: false, 'text': 'Indication01', 'state': 'Indication01' },
						{ selected: false, 'text': 'Success', 'state': 'Success' },
						{ selected: true, 'text': 'Information', 'state': 'Information' },
						{ selected: false, 'text': 'Error', 'state': 'Error' },
						{ selected: false, 'text': 'Warning', 'state': 'Warning' }
					],
					Value: ''
				};
				const oTagTypesModel = new JSONModel(mObjectStatusSelection);
				this._oNewPlantTagPopover.setModel(oTagTypesModel, 'tagTypes');

				oAttachTo.addDependent(this._oNewPlantTagPopover);
				this._oNewPlantTagPopover.openBy(oOpenBy, true);
			});
		} else {
			this._oNewPlantTagPopover.openBy(oOpenBy, true);
		}
	}
	
	public onCancelNewPlantTagDialog(oEvent: Event): void {
		this._oNewPlantTagPopover.close();
		
	}

	onAddTag(oEvent: Event) {
		// create a new tag inside the plant's object in the plants model
		// it will be saved in backend when saving the plant
		// new/deleted tags are within scope of the plants model modification tracking
		const oModelTagTypes = <JSONModel>this._oNewPlantTagPopover.getModel('tagTypes');
		this._oPlantTagger.addTagToPlant(this._oPlant, oModelTagTypes);
		this._oNewPlantTagPopover.close()
	}	


}