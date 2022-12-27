// helper class for navigation/route-specific methods used applied in multiple controllers
import ManagedObject from "sap/ui/base/ManagedObject";
import Component from "../Component";
import { FBPlant } from "../definitions/Plants";

/**
 * @namespace plants.ui.customClasses
 */
export default class Navigation extends ManagedObject {
	private static _instance: Navigation;
	private _component: Component;

	public static getInstance(oComponent?: Component): Navigation {
		if (!Navigation._instance && !oComponent) {
			throw new Error("MessageHandler not initialized and no context supplied");
		} else if (Navigation._instance && oComponent) {
			throw new Error("MessageHandler already initialized");
		} else if (!Navigation._instance && oComponent) {
			Navigation._instance = new Navigation(oComponent);
		}
		return Navigation._instance;
	}	

	private constructor(oComponent: Component) {
		super();
		this._component = oComponent;
	}

	public navToPlantDetails(iPlant: int) {
		// todo refactored... adjust comments etc
		// requires the plant index in plants model
		// open requested plants detail view in the mid column; either via...
		// - detail route (two-columns, default)
		// - untagged route (three-colums, only if untagged route already active)
		if (this._component.getHelper().getCurrentUIState().layout !== "OneColumn") {
			var oNextUIState = this._component.getHelper().getCurrentUIState();
		} else {
			oNextUIState = this._component.getHelper().getNextUIState(1);
		}

		// use detail (two-col) route or untagged(three-col) route
		var aHash = this._component.getRouter().getHashChanger().getHash().split('/');
		var sLastItem = aHash.pop();  // e.g. "TwoColumnsMidExpanded"
		if (sLastItem === 'untagged') {
			this._component.getRouter().navTo("untagged", { layout: oNextUIState.layout, plant_id: iPlant });
		} else {
			this._component.getRouter().navTo("detail", { layout: oNextUIState.layout, plant_id: iPlant });
		}
	}

	public navToPlant(oPlant: FBPlant, oComponent: Component) {
		//similar to navToPlantDetails with two differences:
		//  - requires the plant object instead of plant id
		//  - requires component to be supplied as parameter (therefore we don't have to bind this to the calling function)
		if (oComponent.getHelper().getCurrentUIState().layout !== "OneColumn") {
			var oNextUIState = oComponent.getHelper().getCurrentUIState();
		} else {
			oNextUIState = oComponent.getHelper().getNextUIState(1);
		}

		// use detail (two-col) route or untagged(three-col) route
		var aHash = oComponent.getRouter().getHashChanger().getHash().split('/');
		var sLastItem = aHash.pop();
		if (sLastItem === 'untagged') {
			oComponent.getRouter().navTo("untagged", { layout: oNextUIState.layout, plant_id: oPlant.id });
		} else {
			oComponent.getRouter().navTo("detail", { layout: oNextUIState.layout, plant_id:  oPlant.id });
		}
	}

}