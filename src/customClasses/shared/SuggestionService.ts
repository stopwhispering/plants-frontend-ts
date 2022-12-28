import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { LPropagationTypeData } from "plants/ui/definitions/PlantsLocal";

/**
 * @namespace plants.ui.customClasses.shared
 */
export default class SuggestionService extends ManagedObject {
	private static _instance: SuggestionService;
	private _oSuggesionsModel: JSONModel;

	public static createInstance(oSuggesionsModel: JSONModel): void {
		this._instance = new SuggestionService(oSuggesionsModel);
	}

	public static getInstance(): SuggestionService {
		if (!this._instance) {
			throw "SuggestionService instance not created";
		}
		return this._instance;
	}
	
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