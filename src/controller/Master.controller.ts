import BaseController from "plants/ui/controller/BaseController"
import JSONModel from "sap/ui/model/json/JSONModel"
import Filter from "sap/ui/model/Filter"
import FilterOperator from "sap/ui/model/FilterOperator"
import FilterType from "sap/ui/model/FilterType"
import Sorter from "sap/ui/model/Sorter"
import Formatter from "plants/ui/model/formatter"
import MessageToast from "sap/m/MessageToast"
import * as Util from "plants/ui/customClasses/Util";
import Navigation from "plants/ui/customClasses/Navigation"
import Fragment from "sap/ui/core/Fragment"
import Popover from "sap/m/Popover"
import Control from "sap/ui/core/Control"
import Table from "sap/m/Table"
import ColumnListItem from "sap/m/ColumnListItem"
import Event from "sap/ui/base/Event"
import ListBinding from "sap/ui/model/ListBinding"
import ViewSettingsDialog from "sap/m/ViewSettingsDialog"
import StandardTreeItem from "sap/m/StandardTreeItem"
import { BTaxonTreeNode } from "../definitions/Selection"
import { LTaxonTreeNodeInFilterDialog } from "../definitions/SelectionLocal"
import SegmentedButton from "sap/m/SegmentedButton"
import Tree from "sap/m/Tree"
import OverflowToolbar from "sap/m/OverflowToolbar"
import Text from "sap/m/Text"
import Dialog from "sap/m/Dialog"
import Input from "sap/m/Input"
import Avatar from "sap/m/Avatar"
import { BPlant, FBPlantTag, FPlant } from "../definitions/Plants"
import { IdToFragmentMap } from "../definitions/SharedLocal"
import PlantServices from "../customClasses/PlantServices"
import SuggestionService from "../customClasses/SuggestionService"
import FilterService from "../customClasses/FilterPlantsService"
import { LFilterHiddenChoice } from "../definitions/PlantsLocal"

/**
 * @namespace plants.ui.controller
 */
export default class Master extends BaseController {

	public formatter: Formatter = new Formatter();
	private navigation = Navigation.getInstance();
	private plantServices: PlantServices;
	private oModelTaxonTree: JSONModel;
	private suggestionService: SuggestionService;

	private mIdToFragment = <IdToFragmentMap>{
		popoverPopupImage: "plants.ui.view.fragments.master.MasterImagePopover",
		settingsDialogFilter: 'plants.ui.view.fragments.master.MasterFilter',
		dialogNewPlant: 'plants.ui.view.fragments.master.MasterNewPlant',
		dialogSort: "plants.ui.view.fragments.master.MasterSort",
	}

	onInit() {
		super.onInit();

		this.suggestionService = new SuggestionService(this.oComponent.getModel('suggestions'));
		this.plantServices = new PlantServices(this.applyToFragment.bind(this), this.oComponent.getModel('plants'), this.oComponent.oPlantsDataClone, this.suggestionService);
	}

	onAfterRendering() {
		// we need to update the plants display counter in table title 
		// (when data was loaded, the view was not existing, yet)
		var oTable = <Table>this.byId('plantsTable');
		oTable.attachUpdateFinished(this.updateTableHeaderPlantsCount.bind(this));
	}

	protected applyToFragment(sId: string, fn: Function, fnInit?: Function) {
		// to enable vs code to connect fragments with a controller, we may not mention
		// the Dialog/Popover ID in the base controller; therefore we have these names
		// hardcoded in each controller 
		super.applyToFragment(sId, fn, fnInit, this.mIdToFragment);
	}

	onListItemPress(oEvent: Event) {
		// get selected plant
		var oPlant = <BPlant>(<ColumnListItem>oEvent.getSource()).getBindingContext("plants")!.getObject()
		this.navigation.navToPlantDetails(oPlant.id!);
	}

	onSearch(oEvent: Event) {
		// filter logic: active AND (plant_name OR botanical_name)
		// therefore, we are going to nest the filters:
		// AND( filter_active, OR( filter_plant_name, filter_botanical_name))
		var sQuery = oEvent.getParameter("query");

		//check for  filter on active plants
		const oPlantsTableBinding = <ListBinding>this.getView().byId("plantsTable").getBinding('items')
		const aActiveFilters = <Filter[]>oPlantsTableBinding.getFilters(FilterType.Application);
		// var aActiveFilters = oBinding.aApplicationFilters;

		//modify filters only on fields plant_name and botanical_name
		//leave active state filter (and possible others) as is
		//therefore collect other filters
		var aNewFilters = [];
		const aRelevantPaths: (string | undefined)[] = ['plant_name', 'botanical_name', undefined]
		for (var i = 0; i < aActiveFilters.length; i++) {
			const oActiveFilter = <Filter>aActiveFilters[i];
			const sPath: string | undefined = oActiveFilter.getPath();
			if (!(aRelevantPaths.indexOf(sPath) > -1)) {
				// if (!aRelevantPaths.includes(sPath)) {
				aNewFilters.push(aActiveFilters[i]);  //and	
			}
		}

		// create new filters for plant_name and botanical_name (linked with OR)
		var aNestedFilters = [new Filter("plant_name", FilterOperator.Contains, sQuery),
		new Filter("botanical_name", FilterOperator.Contains, sQuery)];
		var oFilterOr = new Filter({
			filters: aNestedFilters,
			and: false
		});
		aNewFilters.push(oFilterOr);

		//attach both filters (default: AND)
		//update the aggregation binding's filter
		oPlantsTableBinding.filter(aNewFilters, FilterType.Application);

		// update count in table header
		this.updateTableHeaderPlantsCount();
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

	onShowFilterDialog(oEvent: Event) {
		// triggered by show-filters-dialog button; displays filter settings dialog

		// (re-)fill filter values model with distinct values for tags and soil names
		var oModelFilterValues = this.oComponent.getModel('filterValues');

		// soil names
		var oBinding = <ListBinding>this.byId('plantsTable').getBinding('items');
		var aSoilNames = oBinding.getDistinctValues('current_soil/soil_name');
		oModelFilterValues.setProperty('/soilNames', aSoilNames);

		// propagation types
		var aPropagationTypes = oBinding.getDistinctValues('propagation_type');
		oModelFilterValues.setProperty('/propagationTypes', aPropagationTypes);

		// nursery/source
		var aNurseriesSources = oBinding.getDistinctValues('nursery_source');
		oModelFilterValues.setProperty('/nurseriesSources', aNurseriesSources);

		// tags is a list for each plant, so we can't use getDistinctValues on the binding here
		var aPlants = this.oComponent.getModel('plants').getData().PlantsCollection;
		var aTags = this._getDistinctTagsFromPlants(aPlants);
		oModelFilterValues.setProperty('/tags', aTags);

		// update taxon tree values from backend
		var sUrl = Util.getServiceUrl('selection_data');
		if (!this.oModelTaxonTree) {
			this.oModelTaxonTree = new JSONModel(sUrl);
		}

		var oView = this.getView();
		const oDialog = <Dialog>this.byId('settingsDialogFilter');
		if (!oDialog) {
			Fragment.load({
				name: 'plants.ui.view.fragments.master.MasterFilter',
				id: oView.getId(),
				controller: this
			}).then((oControl: Control | Control[]) => {
				const oDialog: Dialog = oControl as Dialog;
				oView.addDependent(oDialog);
				oDialog.setModel(this.oModelTaxonTree, 'selection');
				oDialog.open();
			});
		} else {
			oDialog.setModel(this.oModelTaxonTree, 'selection');
			oDialog.open();
		}
	}

	private _addSelectedFlag(aNodes: BTaxonTreeNode[], bSelected: boolean) {
		const that = this;
		aNodes.forEach(function (oNode: BTaxonTreeNode) {
			let oNodeInFilterDialog: LTaxonTreeNodeInFilterDialog = <LTaxonTreeNodeInFilterDialog>oNode;
			oNodeInFilterDialog.selected = bSelected;
			if (!!oNodeInFilterDialog.nodes && oNodeInFilterDialog.nodes.length > 0) {
				that._addSelectedFlag(oNodeInFilterDialog.nodes, bSelected);
			}
		});
	}

	public onSelectionChangeTaxonTree(oEvent: Event) {
		var aItems = oEvent.getParameter("listItems");
		let that = this;
		aItems.forEach(function (oItem: StandardTreeItem) {
			var oNode = <BTaxonTreeNode>oItem.getBindingContext('selection')!.getObject();
			var bSelected = oItem.getSelected();
			if (oNode.nodes) {
				that._addSelectedFlag(oNode.nodes, bSelected);
			}
		});
		this.oModelTaxonTree.refresh();
	}

	public onConfirmFilters(oEvent: Event) {
		const aFilterItems = oEvent.getParameter("filterItems");
		const sFilterString = oEvent.getParameter("filterString");
		const oPlantsTable = <Table>this.byId("plantsTable");
		const oListBinding = <ListBinding>oPlantsTable.getBinding("items");
		const aActiveFilters = <Filter[]>oListBinding.getFilters('Application');;
		const aSelectedTreeItems = <StandardTreeItem[]>(<Tree>this.byId('taxonTree')).getSelectedItems();
		
		var eFilterHiddenChoice = <LFilterHiddenChoice>(<SegmentedButton>this.byId('sbtnHiddenPlants')).getSelectedKey();

		// create the filters, considering active filters from search function
		const oFilterService = new FilterService(this.oModelTaxonTree);
		const aFilters = oFilterService.createFilter(aFilterItems, sFilterString, aSelectedTreeItems, aActiveFilters, eFilterHiddenChoice);

		// apply filter settings
		oListBinding.filter(aFilters);
		this.updateTableHeaderPlantsCount();

		// switch preview image (favourite or latest)
		var sPreview = (<SegmentedButton>this.byId('sbtnPreviewImage')).getSelectedKey() || 'favourite_image';
		this.oComponent.getModel('status').setProperty('/preview_image', sPreview);

		// update filter bar
		(<OverflowToolbar>this.byId("tableFilterBar")).setVisible(aFilters.length > 0);
		(<Text>this.byId("tableFilterLabel")).setText(sFilterString);
	}

	onAddNewPlant(oEvent: Event) {
		//open dialog to create new plant
		var oView = this.getView();
		const oDialog = <Dialog>this.byId('dialogNewPlant');
		if (!oDialog) {
			Fragment.load({
				name: this.mIdToFragment["dialogNewPlant"],
				id: oView.getId(),
				controller: this
			}).then((oControl: Control | Control[]) => {
				(<Dialog>oControl).open();
			});
		} else {
			oDialog.open();
		}
	}

	public onAddSaveButton(oEvent: Event) {
		var sPlantName = (<Input>this.byId("inputCreateNewPlantName")).getValue();
		//check and not empty
		if (sPlantName === '') {
			MessageToast.show('Empty not allowed.');
			return;
		}

		if (sPlantName.includes('/')) {
			MessageToast.show('Forward slash not allowed.');
			return;
		}

		//check if new
		if (this.plantServices.plantNameExists(sPlantName)) {
			MessageToast.show('Plant Name already exists.');
			return;
		}

		// this.saveNewPsaveNewPlantlant({
		this.plantServices.saveNewPlant(<FPlant>{
			plant_name: sPlantName,
			active: true,
			descendant_plants_all: [],  //auto-derived in backend
			sibling_plants: [],  //auto-derived in backend
			same_taxon_plants: [],  //auto-derived in backend
			tags: [],
		});
		this.applyToFragment('dialogNewPlant', (oDialog: Dialog) => oDialog.close());
	}

	onShowSortDialog(oEvent: Event) {
		this.applyToFragment('dialogSort', (oViewSettingsDialog: ViewSettingsDialog) => oViewSettingsDialog.open());
	}

	handleSortDialogConfirm(oEvent: Event) {
		const oTable = this.byId("plantsTable");
		const oSortItem = oEvent.getParameter('sortItem');
		const bDescending = oEvent.getParameter('sortDescending');
		const oBinding = <ListBinding>oTable.getBinding("items");
		let sPath;
		const aSorters = [];

		sPath = oSortItem.getKey();
		aSorters.push(new Sorter(sPath, bDescending));

		// apply the selected sort and group settings
		oBinding.sort(aSorters);
	}

	public onResetFilters(oEvent: Event) {
		var sUrl = Util.getServiceUrl('selection_data');
		this.oModelTaxonTree.loadData(sUrl);
	}

	public onHoverImage(oAvatar: Avatar, evtDelegate: JQuery.Event) {
		// apply _onHoverImageShow function to popover
		var oBindingContext = oAvatar.getBindingContext('plants')!;
		var oView = this.getView();
		const oPopover = <Popover>this.byId('popoverPopupImage');
		if (!oPopover) {
			Fragment.load({
				name: this.mIdToFragment["popoverPopupImage"],
				id: oView.getId(),
				controller: this
			}).then((oControl: Control | Control[]) => {
				const oPopover: Popover = oControl as Popover;
				oView.addDependent(oPopover);
				oPopover.setBindingContext(oBindingContext, 'plants');
				oPopover.openBy(oAvatar, true);
			});
		} else {
			oPopover.setBindingContext(oBindingContext, 'plants');
			oPopover.openBy(oAvatar, true);
		}
	}

	public onClickImagePopupImage(oEvent: Event) {
		this.applyToFragment('popoverPopupImage', (oPopover: Popover) => { if (oPopover.isOpen()) { oPopover.close() } });
	}

	public onHoverAwayFromImage(oAvatar: Avatar, evtDelegate: JQuery.Event) {
		this.applyToFragment('popoverPopupImage', (oPopover: Popover) => { if (oPopover.isOpen()) { oPopover.close() } });
	}

}