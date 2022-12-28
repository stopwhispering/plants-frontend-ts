import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import ListBinding from "sap/ui/model/ListBinding";
import { BPlant, FBPlantTag } from "plants/ui/definitions/Plants";
import Dialog from "sap/m/Dialog";
import View from "sap/ui/core/mvc/View";
import SegmentedButton from "sap/m/SegmentedButton";
import { LFilterHiddenChoice } from "plants/ui/definitions/PlantsLocal";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantFilterOpener extends ManagedObject {
	private _oPlantsTableBinding: ListBinding;
	private _oFilterValuesModel: JSONModel;
	private _oPlantsModel: JSONModel;
	private _oTaxonTreeModel: JSONModel

	public constructor(oPlantsTableBinding: ListBinding, oFilterValuesModel: JSONModel, oPlantsModel: JSONModel, oTaxonTreeModel: JSONModel) {
		super();
		this._oPlantsTableBinding = oPlantsTableBinding;
		this._oFilterValuesModel = oFilterValuesModel;
		this._oPlantsModel = oPlantsModel;
		this._oTaxonTreeModel = oTaxonTreeModel;
	}

	public openFilterDialogWhenPromiseResolved(oPromiseFragmentLoaded: Promise<Dialog>, oView: View): void {
		this._fillFilterModels();

		// we need to load the fragment in the controller to connect the fragment's events to the controller
		// here, we wait for the fragment to be loaded and then open the dialog then
		oPromiseFragmentLoaded.then((oDialog: Dialog) => {
			// const oDialog: Dialog = oControl as Dialog;
			oView.addDependent(oDialog);
			oDialog.setModel(this._oTaxonTreeModel, 'selection');
			// somehow, setting a segmented button's default in xml view doesn't work, so we do it here
			const eInitialKeyHiddenPlants: LFilterHiddenChoice = 'only_active';
			(<SegmentedButton>oView.byId('sbtnHiddenPlants')).setSelectedKey(eInitialKeyHiddenPlants)
			oDialog.open();
		});
	}

	openFilterDialog(oDialog: Dialog) {
		this._fillFilterModels();
		
		oDialog.setModel(this._oTaxonTreeModel, 'selection');
		oDialog.open();
	}

	private _fillFilterModels(): void {
		// (re-)fill filter values model with distinct values for tags and soil names
		// soil names
		var aSoilNames = this._oPlantsTableBinding.getDistinctValues('current_soil/soil_name');
		this._oFilterValuesModel.setProperty('/soilNames', aSoilNames);

		// propagation types
		var aPropagationTypes = this._oPlantsTableBinding.getDistinctValues('propagation_type');
		this._oFilterValuesModel.setProperty('/propagationTypes', aPropagationTypes);

		// nursery/source
		var aNurseriesSources = this._oPlantsTableBinding.getDistinctValues('nursery_source');
		this._oFilterValuesModel.setProperty('/nurseriesSources', aNurseriesSources);

		// tags is a list for each plant, so we can't use getDistinctValues on the binding here
		var aPlants = this._oPlantsModel.getData().PlantsCollection;
		var aTags = this._getDistinctTagsFromPlants(aPlants);
		this._oFilterValuesModel.setProperty('/tags', aTags);

		// // update taxon tree values from backend
		// var sUrl = Util.getServiceUrl('selection_data');
		// if (!this._oTaxonTreeModel) {
		// 	this._oTaxonTreeModel = new JSONModel(sUrl);
		// }
	}

	private _getDistinctTagsFromPlants(aPlants: BPlant[]) {
		// collect distinct tags assigned to any plant
		var aTagsAll = <string[]>[];
		for (var i = 0; i < aPlants.length; i++) {
			var aTagObjects = <FBPlantTag[]>aPlants[i].tags;
			if (!!aTagObjects.length) {
				// get tag texts from tag object list
				var aTags = <string[]>aTagObjects.map(function (tag_obj) { return tag_obj.text; });
				aTagsAll = aTagsAll.concat(aTags);
			}
		}
		return Array.from(new Set(aTagsAll));
	}
}