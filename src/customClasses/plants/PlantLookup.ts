import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { BPlant } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantLookup extends ManagedObject {
	private _oPlantsModel: JSONModel;

	public constructor(oPlantsModel: JSONModel) {
		super();
		this._oPlantsModel = oPlantsModel;
	}

	public plantNameExists(sPlantName: string): boolean {
		// returns true if a plant with supplied name already exists in the plants model
		const aPlants = <BPlant[]>this._oPlantsModel.getProperty('/PlantsCollection');
		return (aPlants.find(ele => ele.plant_name === sPlantName) !== undefined);
	}

	public getPlantById(plantId: int): BPlant {
		// todo replace other implementation of function with this here
		// todo maybe move to PlantLookup
		const aPlants: BPlant[] = this._oPlantsModel.getProperty('/PlantsCollection');
		const oPlant = aPlants.find(ele => ele.id === plantId);
		if (oPlant === undefined) {
			throw "Plant not found";
		} else {
			return oPlant;
		}
	}

	public getPlantByName(plantName: string): BPlant {
		// todo replace other implementation of function with this here
		// todo maybe move to PlantLookup
		const plants: BPlant[] = this._oPlantsModel.getProperty('/PlantsCollection');
		const plant = plants.find(ele => ele.plant_name === plantName);
		if (plant === undefined) {
			throw "Plant not found: " + plantName;
		} else {
			return plant;
		}
	}
}