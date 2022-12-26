
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { LPropagationTypeData } from "../definitions/PlantsLocal";

/**
 * @namespace plants.ui.customClasses
 */
export default class SuggestionService extends ManagedObject {
	private _oSuggesionsModel: JSONModel;

	public constructor(oSuggesionsModel: JSONModel) {
		super();
		this._oSuggesionsModel = oSuggesionsModel;
	}

	public getSuggestionItem(rootKey: 'propagationTypeCollection', key: string | LPropagationTypeData): LPropagationTypeData|undefined {
		// retrieve an item from suggestions model via root key and key
		// example usage: var selected = getSuggestionItem('propagationTypeCollection', 'bulbil');
		let suggestions;
		switch (rootKey) {
			case 'propagationTypeCollection':
				suggestions = <LPropagationTypeData[]>this._oSuggesionsModel.getProperty('/' + rootKey);
				break;

			default:
				throw "Root Key not found: " + rootKey;
		}

		const suggestion = suggestions.find(s => s['key'] === key);
		if (!suggestion) {
			throw "Suggestion Key not found: " + key;
		}
		return suggestion;
	}

}