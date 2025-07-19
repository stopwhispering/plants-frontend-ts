import BaseController from "plants/ui/controller/BaseController"
import formatter from "plants/ui/model/formatter"
import MessageBox from "sap/m/MessageBox"
import Util from "plants/ui/customClasses/shared/Util";
import Filter from "sap/ui/model/Filter"
import FilterOperator from "sap/ui/model/FilterOperator"
import Navigation from "plants/ui/customClasses/singleton/Navigation"
import Router, { Router$BeforeRouteMatchedEvent, Router$RouteMatchedEvent } from "sap/ui/core/routing/Router"
import SearchManager, { SearchManager$SearchEvent, SearchManager$SuggestEvent } from "sap/f/SearchManager"
import ListBinding from "sap/ui/model/ListBinding"
import { UIState } from "sap/f/FlexibleColumnLayoutSemanticHelper"
import PlantLookup from "plants/ui/customClasses/plants/PlantLookup"
import ChangeTracker from "../customClasses/singleton/ChangeTracker"
import Saver from "../customClasses/singleton/Saver"
import TaxonRegistryHandler from "../customClasses/taxonomy/TaxonRegistryHandler"
import PlantsLoader from "../customClasses/singleton/PlantsLoader"
import ImageResetter from "../customClasses/images/ImageResetter"
import UploadImagesDialogHandler from "../customClasses/images/UploadImagesDialogHandler"
import ShellBarMenuHandler from "../customClasses/shared/ShellBarMenuHandler"
import Control from "sap/ui/core/Control"
import MessagePopoverHandler from "../customClasses/shared/MessagePopoverHandler"
import UntaggedImagesHandler from "../customClasses/images/UntaggedImagesHandler";
import { LBeforeRouteMatchedArguments, LRouteMatchedArguments } from "../definitions/entities";
import { FlexibleColumnLayout$StateChangeEvent } from "sap/f/FlexibleColumnLayout";
import { ShellBar$HomeIconPressedEvent, ShellBar$MenuButtonPressedEvent, ShellBar$NotificationsPressedEvent } from "sap/f/ShellBar";
import { Button$PressEvent } from "sap/m/Button";

/**
 * @namespace plants.ui.controller
 */
export default class FlexibleColumnLayout extends BaseController {

	formatter = new formatter();
	private oPlantLookup: PlantLookup;

	private _currentPlantId: int;
	private _oRouter: Router
	private _currentRouteName: string;

	private _oShellBarMenuHandler: ShellBarMenuHandler;  // lazy loaded
	private _oMessagePopoverHandler: MessagePopoverHandler;  // lazy loaded
	private _oUploadImagesDialogHandler: UploadImagesDialogHandler;  // lazy loaded

	onInit() {
		super.onInit();

		this.oPlantLookup = new PlantLookup(this.oComponent.getModel('plants'));

		this._oRouter = this.oComponent.getRouter();
		this._oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
		this._oRouter.attachRouteMatched(this._onRouteMatched, this);
	}

	private _onBeforeRouteMatched(oEvent: Router$BeforeRouteMatchedEvent) {
		// called each time any route is triggered, i.e. each time one of the views change
		// updates the layout model: inserts the new layout into it
		var oLayoutModel = this.oComponent.getModel();
		var sLayout = (<LBeforeRouteMatchedArguments>oEvent.getParameter('arguments')).layout; // e.g. "TwoColumnsMidExpanded"

		// If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
		if (!sLayout) {
			// var oNextUIState = this.oComponent.getHelper().getNextUIState(0);
			var oNextUIState = Navigation.getInstance().getFCLHelper().getNextUIState(0);
			sLayout = oNextUIState.layout;
		}

		// Update the layout of the FlexibleColumnLayout
		if (sLayout) {
			oLayoutModel.setProperty("/layout", sLayout);
		}
	}

	private _onRouteMatched(oEvent: Router$RouteMatchedEvent) {
		const sRouteName = oEvent.getParameter("name")
		const oArguments = <LRouteMatchedArguments>oEvent.getParameter("arguments");

		this._updateUIElements();

		// Save the current route name
		this._currentRouteName = sRouteName;  // e.g. "detail"
		// this.currentPlant = oArguments.product;
		this._currentPlantId = parseInt(oArguments.plant_id);
	}

	//////////////////////////////////////////////////////////
	// GUI Handlers
	//////////////////////////////////////////////////////////	
	public onStateChanged(oEvent: FlexibleColumnLayout$StateChangeEvent) {
		this._updateUIElements();

		// Replace the URL with the new layout if a navigation arrow was used
		const bIsNavigationArrow = oEvent.getParameter("isNavigationArrow");
		if (bIsNavigationArrow) {
			const sLayout = oEvent.getParameter("layout");  // e.g. "OneColumn"
			this._oRouter.navTo(this._currentRouteName, {
				layout: sLayout,
				plant_id: this._currentPlantId.toString()
				// }, true);
			});
		}
	}

	private _updateUIElements() {
		// Update the close/fullscreen buttons visibility
		var oUIState: UIState = Navigation.getInstance().getFCLHelper().getCurrentUIState();

		// somehow with the migration to TS, starting the page with a TwoColumnLayout as URL does
		// not work. Therefore, we need an ugly hack here. Todo: Make it better.
		if (window.location.hash.includes('TwoColumnsMidExpanded')) {
			oUIState.layout = "TwoColumnsMidExpanded"
			oUIState.columnsVisibility!.midColumn = true
		} else if (window.location.hash.includes('ThreeColumnsMidExpanded')) {
			oUIState.layout = "ThreeColumnsMidExpanded"
			oUIState.columnsVisibility!.midColumn = true
			oUIState.columnsVisibility!.endColumn = true
		}

		var oModel = this.oComponent.getModel();
		if (oModel)
			oModel.setData(oUIState);
	}

	public onExit() {
		this._oRouter.detachRouteMatched(this._onRouteMatched, this);
		this._oRouter.detachBeforeRouteMatched(this._onBeforeRouteMatched, this);
	}

	//////////////////////////////////////////////////////////
	// Shellbar Handlers
	//////////////////////////////////////////////////////////	
	public onShellBarMenuButtonPressed(oEvent: ShellBar$MenuButtonPressedEvent) {
		var oSource = <Control>oEvent.getSource();

		if (!this._oShellBarMenuHandler) {
			this._oShellBarMenuHandler = new ShellBarMenuHandler();
		}
		this._oShellBarMenuHandler.openShellBarMenu(this.getView(), oSource)
	}

	onPressButtonSave() {
		Saver.getInstance().saveMajorResources();
	}

	public onPressButtonRefreshData() {
		//refresh data from backend

		// check if there are any unsaved changes
		const oChangeTracker = ChangeTracker.getInstance();
		// const aModifiedPlants: PlantRead[] = oChangeTracker.getModifiedPlants();
		// const aModifiedImages: ImageRead[] = oChangeTracker.getModifiedImages();
		// const aModifiedTaxa: BTaxon[] = oChangeTracker.getModifiedTaxa();

		// // if modified data exists, ask for confirmation if all changes should be undone
		// if ((aModifiedPlants.length !== 0) || (aModifiedImages.length !== 0) || (aModifiedTaxa.length !== 0)) {
		if (oChangeTracker.hasUnsavedChanges()) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.confirm(
				"Revert all changes?", {
				onClose: this._cbRefreshConfirmed.bind(this),
				styleClass: bCompact ? "sapUiSizeCompact" : ""
			}
			);
		} else {
			//no modified data, therefore call handler directly with 'OK'
			this._cbRefreshConfirmed(MessageBox.Action.OK);
		}
	}

	private _cbRefreshConfirmed(eAction: string) {
		//callback for onPressButtonUndo's confirmation dialog
		//revert all changes and return to data since last save or loading of site
		if (eAction === MessageBox.Action.OK) {
			Util.startBusyDialog('Loading...', 'Loading plants, taxa, and images');

			// const oPlantsLoader = new PlantsLoader(this.oComponent.getModel('plants'));
			PlantsLoader.getInstance().loadPlants();

			const oUntaggedImagesModel = this.oComponent.getModel('untaggedImages');
			new UntaggedImagesHandler(oUntaggedImagesModel).requestUntaggedImages();

			new ImageResetter(this.oComponent.getModel('images'), oUntaggedImagesModel).resetImages();

			// reset the taxa registry including it's clone and trigger reload of current plant's taxon details
			new TaxonRegistryHandler(this.oComponent.getModel('plants'), this.oComponent.getModel('taxon')).resetTaxonRegistry();
		}
	}

	onShowUntagged(oEvent: Button$PressEvent) {
		//we need the currently selected plant as untagged requires a middle column
		//(button triggering this is only visible if middle column is visible)
		//ex. detail/146/TwoColumnsMidExpanded" --> 146
		//ex. detail/160 --> 160

		var oNextUIState = Navigation.getInstance().getFCLHelper().getNextUIState(2);
		this._oRouter.navTo("untagged", {
			layout: oNextUIState.layout,
			plant_id: this._currentPlantId
		});
	}

	onShellBarSearch(oEvent: SearchManager$SearchEvent) {
		// navigate to selected plant
		//@ts-ignore
		var plantId = oEvent.getParameter('suggestionItem').getBindingContext('plants').getObject().id;
		Navigation.getInstance().navToPlantDetails(plantId);
	}

	onShellBarSuggest(oEvent: SearchManager$SuggestEvent) {
		var sValue = oEvent.getParameter("suggestValue"),
			aFilters = [];

		// we always filter on only active plants for search field
		var oFilter = new Filter("active", FilterOperator.EQ, true);

		// create or-connected filter for multiple fields based on query value
		if (sValue) {
			aFilters = [
				new Filter([
					new Filter("plant_name", function (sText) {
						return (sText || "").toUpperCase().indexOf(sValue.toUpperCase()) > -1;
					}),
					new Filter("botanical_name", function (sText) {
						return (sText || "").toUpperCase().indexOf(sValue.toUpperCase()) > -1;
					}),
					new Filter("id", FilterOperator.EQ, sValue)
				])
			];

			var oOrFilter = new Filter({
				filters: aFilters,
				and: false
			});
			// connect via <<and>>
			oFilter = new Filter({
				filters: [oFilter, oOrFilter],
				and: true
			});
		}
		const oSearchField = <SearchManager>this.byId("searchField");
		const oSuggestionItemsBinding = <ListBinding>oSearchField.getBinding("suggestionItems");
		oSuggestionItemsBinding.filter(oFilter);
		//@ts-ignore  somehow missing in definitions
		oSearchField.suggest();
	}

	onShellBarNotificationsPressed(oEvent: ShellBar$NotificationsPressedEvent) {
		// open messages popover fragment, called by shellbar button in footer
		const oSource = <Control>oEvent.getSource();

		if (!this._oMessagePopoverHandler)
			this._oMessagePopoverHandler = new MessagePopoverHandler();
		this._oMessagePopoverHandler.toggleMessagePopover(this.getView(), oSource);
	}

	onHomeIconPressed(oEvent: ShellBar$HomeIconPressedEvent) {
		// go to home site, i.e. master view in single column layout
		// var oHelper = this.oComponent.getHelper();
		var oHelper = Navigation.getInstance().getFCLHelper();
		//@ts-ignore
		var sNextLayoutType = oHelper.getDefaultLayouts().defaultLayoutType;
		this._oRouter.navTo("master", { layout: sNextLayoutType });
	}

	//////////////////////////////////////////////////////////
	// Upload Image Handler
	//////////////////////////////////////////////////////////	
	onOpenFragmentUploadPhotos(oEvent: Button$PressEvent) {

		const oImagesModel = this.oComponent.getModel('images');
		const oUntaggedImagesModel = this.oComponent.getModel('untaggedImages');
		const oStatusModel = this.oComponent.getModel('status');

		if (!this._oUploadImagesDialogHandler) {
			this._oUploadImagesDialogHandler = new UploadImagesDialogHandler(oImagesModel, oUntaggedImagesModel, oStatusModel,
				this.oPlantLookup);
		}
		this._oUploadImagesDialogHandler.openUploadImagesDialog(this.getView(), this._currentPlantId);
	}

}