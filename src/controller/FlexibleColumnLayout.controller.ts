import BaseController from "plants/ui/controller/BaseController"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import MessageUtil from "plants/ui/customClasses/MessageUtil"
import formatter from "plants/ui/model/formatter"
import MessageToast from "sap/m/MessageToast"
import MessageBox, { Action } from "sap/m/MessageBox"
import * as Util from "plants/ui/customClasses/Util";
import Token from "sap/m/Token"
import Filter from "sap/ui/model/Filter"
import FilterOperator from "sap/ui/model/FilterOperator"
import Navigation from "plants/ui/customClasses/Navigation"
import { IdToFragmentMap } from "../definitions/SharedLocal"
import Router from "sap/ui/core/routing/Router"
import SearchManager from "sap/f/SearchManager"
import ListBinding from "sap/ui/model/ListBinding"
import Event from "sap/ui/base/Event"
import MultiInput from "sap/m/MultiInput"
import FileUploader from "sap/ui/unified/FileUploader"
import { FImageUploadedMetadata } from "../definitions/Images"
import Dialog from "sap/m/Dialog"
import Menu from "sap/m/Menu"
import { MessageType } from "sap/ui/core/library"
import Popover from "sap/m/Popover"
import ImageEventHandlers from "../customClasses/ImageEventHandlers"
import { UIState } from "sap/f/FlexibleColumnLayoutSemanticHelper"

/**
 * @namespace plants.ui.controller
 */
export default class FlexibleColumnLayout extends BaseController {

	formatter = new formatter();
	private imageEventHandlers: ImageEventHandlers;

	private mIdToFragment = <IdToFragmentMap>{
		MessagePopover: "plants.ui.view.fragments.menu.MessagePopover",
		dialogUploadPhotos: "plants.ui.view.fragments.menu.UploadPhotos",
		menuShellBarMenu: "plants.ui.view.fragments.menu.ShellBarMenu",
	}

	private _currentPlantId: int;
	private _oRouter: Router
	private _currentRouteName: string;

	onInit() {
		super.onInit();
		this._oRouter = this.oComponent.getRouter();
		this._oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
		this._oRouter.attachRouteMatched(this._onRouteMatched, this);

		this.imageEventHandlers = new ImageEventHandlers(this.applyToFragment.bind(this));
	}

	private _onBeforeRouteMatched(oEvent: Event) {
		// called each time any route is triggered, i.e. each time one of the views change
		// updates the layout model: inserts the new layout into it
		var oLayoutModel = this.oComponent.getModel();
		var sLayout = oEvent.getParameter('arguments').layout; // e.g. "TwoColumnsMidExpanded"

		// If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
		if (!sLayout) {
			var oNextUIState = this.oComponent.getHelper().getNextUIState(0);
			sLayout = oNextUIState.layout;
		}

		// Update the layout of the FlexibleColumnLayout
		if (sLayout) {
			oLayoutModel.setProperty("/layout", sLayout);
		}
	}

	private _onRouteMatched(oEvent: Event) {
		var sRouteName = oEvent.getParameter("name"),
			oArguments = oEvent.getParameter("arguments");

		this._updateUIElements();

		// Save the current route name
		this._currentRouteName = sRouteName;  // e.g. "detail"
		// this.currentPlant = oArguments.product;
		this._currentPlantId = oArguments.plant_id;
	}

	protected applyToFragment(sId: string, fn: Function, fnInit?: Function) {
		// to enable vs code to connect fragments with a controller, we may not mention
		// the Dialog/Popover ID in the base controller; therefore we have these names
		// hardcoded in each controller 
		super.applyToFragment(sId, fn, fnInit, this.mIdToFragment);
	}

	public onStateChanged(oEvent: Event) {
		this._updateUIElements();
		
		// Replace the URL with the new layout if a navigation arrow was used
		const bIsNavigationArrow = oEvent.getParameter("isNavigationArrow");
		if (bIsNavigationArrow) {
			const sLayout = oEvent.getParameter("layout");  // e.g. "OneColumn"
			this._oRouter.navTo(this._currentRouteName, { 
				layout: sLayout, 
				plant_id: this._currentPlantId 
			// }, true);
			});
		}
	}

	private _updateUIElements() {
		// Update the close/fullscreen buttons visibility
		var oUIState: UIState = this.oComponent.getHelper().getCurrentUIState();

		// somehow with the migration to TS, starting the page with a TwoColumnLayout as URL does
		// not work. Therefore, we need an ugly hack here. Todo: Make it better.
		if (window.location.hash.includes('TwoColumnsMidExpanded')){
			oUIState.layout = "TwoColumnsMidExpanded"
			oUIState.columnsVisibility!.midColumn = true
		} else if (window.location.hash.includes('ThreeColumnsMidExpanded')){
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

	public onShellBarMenuButtonPressed(oEvent: Event) {
		var oSource = oEvent.getSource();
		this.applyToFragment('menuShellBarMenu', (oMenu: Menu)=>{
			oMenu.openBy(oSource, true);
		})
	}

	generateMissingThumbnails() {
		$.ajax({
			url: Util.getServiceUrl('generate_missing_thumbnails'),
			type: 'POST',
			contentType: "application/json",
			context: this
		})
			.done(this.onReceiveSuccessGeneric)
			.fail(ModelsHelper.getInstance(undefined).onReceiveErrorGeneric.bind(this, 'Generate Missing Thumbnails (POST)'));
	}

	onPressButtonSave() {
		this.savePlantsAndImages();  // implemented in BaseController
	}

	onPressButtonRefreshData() {
		//refresh data from backend

		// check if there are any unsaved changes
		var aModifiedPlants = this.getModifiedPlants();
		var aModifiedImages = this.getModifiedImages();
		var aModifiedTaxa = this.getModifiedTaxa();

		// if modified data exists, ask for confirmation if all changes should be undone
		if ((aModifiedPlants.length !== 0) || (aModifiedImages.length !== 0) || (aModifiedTaxa.length !== 0)) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.confirm(
				"Revert all changes?", {
				onClose: this._onCloseRefreshConfirmationMessageBox.bind(this),
				styleClass: bCompact ? "sapUiSizeCompact" : ""
			}
			);
		} else {
			//no modified data, therefore call handler directly with 'OK'
			this._onCloseRefreshConfirmationMessageBox(Action.OK);
		}
	}

	private _onCloseRefreshConfirmationMessageBox(eAction: Action) {
		//callback for onPressButtonUndo's confirmation dialog
		//revert all changes and return to data since last save or loading of site
		if (eAction === Action.OK) {
			Util.startBusyDialog('Loading...', 'Loading plants, taxa, and images');

			var oModelsHelper = ModelsHelper.getInstance();
			oModelsHelper.reloadPlantsFromBackend();
			// oModelsHelper.reloadImagesFromBackend();
			oModelsHelper.resetImagesRegistry();

			// todo: reload current plant's images
			// oModelsHelper.reloadTaxaFromBackend();
			
			// reset the taxa registry including it's clone and trigger reload of current plant's taxon details
			oModelsHelper.resetTaxaRegistry();
		}
	}

	onOpenFragmentUploadPhotos(oEvent: Event) {
		this.applyToFragment('dialogUploadPhotos',
			(oDialog: Dialog) => oDialog.open(),
			(oDialog: Dialog) => {
				// executed only once
				var oMultiInputKeywords = <MultiInput>this.byId('multiInputUploadImageKeywords');
				oMultiInputKeywords.addValidator(this._keywordValidator);
				// oMultiInputKeywords.addValidator(function (args) {
				// 	var text = args.text;
				// 	return new Token({ key: text, text: text });
				// });
			});
	}

	private _keywordValidator(args: any){
		// validator function for Keywords MultiInput
		var text = args.text;
		return new Token({ key: text, text: text });
	}

	uploadPhotosToServer(oEvent: Event) {
		//triggered by upload-button in fragment after selecting files
		var oFileUploader = <FileUploader>this.byId("idPhotoUpload");
		if (!oFileUploader.getValue()) {
			MessageToast.show("Choose a file first");
			return;
		}
		Util.startBusyDialog('Uploading...', 'Image File(s)');
		var sUrl = Util.getServiceUrl('images/');
		oFileUploader.setUploadUrl(sUrl);

		// the images may be tagged with plants already upon uploading
		var aSelectedTokens = (<MultiInput>this.byId('multiInputUploadImagePlants')).getTokens();
		var aSelectedPlantIds = <int[]>[];
		if (aSelectedTokens.length > 0) {
			for (var i = 0; i < aSelectedTokens.length; i++) {
				aSelectedPlantIds.push(aSelectedTokens[i].getProperty('key'));
			}
		} 

		// same applies to tagging with keywords
		var aSelectedKeywordTokens = (<MultiInput>this.byId('multiInputUploadImageKeywords')).getTokens();
		var aSelectedKeywords = <string[]>[];
		if (aSelectedKeywordTokens.length > 0) {
			for (i = 0; i < aSelectedKeywordTokens.length; i++) {
				aSelectedKeywords.push(aSelectedKeywordTokens[i].getProperty('key'));
			}
		} else {
			// oFileUploader.setAdditionalData(); //from earlier uploads
		}

		var oAdditionalData = <FImageUploadedMetadata>{
			'plants': aSelectedPlantIds,
			'keywords': aSelectedKeywords
		};
		// set even if empty (may be filled from earlier run)
		//the file uploader control can only send strings
		oFileUploader.setAdditionalData(JSON.stringify(oAdditionalData));
		oFileUploader.upload();
	}

	handleUploadComplete(oEvent: Event) {
		// handle message, show error if required
		var sResponse = oEvent.getParameter('responseRaw');
		if (!sResponse) {
			var sMsg = "Upload complete, but can't determine status. No response received.";
			MessageUtil.getInstance().addMessage(MessageType.Warning, sMsg, undefined, undefined);
			Util.stopBusyDialog();
			return;
		}
		var oResponse = JSON.parse(sResponse);
		if (!oResponse) {
			sMsg = "Upload complete, but can't determine status. Can't parse Response.";
			MessageUtil.getInstance().addMessage(MessageType.Warning, sMsg, undefined, undefined);
			Util.stopBusyDialog();
			return;
		}

		MessageUtil.getInstance().addMessageFromBackend(oResponse.message);
		// add to images registry and refresh current plant's images
		if (oResponse.images.length > 0) {
			ModelsHelper.getInstance().addToImagesRegistry(oResponse.images);

			// plant's images model and untagged images model might need to be refreshed
			this.resetImagesCurrentPlant(this._currentPlantId);
			this.oComponent.getModel('images').updateBindings(false);

			// this.resetUntaggedPhotos();
			this.oComponent.resetUntaggedPhotos();
			this.oComponent.getModel('untaggedImages').updateBindings(false);
		}

		Util.stopBusyDialog();
		MessageToast.show(oResponse.message.message);
		this.applyToFragment('dialogUploadPhotos', (oDialog: Dialog) => oDialog.close());
	}

	onIconPressAssignDetailsPlant(oEvent: Event) {
		// triggered by assign-to-current-plant button in image upload dialog
		// add current plant to plants multicombobox
		var plant = this.getPlantById(this._currentPlantId);
		if (!plant) {
			return;
		}

		// add to multicombobox if not a duplicate
		var oControl = <MultiInput>this.byId('multiInputUploadImagePlants');
		if (!oControl.getTokens().find(ele => ele.getProperty('key') == plant.plant_name)) {
			var oPlantToken = new Token({
					key: (<int>plant.id).toString(),
					text: plant.plant_name
				});
			oControl.addToken(oPlantToken);
		}
	}

	onShowUntagged(oEvent: Event) {
		//we need the currently selected plant as untagged requires a middle column
		//(button triggering this is only visible if middle column is visible)
		//ex. detail/146/TwoColumnsMidExpanded" --> 146
		//ex. detail/160 --> 160
		// var sCurrentHash = this.oComponent.getRouter().oHashChanger.getHash();
		// var aHashItems = sCurrentHash.split('/');
		// if(!([2,3].includes(aHashItems.length)) || aHashItems[0] !== 'detail' ){
		// 	MessageToast.show('Technical issue with browser hash. Refresh website.');
		// 	return;
		// }
		// var iPlantIndex = aHashItems[1];

		var oNextUIState = this.oComponent.getHelper().getNextUIState(2);
		// this._oRouter.navTo("untagged", {layout: oNextUIState.layout, 
		// 								product: iPlantIndex});

		this._oRouter.navTo("untagged", {
			layout: oNextUIState.layout,
			plant_id: this._currentPlantId
		});
	}

	onShellBarSearch(oEvent: Event) {
		// navigate to selected plant
		var plantId = oEvent.getParameter('suggestionItem').getBindingContext('plants').getObject().id;
		Navigation.getInstance().navToPlantDetails(plantId);
	}

	onShellBarSuggest(oEvent: Event) {
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

	onShellBarNotificationsPressed(oEvent: Event) {
		// open messages popover fragment, called by shellbar button in footer
		var oSource = oEvent.getSource();
		this.applyToFragment('MessagePopover', (oPopover: Popover) => {
			oPopover.isOpen() ? oPopover.close() : oPopover.openBy(oSource, true);
		});
	}

	onClearMessages(oEvent: Event) {
		//clear messages in message popover fragment
		MessageUtil.getInstance().removeAllMessages();
	}

	onHomeIconPressed(oEvent: Event) {
		// go to home site, i.e. master view in single column layout
		var oHelper = this.oComponent.getHelper();
		//@ts-ignore
		var sNextLayoutType = oHelper.getDefaultLayouts().defaultLayoutType;
		this._oRouter.navTo("master", { layout: sNextLayoutType });
	}

	onHandleTypeMissmatch(oEvent: Event) {
		// handle file type missmatch for image upload
		// note: there's a same-nemed method in detail controller handling uploads there
		const oFileUpload = <FileUploader>oEvent.getSource();
		const sFiletype = oEvent.getParameter("fileType")
		this.imageEventHandlers.handleTypeMissmatch(oFileUpload, sFiletype);
	}

}