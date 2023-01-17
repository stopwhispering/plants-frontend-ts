
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { BPlant, FBPlantTag, FBTagState } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantTagger extends ManagedObject {
	private _oPlantsModel: JSONModel;

	public constructor(oPlantsModel: JSONModel) {
		super();
		this._oPlantsModel = oPlantsModel;
	}

	public addTagToPlant(sTagText: string, eTagState: FBTagState, aPlants: BPlant[]): void{
		// create a new tag inside the plant's object in the plants model
		// it will be saved in backend when saving the plant
		// new/deleted tags are within scope of the plants model modification tracking
		if (sTagText.length === 0) {
			MessageToast.show('Enter text first.');
			return;
		}

		aPlants.forEach(function (oPlant: BPlant) {

			// if only one plant is meant to be tagged and the new tag text already exists 
			// for that plant, then display a message
			if (oPlant.tags) {
				var bFound = oPlant.tags.find(function (oTag: FBPlantTag) {
					return oTag.text === sTagText;
				});
				if (bFound) {
					if (aPlants.length === 1)
						MessageToast.show('Tag already exists.');
					return; // like continue in for... loop
				}
			}

			// create new token object in plants model
			const oPlantTag = <FBPlantTag>{
				text: sTagText,
				state: eTagState,
				plant_id: oPlant.id
			};
			if (oPlant.tags) {
				oPlant.tags.push(oPlantTag);
			} else {
				oPlant.tags = [oPlantTag];
			}

		});

		this._oPlantsModel.updateBindings(true);  // true required for master view plants table
	}

}