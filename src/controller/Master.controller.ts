import BaseController from "plants/ui/controller/BaseController"
import JSONModel from "sap/ui/model/json/JSONModel"
import Filter from "sap/ui/model/Filter"
import Sorter from "sap/ui/model/Sorter"
import Formatter from "plants/ui/model/formatter"
import Util from "plants/ui/customClasses/shared/Util";
import Navigation from "plants/ui/customClasses/singleton/Navigation"
import Fragment from "sap/ui/core/Fragment"
import Popover from "sap/m/Popover"
import Control from "sap/ui/core/Control"
import Table from "sap/m/Table"
import ColumnListItem from "sap/m/ColumnListItem"
import Event from "sap/ui/base/Event"
import ListBinding from "sap/ui/model/ListBinding"
import ViewSettingsDialog from "sap/m/ViewSettingsDialog"
import StandardTreeItem from "sap/m/StandardTreeItem"
import SegmentedButton from "sap/m/SegmentedButton"
import Tree from "sap/m/Tree"
import OverflowToolbar from "sap/m/OverflowToolbar"
import Text from "sap/m/Text"
import Dialog from "sap/m/Dialog"
import Input from "sap/m/Input"
import Avatar from "sap/m/Avatar"
import { BPlant} from "../definitions/Plants"
import { IdToFragmentMap } from "../definitions/SharedLocal"
import PlantLookup from "plants/ui/customClasses/plants/PlantLookup"
import FilterService from "../customClasses/plants/FilterPlantsService"
import { LFilterHiddenChoice } from "../definitions/PlantsLocal"
import PlantCreator from "plants/ui/customClasses/plants/PlantCreator"
import Label from "sap/m/Label"
import PlantSearcher from "plants/ui/customClasses/plants/PlantSearcher"
import PlantFilterOpener from "plants/ui/customClasses/plants/PlantFilterOpener"
import PlantFilterTaxonTree from "plants/ui/customClasses/plants/PlantFilterTaxonTree"

/**
 * @namespace plants.ui.controller
 */
export default class Master extends BaseController {

	public formatter: Formatter = new Formatter();  // requires instant instantiation, otherwise formatter is not available in view
	private navigation: Navigation;
	private oPlantLookup: PlantLookup;
	private oTaxonTreeModel: JSONModel;

	private mIdToFragment = <IdToFragmentMap>{
		popoverPopupImage: "plants.ui.view.fragments.master.MasterImagePopover",
		// settingsDialogFilter: "plants.ui.view.fragments.master.MasterFilter",
		// dialogNewPlant: "plants.ui.view.fragments.master.MasterNewPlant",
		dialogSort: "plants.ui.view.fragments.master.MasterSort",
	}

	onInit() {
		super.onInit();

		this.navigation = Navigation.getInstance();
		this.oPlantLookup = new PlantLookup(this.oComponent.getModel('plants'));
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

	//////////////////////////////////////////////////////////
	// Other Handlers
	//////////////////////////////////////////////////////////	
	onListItemPress(oEvent: Event) {
		// get selected plant
		var oPlant = <BPlant>(<ColumnListItem>oEvent.getSource()).getBindingContext("plants")!.getObject()
		this.navigation.navToPlantDetails(oPlant.id!);
	}

	private updateTableHeaderPlantsCount() {
		// update count in table header
		var iPlants = (<ListBinding>this.getView().byId("plantsTable").getBinding("items")).getLength();
		var sTitle = "Plants (" + iPlants + ")";
		(<Label>this.getView().byId("pageHeadingTitle")).setText(sTitle);
	}

	//////////////////////////////////////////////////////////
	// Search Handlers
	//////////////////////////////////////////////////////////	
	onSearch(oEvent: Event) {
		// filter logic: active AND (plant_name OR botanical_name)
		// therefore, we are going to nest the filters:
		// AND( filter_active, OR( filter_plant_name, filter_botanical_name))
		var sQuery = oEvent.getParameter("query");
		const oPlantsTableBinding = <ListBinding>this.getView().byId("plantsTable").getBinding('items')
		const oPlantSearcher = new PlantSearcher(oPlantsTableBinding);
		oPlantSearcher.search(sQuery);

		// update count in table header
		this.updateTableHeaderPlantsCount();

	}

	//////////////////////////////////////////////////////////
	// Add Plant Handlers
	//////////////////////////////////////////////////////////	
	onAddNewPlant(oEvent: Event) {
		//open dialog to create new plant
		var oView = this.getView();
		const oDialog = <Dialog>this.byId("dialogNewPlant");
		if (!oDialog) {
			Fragment.load({
				name: "plants.ui.view.fragments.master.MasterNewPlant",
				id: oView.getId(),
				controller: this
			}).then((oControl: Control | Control[]) => {
				(<Dialog>oControl).open();
			});
		} else {
			oDialog.open();
		}
	}

	public onAddSaveButton(oEvent: Event): void {
		const sPlantName = (<Input>this.byId("inputCreateNewPlantName")).getValue();
		const oPlantCreator = new PlantCreator(this.oComponent.getModel('plants'), this.oPlantLookup);
		oPlantCreator.addNewPlantAndSave(sPlantName);
		(<Dialog>this.byId("dialogNewPlant")).close();
	}


	//////////////////////////////////////////////////////////
	// Sort Handlers
	//////////////////////////////////////////////////////////
	onShowSortDialog(oEvent: Event) {
		this.applyToFragment('dialogSort', (oViewSettingsDialog: ViewSettingsDialog) => oViewSettingsDialog.open());
	}

	onSortDialogConfirm(oEvent: Event) {
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

	//////////////////////////////////////////////////////////
	// Filter Handlers
	//////////////////////////////////////////////////////////
	onShowFilterDialog(oEvent: Event): void {
		// triggered by show-filters-dialog button; displays filter settings dialog
		const oPlantsTableBinding = <ListBinding>this.byId('plantsTable').getBinding('items');
		const oFilterValuesModel = <JSONModel>this.oComponent.getModel('filterValues');
		const oPlantsModel = this.oComponent.getModel('plants');

		// update taxon tree values from backend
		var sUrl = Util.getServiceUrl('selection_data');
		if (!this.oTaxonTreeModel)
			this.oTaxonTreeModel = new JSONModel(sUrl);

		const oPlantFilterOpener = new PlantFilterOpener(oPlantsTableBinding, oFilterValuesModel, oPlantsModel, this.oTaxonTreeModel);

		// we need to load the fragment in the controller to connect the fragment's events to the controller
		var oView = this.getView();
		const oDialog = <Dialog>this.byId('settingsDialogFilter');
		if (!oDialog) {
			const oPromiseFragmentLoaded = Fragment.load({
				name: "plants.ui.view.fragments.master.MasterFilter",
				id: oView.getId(),
				controller: this
			});
			oPlantFilterOpener.openFilterDialogWhenPromiseResolved(<Promise<Dialog>>oPromiseFragmentLoaded, this.getView());
		} else {
			oPlantFilterOpener.openFilterDialog(oDialog);
		}
		this.applyToFragment('settingsDialogFilter', (oViewSettingsDialog: ViewSettingsDialog) => oViewSettingsDialog.open());  //todo remove
	}

	public onSelectionChangeTaxonTree(oEvent: Event): void {
		const aSelectedItems = <StandardTreeItem[]>oEvent.getParameter("listItems");
		const oPlantFilterTaxonTree = new PlantFilterTaxonTree(this.oTaxonTreeModel);
		oPlantFilterTaxonTree.selectSubItemsInTaxonTree(aSelectedItems);
	}

	public onConfirmFilters(oEvent: Event): void {
		const aFilterItems = oEvent.getParameter("filterItems");
		const sFilterString = oEvent.getParameter("filterString");
		const oPlantsTable = <Table>this.byId("plantsTable");
		const oListBinding = <ListBinding>oPlantsTable.getBinding("items");
		const aActiveFilters = <Filter[]>oListBinding.getFilters('Application');;
		const aSelectedTreeItems = <StandardTreeItem[]>(<Tree>this.byId('taxonTree')).getSelectedItems();
		
		const oSegmentedButton = <SegmentedButton>this.byId('sbtnHiddenPlants');
		var eFilterHiddenChoice = <LFilterHiddenChoice>oSegmentedButton.getSelectedKey();

		// create the filters, considering active filters from search function
		const oFilterService = new FilterService(this.oTaxonTreeModel);
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

	public onResetFilters(oEvent: Event): void {
		var sUrl = Util.getServiceUrl('selection_data');
		this.oTaxonTreeModel.loadData(sUrl);
	}


	//////////////////////////////////////////////////////////
	// Preview Image Popup Handlers
	//////////////////////////////////////////////////////////
	public onHoverImage(oAvatar: Avatar, evtDelegate: JQuery.Event): void {
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

	public onClickImagePopupImage(oEvent: Event): void {
		this.applyToFragment('popoverPopupImage', (oPopover: Popover) => { if (oPopover.isOpen()) { oPopover.close() } });
	}

	public onHoverAwayFromImage(oAvatar: Avatar, evtDelegate: JQuery.Event): void {
		this.applyToFragment('popoverPopupImage', (oPopover: Popover) => { if (oPopover.isOpen()) { oPopover.close() } });
	}

}