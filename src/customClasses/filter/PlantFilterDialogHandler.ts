import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import Util from "../shared/Util";
import ListBinding from "sap/ui/model/ListBinding";
import View from "sap/ui/core/mvc/View";
import ViewSettingsDialog from "sap/m/ViewSettingsDialog";
import Control from "sap/ui/core/Control";
import { LFilterHiddenChoice } from "plants/ui/definitions/PlantsLocal";
import SegmentedButton from "sap/m/SegmentedButton";
import Fragment from "sap/ui/core/Fragment";
import { BPlant, FBPlantTag } from "plants/ui/definitions/Plants";
import StandardTreeItem from "sap/m/StandardTreeItem";
import Event from "sap/ui/base/Event";
import FilterService from "plants/ui/customClasses/filter/PlantFilterService"
import Filter from "sap/ui/model/Filter";
import PlantFilterTaxonTree from "./PlantFilterTaxonTree";
import { LStatusModelData } from "plants/ui/definitions/SharedLocal";
import Tree from "sap/m/Tree";

/**
 * @namespace plants.ui.customClasses.filter
 */
export default class PlantFilterDialogHandler extends ManagedObject {
    private _oPlantsModel: JSONModel;  // "plants"
	private _oPlantsTableBinding: ListBinding;  // plants table binding to be filtered
    private _oStatusModel: JSONModel;  // "status" (LStatusModelData)

    private _oPlantsFilterDialog: ViewSettingsDialog;
    private _oTaxonTreeModel: JSONModel;  // "selection_data" (inst. here)

// todo remove!
    private _oView: View;

    public constructor(oPlantsModel: JSONModel, oPlantsTableBinding: ListBinding, oStatusModel: JSONModel) {
        super();
        this._oPlantsModel = oPlantsModel;
        this._oPlantsTableBinding = oPlantsTableBinding;
        this._oStatusModel = oStatusModel;
    }

	openFilterDialog(oAttachToView: View): void {
		// triggered by show-filters-dialog button; displays filter settings dialog

        this._oView = oAttachToView; // todo remove!


		// at first time, load taxon tree from backend
		var sUrl = Util.getServiceUrl('selection_data');
		if (!this._oTaxonTreeModel)
			this._oTaxonTreeModel = new JSONModel(sUrl);

		// we need to load the fragment in the controller to connect the fragment's events to the controller
		if (!this._oPlantsFilterDialog) {
			const oPromiseFragmentLoaded = Fragment.load({
				name: "plants.ui.view.fragments.master.MasterFilter",
				id: oAttachToView.getId(),
				controller: this
			}).then((oControl: Control|Control[]) => {
                this._oPlantsFilterDialog = <ViewSettingsDialog>oControl;
                // const oDialog: Dialog = oControl as Dialog;

				this._oPlantsFilterDialog.setModel(new JSONModel(), "filterValues");
				this._fillFilterModels();

                oAttachToView.addDependent(this._oPlantsFilterDialog);
                this._oPlantsFilterDialog.setModel(this._oTaxonTreeModel, 'selection');
                // somehow, setting a segmented button's default in xml view doesn't work, so we do it here
                const eInitialKeyHiddenPlants: LFilterHiddenChoice = 'only_active';  // todo maybe remove
                (<SegmentedButton>oAttachToView.byId('sbtnHiddenPlants')).setSelectedKey(eInitialKeyHiddenPlants)
                this._oPlantsFilterDialog.open();
            });
		} else {
            this._fillFilterModels();
		
            this._oPlantsFilterDialog.setModel(this._oTaxonTreeModel, 'selection');
            this._oPlantsFilterDialog.open();
		}
	}

	private _fillFilterModels(): void {
		// (re-)fill filter values model with distinct values for tags and soil names
		// soil names
		const _oFilterValuesModel = <JSONModel>this._oPlantsFilterDialog.getModel('filterValues');

		var aSoilNames = this._oPlantsTableBinding.getDistinctValues('current_soil/soil_name');
		_oFilterValuesModel.setProperty('/soilNames', aSoilNames);

		// propagation types
		var aPropagationTypes = this._oPlantsTableBinding.getDistinctValues('propagation_type');
		_oFilterValuesModel.setProperty('/propagationTypes', aPropagationTypes);

		// nursery/source
		var aNurseriesSources = this._oPlantsTableBinding.getDistinctValues('nursery_source');
		_oFilterValuesModel.setProperty('/nurseriesSources', aNurseriesSources);

		// tags is a list for each plant, so we can't use getDistinctValues on the binding here
		var aPlants = this._oPlantsModel.getData().PlantsCollection;
		var aTags = this._getDistinctTagsFromPlants(aPlants);
		_oFilterValuesModel.setProperty('/tags', aTags);

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

	public onSelectionChangeTaxonTree(oEvent: Event): void {
		const aSelectedItems = <StandardTreeItem[]>oEvent.getParameter("listItems");
		const oPlantFilterTaxonTree = new PlantFilterTaxonTree(this._oTaxonTreeModel);
		oPlantFilterTaxonTree.selectSubItemsInTaxonTree(aSelectedItems);
	}

	public onConfirmFilters(oEvent: Event): void {
		const aFilterItems = oEvent.getParameter("filterItems");
		const sFilterString = oEvent.getParameter("filterString");
		// const oListBinding = <ListBinding>oPlantsTable.getBinding("items");
		const aActiveFilters = <Filter[]>this._oPlantsTableBinding.getFilters('Application');;
		const aSelectedTreeItems = <StandardTreeItem[]>(<Tree>this._oView.byId('taxonTree')).getSelectedItems();
		
		const oSegmentedButton = <SegmentedButton>this._oView.byId('sbtnHiddenPlants');  // todo remove
		var eFilterHiddenChoice = <LFilterHiddenChoice>oSegmentedButton.getSelectedKey();

		// create the filters, considering active filters from search function
		const oFilterService = new FilterService(this._oTaxonTreeModel);
		const aFilters = oFilterService.createFilter(aFilterItems, aSelectedTreeItems, aActiveFilters, eFilterHiddenChoice);

		// apply filter settings
		this._oPlantsTableBinding.filter(aFilters);
		// this.updateTableHeaderPlantsCount();  // todo replace with model, e.g. status

        const oStatusModelData = <LStatusModelData>this._oStatusModel.getData();
		const iPlantsCount = this._oPlantsTableBinding.getLength();
		const sTitle = "Plants (" + iPlantsCount + ")";  // todo really required so set manually? there's a formatter
		// (<Label>this.getView().byId("pageHeadingTitle")).setText(sTitle);

		// switch preview image (favourite or latest)  // todo make this work again
		var sPreview = (<SegmentedButton>this._oView.byId('sbtnPreviewImage')).getSelectedKey() || 'favourite_image';  // todo replace with model, e.g. status
        oStatusModelData.preview_image =  sPreview;

		// update filter bar
		// (<OverflowToolbar>this.byId("tableFilterBar")).setVisible(aFilters.length > 0);  // todo replace with model, e.g. status
		// (<Text>this.byId("tableFilterLabel")).setText(sFilterString);  // todo replace with model, e.g. status
        oStatusModelData.filterBarVisible = aFilters.length > 0;
        oStatusModelData.filterBarLabel = sFilterString;
	}

	public onResetFilters(oEvent: Event): void {
		var sUrl = Util.getServiceUrl('selection_data');
		this._oTaxonTreeModel.loadData(sUrl);
	}



}