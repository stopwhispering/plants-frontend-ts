import BaseController from "plants/ui/controller/BaseController"
import JSONModel from "sap/ui/model/json/JSONModel"
import Formatter from "plants/ui/model/formatter"
import Navigation from "plants/ui/customClasses/singleton/Navigation"
import Popover from "sap/m/Popover"
import Table from "sap/m/Table"
import ColumnListItem from "sap/m/ColumnListItem"
import ListBinding from "sap/ui/model/ListBinding"
import { PlantRead } from "../definitions/Plants"
import Label from "sap/m/Label"
import PlantSearcher from "plants/ui/customClasses/filter/PlantSearcher"
import NewPlantDialogHandler from "../customClasses/plants/NewPlantDialogHandler"
import PlantFilterDialogHandler from "../customClasses/filter/PlantFilterDialogHandler"
import SortPlantsDialogHandler from "../customClasses/filter/SortPlantsDialogHandler"
import ImagePreviewPopoverHandler from "../customClasses/filter/ImagePreviewPopoverHandler"
import OverflowToolbarButton from "sap/m/OverflowToolbarButton"
import MessageToast from "sap/m/MessageToast"
import NewPlantTagPopoverHandler from "../customClasses/plants/NewPlantTagPopoverHandler"
import { ListItemBase$PressEvent } from "sap/m/ListItemBase"
import { Button$PressEvent } from "sap/m/Button"
import { SearchField$SearchEvent } from "sap/m/SearchField"
import Control from "sap/ui/core/Control"
import Image from "sap/m/Image"
import HoverImage$HoverEvent from "../control/HoverImage"
import UIComponent from "sap/ui/core/UIComponent"

/**
 * @namespace plants.ui.controller
 */
export default class Master extends BaseController {

	public formatter: Formatter = new Formatter();  // requires instant instantiation, otherwise formatter is not available in view
	private navigation: Navigation;


	private _oPlantFilterDialogHandler: PlantFilterDialogHandler | undefined;  // lazy instantiation
	private _oSortPlantsDialogHandler: SortPlantsDialogHandler | undefined;  // lazy instantiation
	private _oImagePreviewPopoverHandler: ImagePreviewPopoverHandler | undefined;  // lazy instantiation
	private _oNewPlantDialogHandler: NewPlantDialogHandler | undefined;  // lazy instantiation
	private _oNewPlantTagPopoverHandler: NewPlantTagPopoverHandler; // lazy instantiation

	onInit() {
		super.onInit();
		this.navigation = Navigation.getInstance();
	}

	onAfterRendering() {
		// we need to update the plants display counter in table title 
		// (when data was loaded, the view was not existing, yet)
		var oTable = <Table>this.byId('plantsTable');
		oTable.attachUpdateFinished(this.updateTableHeaderPlantsCount.bind(this));
	}

	//////////////////////////////////////////////////////////
	// Other Handlers
	//////////////////////////////////////////////////////////	
	onListItemPress(oEvent: ListItemBase$PressEvent) {
		// get selected plant
		var oPlant = <PlantRead>(<ColumnListItem>oEvent.getSource()).getBindingContext("plants")!.getObject()
		this.navigation.navToPlantDetails(oPlant.id!);
	}

	private updateTableHeaderPlantsCount() {
		// update count in table header
		var iPlants = (<ListBinding>this.getView()!.byId("plantsTable")!.getBinding("items")).getLength();
		var sTitle = "Plants (" + iPlants + ")";
		(<Label>this.getView().byId("pageHeadingTitle")).setText(sTitle);
	}

	//////////////////////////////////////////////////////////
	// Search Handler
	//////////////////////////////////////////////////////////	
	onSearch(oEvent: SearchField$SearchEvent) {
		// filter logic: active AND (plant_name OR botanical_name)
		// therefore, we are going to nest the filters:
		// AND( filter_active, OR( filter_plant_name, filter_botanical_name))
		var sQuery = oEvent.getParameter("query");
		sQuery = sQuery.trim();
		const oPlantsTableBinding = <ListBinding>this.getView()!.byId("plantsTable")!.getBinding('items')
		const oPlantSearcher = new PlantSearcher(oPlantsTableBinding);
		oPlantSearcher.search(sQuery);

		// update count in table header
		this.updateTableHeaderPlantsCount();
	}

	//////////////////////////////////////////////////////////
	// Add Plant Handler
	//////////////////////////////////////////////////////////	
	onAddNewPlant(oEvent: Button$PressEvent) {
		//open dialog to create new plant
		if (!this._oNewPlantDialogHandler)
		 	this._oNewPlantDialogHandler = new NewPlantDialogHandler(this.oComponent.getModel('plants'));
		this._oNewPlantDialogHandler.openNewPlantDialog(this.getView());
	}

	//////////////////////////////////////////////////////////
	// Sort Handler
	//////////////////////////////////////////////////////////
	onShowSortDialog(oEvent: Button$PressEvent) {
		if (!this._oSortPlantsDialogHandler) {
			const oTable = this.byId("plantsTable");
			const oPlantsTableBinding = <ListBinding>oTable.getBinding("items");
			this._oSortPlantsDialogHandler = new SortPlantsDialogHandler(oPlantsTableBinding);
		}
		this._oSortPlantsDialogHandler.openSortDialog(this.getView());
	}

	//////////////////////////////////////////////////////////
	// Filter Handler
	//////////////////////////////////////////////////////////
	onShowFilterDialog(oEvent: Button$PressEvent): void {
		if (!this._oPlantFilterDialogHandler) {
			const oPlantsTableBinding = <ListBinding>this.byId('plantsTable').getBinding('items');
			const oPlantsModel = this.oComponent.getModel('plants');
			const oStatusModel = this.oComponent.getModel('status');
			this._oPlantFilterDialogHandler = new PlantFilterDialogHandler(oPlantsModel, oPlantsTableBinding, oStatusModel);
		}
		this._oPlantFilterDialogHandler.openFilterDialog(this.getView());
	}

	//////////////////////////////////////////////////////////
	// Preview Image Popup Handlers
	//////////////////////////////////////////////////////////
	public onHoverImage(oEvent: HoverImage$HoverEvent): void {
		// only for non-touch devices
		const is_touch = this.getOwnerComponent().getModel('device').getProperty('/support/touch')
		if (is_touch)
			return;

		const sAction = (oEvent as any).getParameter('action');
		if (sAction === 'on') {
			this._onHoverOnImage(<Image>(oEvent as any).getSource());
			return;
		} else if (sAction === 'out') {
			this._onHoverAwayFromImage();
			return;
		}
	}

	private _onHoverOnImage(oSource: Control): void {
		const oPlantBindingContext = oSource.getBindingContext('plants')!;
		const oPlant = <PlantRead>oPlantBindingContext.getObject();
		if (!oPlant.preview_image_id)
			return;

		if (!this._oImagePreviewPopoverHandler)
			this._oImagePreviewPopoverHandler = new ImagePreviewPopoverHandler()
		this._oImagePreviewPopoverHandler.openImagePreviewPopover(this.getView(), oSource, oPlantBindingContext );
	}

	private _onHoverAwayFromImage(): void {
		const oPopover = <Popover>this.byId('popoverPopupImage');
		oPopover.close();
	}

	//////////////////////////////////////////////////////////
	// Toggle multi-select mode for plants table
	//////////////////////////////////////////////////////////
	onToggleMultiSelectPlants(oEvent: Button$PressEvent) {
		const oSource = <OverflowToolbarButton>oEvent.getSource();
		const sCurrentType = oSource.getType();  // 'Ghost' or 'Emphasized'
		const oPlantsTable = <Table>this.byId('plantsTable');
		const oStatusModel = <JSONModel>this.getView().getModel('status');  // todo entity type
		
		// set multi-select mode
		if (sCurrentType === 'Ghost') {
			oSource.setType('Emphasized');
			oPlantsTable.setMode('MultiSelect');
			// we need to save current mode to a model to allow access via expression binding
			oStatusModel.setProperty('/master_plants_selectable', true);

		// set default mode
		} else {
			oSource.setType('Ghost');
			oPlantsTable.setMode('None');
			oStatusModel.setProperty('/master_plants_selectable', false);
		}
	}
	onAddTagToSelectedPlants(oEvent: Button$PressEvent) {
		//open Popover to add tag to 1..n selected plants
		const oSource = <OverflowToolbarButton>oEvent.getSource();
		const oPlantsTable = <Table>this.byId('plantsTable');
		const aSelectedItems = oPlantsTable.getSelectedItems();
		const aSelectedPlants = <PlantRead[]> aSelectedItems.map(item => item.getBindingContext('plants')!.getObject())
		if (aSelectedItems.length == 0) {
			MessageToast.show("Nothing selected.");
			return;
		}

		if (!this._oNewPlantTagPopoverHandler){
			const oPlantsModel = this.oComponent.getModel('plants');;
			this._oNewPlantTagPopoverHandler = new NewPlantTagPopoverHandler(oPlantsModel);
		}

		this._oNewPlantTagPopoverHandler.openNewPlantTagPopover(aSelectedPlants, oSource, this.getView(), false);
	}
	onVisitPreviousPlant(oEvent: Button$PressEvent) {
		const oPlantsTable = <Table>this.byId('plantsTable');
		const oBinding = <ListBinding>oPlantsTable.getBinding('items');
		const aPlantsDisplayed = <PlantRead[]> oBinding.getContexts().map(ctx => ctx.getObject());

		// Get current plant ID from URL
		const oRouter = (this.getOwnerComponent() as UIComponent).getRouter();
		const oCurrentRoute = oRouter.getHashChanger().getHash();
		const aMatches = oCurrentRoute.match(/detail\/(\d+)/);
		const iCurrentPlantId = aMatches ? parseInt(aMatches[1]) : null;
		
		// Find current plant in displayed plants
		const iCurrentIndex = aPlantsDisplayed.findIndex(plant => plant.id === iCurrentPlantId);
		
		// Navigate to previous plant if possible
		if (iCurrentIndex > 0) {
			const oPreviousPlant = aPlantsDisplayed[iCurrentIndex - 1];
			this.navigation.navToPlantDetails(oPreviousPlant.id!);
		} else {
			MessageToast.show("Already at first plant.");
		}
	}

	onVisitNextPlant(oEvent: Button$PressEvent) {
		const oPlantsTable = <Table>this.byId('plantsTable');
		const oBinding = <ListBinding>oPlantsTable.getBinding('items');
		const aPlantsDisplayed = <PlantRead[]> oBinding.getContexts().map(ctx => ctx.getObject());

		// Get current plant ID from URL
		const oRouter = (this.getOwnerComponent() as UIComponent).getRouter();
		const oCurrentRoute = oRouter.getHashChanger().getHash();
		const aMatches = oCurrentRoute.match(/detail\/(\d+)/);
		const iCurrentPlantId = aMatches ? parseInt(aMatches[1]) : null;	

		// Find current plant in displayed plants
		const iCurrentIndex = aPlantsDisplayed.findIndex(plant => plant.id === iCurrentPlantId);
		
		// Navigate to next plant if possible
		if (iCurrentIndex >= 0 && iCurrentIndex < aPlantsDisplayed.length - 1) {
			const oNextPlant = aPlantsDisplayed[iCurrentIndex + 1];
			this.navigation.navToPlantDetails(oNextPlant.id!);
		} else {
			MessageToast.show("Already at last plant.");
		}	
	}
}