
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { PlantRead, PlantTag, FBTagState, TaxonTag } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantTagger extends ManagedObject {
	private _oPlantsModel: JSONModel;

	public constructor(oPlantsModel: JSONModel) {
		super();
		this._oPlantsModel = oPlantsModel;
	}

	private _assertText(sTagText: string){
		if (sTagText.length === 0) {
			MessageToast.show('Enter text first.');
			throw new Error('Enter text first.');
		}
	}

	private _getPlantsWithTaxon(taxon_id: int): PlantRead[]{
		const aAllPlants = <PlantRead[]> this._oPlantsModel.getProperty('/PlantsCollection');
		const aPlantsWithTaxon = aAllPlants.filter(function (oPlant: PlantRead) {
			if (oPlant.taxon_id !== taxon_id)
				return false;
			
			// // should not happen but check it doesn't exist already
			// if (oPlant.taxon_tags) {
			// 	const bFound = oPlant.taxon_tags.find(function (oTag: TaxonTagRead) {
			// 		return oTag.text === sTagText;
			// 	});
			// 	if (bFound) {
			// 		return false;
			// 	}
			// }			
			
			return true;
		});
		return aPlantsWithTaxon;
	}

	public deleteTaxonTagFromPlants(sTagText: string, taxon_id: int): void{
		const aPlantsWithTaxon = this._getPlantsWithTaxon(taxon_id);

		// delete tag from all plants with that taxon
		aPlantsWithTaxon.forEach(function (oPlant: PlantRead) {
			// delete tag from plants model
			if (oPlant.taxon_tags) {
				oPlant.taxon_tags = oPlant.taxon_tags.filter(function (oTag: TaxonTag) {
					return oTag.text !== sTagText;
				});
			}
		});

		this._oPlantsModel.updateBindings(true);  // true required for master view plants table
	}

	public addTaxonTagToPlants(sTagText: string, eTagState: FBTagState, taxon_id: int): void{
		this._assertText(sTagText);

		const aPlantsWithTaxon = this._getPlantsWithTaxon(taxon_id);

		// filter out plants that already have the tag
		const aPlantsWithoutTag = aPlantsWithTaxon.filter(function (oPlant: PlantRead) {
			if (oPlant.taxon_tags) {
				const bFound = oPlant.taxon_tags.find(function (oTag: TaxonTag) {
					return oTag.text === sTagText;
				});
				if (bFound) {
					return false;
				}
			}
			return true;
		});

		// add tag to all plants with that taxon
		aPlantsWithoutTag.forEach(function (oPlant: PlantRead) {
			// create new token object in plants model
			const oTaxonTag = <TaxonTag>{
				text: sTagText,
				state: eTagState,
				// plant_id: oPlant.id,
				taxon_id: taxon_id
			};
			if (oPlant.taxon_tags) {
				oPlant.taxon_tags.push(oTaxonTag);
			} else {
				oPlant.taxon_tags = [oTaxonTag];
			}
		});

		this._oPlantsModel.updateBindings(true);  // true required for master view plants table
	}

	public addTagToPlant(sTagText: string, eTagState: FBTagState, aPlants: PlantRead[]): void{
		// create a new tag inside the plant's object in the plants model
		// it will be saved in backend when saving the plant
		// new/deleted tags are within scope of the plants model modification tracking
		this._assertText(sTagText);

		aPlants.forEach(function (oPlant: PlantRead) {

			// if only one plant is meant to be tagged and the new tag text already exists 
			// for that plant, then display a message
			if (oPlant.tags) {
				var bFound = oPlant.tags.find(function (oTag: PlantTag) {
					return oTag.text === sTagText;
				});
				if (bFound) {
					if (aPlants.length === 1)
						MessageToast.show('Tag already exists.');
					return; // like continue in for... loop
				}
			}

			// create new token object in plants model
			const oPlantTag = <PlantTag>{
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