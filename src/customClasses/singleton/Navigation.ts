// helper class for navigation/route-specific methods used applied in multiple controllers
import UriParameters from "sap/base/util/UriParameters";
import FlexibleColumnLayout from "sap/f/FlexibleColumnLayout";
import FlexibleColumnLayoutSemanticHelper from "sap/f/FlexibleColumnLayoutSemanticHelper";
import { LayoutType } from "sap/f/library";
import ManagedObject from "sap/ui/base/ManagedObject";
import View from "sap/ui/core/mvc/View";
import Router from "sap/ui/core/routing/Router";
import { PlantRead } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.singleton
 */
export default class Navigation extends ManagedObject {
	private static _instance: Navigation;
	private _oRouter: Router;
	private _oRootControl: View;

	public static createInstance(oRootControl: View, oRouter: Router): void {
		if (Navigation._instance)
			throw new Error("Navigation already initialized");
		Navigation._instance = new Navigation(oRootControl, oRouter);
	}

	public static getInstance(): Navigation {
		if (!Navigation._instance) 
			throw new Error("Navigation not initialized.");
		return Navigation._instance;
	}	

	private constructor(oRootControl: View, oRouter: Router) {
		super();
		this._oRootControl = oRootControl;
		this._oRouter = oRouter;
	}

	public getFCLHelper(): FlexibleColumnLayoutSemanticHelper {
		const oFlexibleColumnLayout = <FlexibleColumnLayout>this._oRootControl.byId("idFlexibleColumnLayout");
		const oParams = UriParameters.fromQuery();
		const oSettings = {
			defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
			defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
			mode: oParams.get("mode"),
			initialColumnsCount: oParams.get("initial"),
			maxColumnsCount: oParams.get("max")
		};

		return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFlexibleColumnLayout, oSettings);
	}

	public navToPlantDetails(iPlant: int) {
		// todo refactored... adjust comments etc
		// requires the plant index in plants model
		// open requested plants detail view in the mid column; either via...
		// - detail route (two-columns, default)
		// - untagged route (three-colums, only if untagged route already active)
		if (this.getFCLHelper().getCurrentUIState().layout !== "OneColumn") {
			var oNextUIState = this.getFCLHelper().getCurrentUIState();
		} else {
			oNextUIState = this.getFCLHelper().getNextUIState(1);
		}

		// use detail (two-col) route or untagged(three-col) route
		var aHash = this._oRouter.getHashChanger().getHash().split('/');
		var sLastItem = aHash.pop();  // e.g. "TwoColumnsMidExpanded"
		if (sLastItem === 'untagged') {
			this._oRouter.navTo("untagged", { layout: oNextUIState.layout, plant_id: iPlant });
		} else {
			this._oRouter.navTo("detail", { layout: oNextUIState.layout, plant_id: iPlant });
		}
	}

	public navToPlant(oPlant: PlantRead): void {  //, oComponent: Component) {
		//similar to navToPlantDetails with two differences:
		//  - requires the plant object instead of plant id
		//  - requires component to be supplied as parameter (therefore we don't have to bind this to the calling function)
		if (this.getFCLHelper().getCurrentUIState().layout !== "OneColumn") {
			var oNextUIState = this.getFCLHelper().getCurrentUIState();
		} else {
			oNextUIState = this.getFCLHelper().getNextUIState(1);
		}

		// use detail (two-col) route or untagged(three-col) route
		var aHash = this._oRouter.getHashChanger().getHash().split('/');
		var sLastItem = aHash.pop();
		if (sLastItem === 'untagged') {
			this._oRouter.navTo("untagged", { layout: oNextUIState.layout, plant_id: oPlant.id });
		} else {
			this._oRouter.navTo("detail", { layout: oNextUIState.layout, plant_id:  oPlant.id });
		}
	}

}