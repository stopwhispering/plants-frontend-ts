
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { ObjectStatusData } from "plants/ui/definitions/entities";
import { BPlant, FBPlantTag } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantTagger extends ManagedObject {
	private _oPlantsModel: JSONModel;

	public constructor(oPlantsModel: JSONModel) {
		super();
		this._oPlantsModel = oPlantsModel;
	}

	public addTagToPlant(oPlant: BPlant, oModelTagTypes: JSONModel): void{
		// create a new tag inside the plant's object in the plants model
		// it will be saved in backend when saving the plant
		// new/deleted tags are within scope of the plants model modification tracking
		// var oModelTagTypes = <JSONModel>oPopover.getModel('tagTypes');
		var dDialogData = oModelTagTypes.getData();
		dDialogData.Value = dDialogData.Value.trim();

		// check if empty 
		if (dDialogData.Value.length === 0) {
			MessageToast.show('Enter text first.');
			return;
		}

		// get selected ObjectStatus template
		var oSelectedElement = dDialogData.ObjectStatusCollection.find(function (element: ObjectStatusData) {
			return element.selected;
		});

		// check if same-text tag already exists for plant
		if (oPlant.tags) {
			var bFound = oPlant.tags.find(function (oTag: FBPlantTag) {
				return oTag.text === dDialogData.Value;
			});
			if (bFound) {
				MessageToast.show('Tag already exists.');
				return;
			}
		}

		// create new token object in plants model
		var dNewTag = <FBPlantTag>{
			// id is determined upon saving to db
			text: dDialogData.Value,
			// icon: oSelectedElement.icon,
			state: oSelectedElement.state,
			// last_update is determined upon saving to db
			// plant_name: oPlant.plant_name,
			plant_id: oPlant.id
		};
		if (oPlant.tags) {
			oPlant.tags.push(dNewTag);
		} else {
			oPlant.tags = [dNewTag];
		}

		this._oPlantsModel.updateBindings(false);
	}
}