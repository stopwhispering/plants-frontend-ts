import Util from "plants/ui/customClasses/shared/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import PlantLookup from "./PlantLookup"
import { BPlant, BResultsProposeSubsequentPlantName} from "plants/ui/definitions/Plants";
import { LClonePlantInputData, LDescendantPlantInput, LPropagationTypeData } from "plants/ui/definitions/PlantsLocal";
import SuggestionService from "plants/ui/customClasses/shared/SuggestionService";
import { ResponseStatus } from "plants/ui/definitions/SharedLocal";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import JSONModel from "sap/ui/model/json/JSONModel";
import ErrorHandling from "../shared/ErrorHandling";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantNameGenerator extends ManagedObject {

    private _oPlantLookup: PlantLookup;
	private _oSuggestionService: SuggestionService = SuggestionService.getInstance();


	public constructor(oPlantLookup: PlantLookup) {
		super();
        this._oPlantLookup = oPlantLookup;
	}
	
	generateDescendantPlantName(oDescendantPlantInput: LDescendantPlantInput): string {
		// generate descendant plant name
		
		if (!oDescendantPlantInput.propagationType || !oDescendantPlantInput.propagationType.length) {
			throw new Error('Propagation type is required');
		}
		const propagationType = <LPropagationTypeData>this._oSuggestionService.getSuggestionItem('propagationTypeCollection', oDescendantPlantInput.propagationType);

		if (oDescendantPlantInput.parentPlant && oDescendantPlantInput.parentPlant.trim().length) {
			const oParentPlant: BPlant = this._oPlantLookup.getPlantByName(oDescendantPlantInput.parentPlant);
			const oParentPlantPollen = (oDescendantPlantInput.parentPlantPollen && propagationType.hasParentPlantPollen) ? this._oPlantLookup.getPlantByName(oDescendantPlantInput.parentPlantPollen) : undefined;
			return this._generateNewPlantNameSuggestion(oParentPlant, oParentPlantPollen);
		} else {
			return '';
		}
	}	

	private _generateNewPlantNameSuggestion(oParentPlant: BPlant, oParentPlantPollen: BPlant | undefined): string {
		// generate new plant name suggestion
		// ... only if parent plant names are set

		// todo: backend!

		// hybrid of two parents
		if (!!oParentPlantPollen) {
			var suggestedName = (oParentPlant.botanical_name || oParentPlant.plant_name) + ' × ' +
				(oParentPlantPollen.botanical_name || oParentPlantPollen.plant_name);
			if (this._oPlantLookup.plantNameExists(suggestedName)) {
				// we need to find a variant using latin numbers, starting with II
				// Consider existing latin number at ending
				suggestedName = this.generatePlantNameWithRomanizedSuffix(suggestedName, 2);
			}

			// Just one parent: add latin number to parent plant name
			// Consider existing latin number at ending
		} else {
			var baseName = oParentPlant.plant_name;
			var reRomanNumber = /\sM{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
			var romanNumberMatch = baseName.match(reRomanNumber);
			if (!!romanNumberMatch) {
				var romanNumber = romanNumberMatch.pop();
				var beginWith = Util.arabize(romanNumber!) + 1;
				// remove the roman number at the end
				baseName = baseName.substr(0, oParentPlant.plant_name.lastIndexOf(' '));
			} else {
				var beginWith = 2;
			}

			// find suitable roman number suffix
			var suggestedName = this.generatePlantNameWithRomanizedSuffix(baseName, beginWith);
		}

		return suggestedName;
	}	

	private generatePlantNameWithRomanizedSuffix(baseName: string, beginWith: int): string {
		// e.g. Aeonium spec. II -> Aeonium spec. III if the former already exists
		for (var i = beginWith; i < 100; i++) {
			var latinNumber = Util.romanize(i);
			var suggestedName = baseName + ' ' + latinNumber;
			if (!this._oPlantLookup.plantNameExists(suggestedName)) {
				return suggestedName;
			}
		}
		throw new Error('Could not generate plant name with romanized suffix.');
	}

	public requestClonePlantName(oPlant: BPlant, oClonePlantInputModel: JSONModel): void{
		$.ajax({
			url: Util.getServiceUrl('plants/propose_subsequent_plant_name/'+oPlant.plant_name),
			type: 'POST',
			context: this,
		})
			.done(this._onReceivingClonePlantName.bind(this, oClonePlantInputModel))
			.fail(ErrorHandling.onFail.bind(this, 'Generate Cloned Plant Name Proposal (POST)'));
	}

	private _onReceivingClonePlantName(oClonePlantInputModel: JSONModel, 
		data: BResultsProposeSubsequentPlantName, sStatus: ResponseStatus, oResponse: JQueryXHR): void {
		console.log('Received clone plant name proposal: ', data);
		const oClonePlantInputData: LClonePlantInputData = oClonePlantInputModel.getData();
		oClonePlantInputData.plantName = data.subsequent_plant_name;
		oClonePlantInputModel.updateBindings(false);
		}
}