import BaseController from "plants/ui/controller/BaseController"
import JSONModel from "sap/ui/model/json/JSONModel"
import Filter from "sap/ui/model/Filter"
import formatter from "plants/ui/model/formatter"
import MessageToast from "sap/m/MessageToast"
import Util from "plants/ui/customClasses/shared/Util";
import Navigation from "plants/ui/customClasses/singleton/Navigation"
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler"
import EventCRUD from "plants/ui/customClasses/events/EventCRUD"
import Sorter from "sap/ui/model/Sorter"
import FilterOperator from "sap/ui/model/FilterOperator"
import ImageToTaxonAssigner from "plants/ui/customClasses/images/ImageToTaxonAssigner"
import ImageToEventAssigner from "plants/ui/customClasses/images/ImageToEventAssigner"
import { FBEvent } from "plants/ui/definitions/Events"
import Event from "sap/ui/base/Event"
import Control from "sap/ui/core/Control"
import Input from "sap/m/Input"
import Icon from "sap/ui/core/Icon"
import ListBinding from "sap/ui/model/ListBinding"
import MenuItem from "sap/m/MenuItem"
import OverflowToolbarButton from "sap/m/OverflowToolbarButton"
import ObjectStatus from "sap/m/ObjectStatus"
import { MessageType } from "sap/ui/core/library"
import FileUploader from "sap/ui/unified/FileUploader"
import Button from "sap/m/Button"
import Context from "sap/ui/model/Context"
import { FBImage, FBImagePlantTag } from "plants/ui/definitions/Images"
import Token from "sap/m/Token"
import { FBAssociatedPlantExtractForPlant, BPlant } from "plants/ui/definitions/Plants"
import { LCurrentPlant } from "plants/ui/definitions/PlantsLocal"
import Tokenizer from "sap/m/Tokenizer"
import PlantLookup from "plants/ui/customClasses/plants/PlantLookup"
import SuggestionService from "plants/ui/customClasses/shared/SuggestionService"
import PlantRenamer from "plants/ui/customClasses/plants/PlantRenamer"
import PlantDeleter from "plants/ui/customClasses/plants/PlantDeleter"
import ImageRegistryHandler from "plants/ui/customClasses/singleton/ImageRegistryHandler"
import PlantDetailsBootstrap from "plants/ui/customClasses/plants/PlantDetailsBootstrap"
import PlantImagesLoader from "plants/ui/customClasses/plants/PlantImagesLoader"
import ImageDeleter from "plants/ui/customClasses/images/ImageDeleter"
import MessageBox from "sap/m/MessageBox"
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker"
import { BTaxon } from "plants/ui/definitions/Taxon"
import ImageKeywordTagger from "plants/ui/customClasses/images/ImageKeywordTagger"
import ImagePlantTagger from "plants/ui/customClasses/images/ImagePlantTagger"
import EventListItemFactory from "plants/ui/customClasses/events/EventListItemFactory"
import AssignPropertyNamePopoverHandler from "plants/ui/customClasses/properties/AssignPropertyNamePopoverHandler"
import NewPropertyNamePopoverHandler from "plants/ui/customClasses/properties/NewPropertyNamePopoverHandler"
import PropertyNameCRUD from "plants/ui/customClasses/properties/PropertyNameCRUD"
import PropertyValueCRUD from "plants/ui/customClasses/properties/PropertyValueCRUD"
import ModelsHelper from "../model/ModelsHelper"
import OccurrenceImagesFetcher from "../customClasses/taxonomy/OccurrenceImagesFetcher"
import EventDialogHandler from "../customClasses/events/EventDialogHandler"
import EventsListHandler from "../customClasses/events/EventsListHandler"
import PropertyValuePopoverHandler from "../customClasses/properties/PropertyValuePopoverHandler"
import AssignImageToEventDialogHandler from "../view/fragments/events/AssignImageToEventDialogHandler"
import RenamePlantDialogHandler from "../customClasses/plants/RenamePlantDialogHandler"
import NewDescendantPlantDialogHandler from "../customClasses/plants/NewDescendantPlantDialogHandler"
import ClonePlantDialogHandler from "../customClasses/plants/ClonePlantDialogHandler"
import CancelPlantPopverHandler from "../customClasses/plants/CancelPlantPopverHandler"
import SearchSpeciesDialogHandler from "../customClasses/taxonomy/SearchSpeciesDialogHandler"
import NewPlantTagPopoverHandler from "../customClasses/plants/NewPlantTagPopoverHandler"
import DeletePlantTagMenuHandler from "../customClasses/plants/DeletePlantTagMenuHandler"
import LeafletMapHandler from "../customClasses/taxonomy/LeafletMapHandler"

/**
 * @namespace plants.ui.controller
 */
export default class Detail extends BaseController {
	// container for xml view control event handlers
	public formatter = new formatter();
	private eventCRUD: EventCRUD;
	private oEventDialogHandler: EventDialogHandler;
	private oPlantLookup: PlantLookup;
	public suggestionService: SuggestionService; // public because used in formatter
	private mCurrentPlant: LCurrentPlant;  // container currentPlantId, currentPlantIndex, currentPlant
	private oLayoutModel: JSONModel;
	private oEventsListHandler: EventsListHandler;

	private _oAssignImageToEventDialogHandler: AssignImageToEventDialogHandler;  // lazy loaded
	private _oPlantImagesLoader: PlantImagesLoader;  // lazy loaded
	private _oPlantRenamer: PlantRenamer;  // lazy loaded
	private _oSearchSpeciesDialogHandler: SearchSpeciesDialogHandler;  // lazy loaded
	private _oLeafletMapHandler: LeafletMapHandler;  // lazy loaded

	onInit() {
		super.onInit();

		const oSuggestionsModel = <JSONModel>this.oComponent.getModel('suggestions');
		SuggestionService.createInstance(oSuggestionsModel);
		this.suggestionService = SuggestionService.getInstance();

		this.mCurrentPlant = <LCurrentPlant>{
			plant_id: undefined,
			plant_index: undefined,
			plant: undefined,
		}

		this.oPlantLookup = new PlantLookup(this.oComponent.getModel('plants'));

		this.eventCRUD = new EventCRUD(this.oComponent.getModel('events'));

		this.oLayoutModel = this.oComponent.getModel();

		this.oEventDialogHandler = new EventDialogHandler(this.eventCRUD, 
			this.getView(), oSuggestionsModel.getData());

		const oEventsModel = <JSONModel>this.oComponent.getModel('events');
		this.oEventsListHandler = new EventsListHandler(this.eventCRUD);

		// default: view mode for plants information
		this.oComponent.getModel('status').setProperty('/details_editable', false);

		this.oRouter.getRoute("detail").attachPatternMatched(this._onPatternMatched, this);
		this.oRouter.getRoute("untagged").attachPatternMatched(this._onPatternMatched, this);

		// bind factory function to events list aggregation binding
		var oEventsList = this.byId("eventsList");

		// we want to pass the view to the factory function without changing this-context, 
		// so instead of using .bind(...) we curry the factory function
		const fnCurryFactory = (sId: string, oBindingContext: Context) => EventListItemFactory(this.getView(), sId, oBindingContext);
		oEventsList.bindAggregation("items",
			{
				path: "events>",
				templateShareable: false,
				factory: fnCurryFactory,
				sorter: new Sorter('date', true)  // descending by date
			});

		this.oComponent.getModel('status').setProperty('/images_editable', false);
	}

	private _onPatternMatched(oEvent: Event) {
		// if accessed directly, we might not have loaded the plants model, yet
		// in that case, we have only the plant_id (from the url's hash), but not the position of that plant
		// in the plants model index. so we must defer binding the plant to the view

		Util.startBusyDialog();

		// bind taxon of current plant and events to view (deferred as we may not know the plant name here, yet)
		this.mCurrentPlant.plant_id = parseInt(oEvent.getParameter("arguments").plant_id || this.mCurrentPlant.plant_id || "0");


		const oPlantDetailsBootstrap = new PlantDetailsBootstrap(
			this.getView(),
			this.oComponent.getModel('plants'),
			this.oComponent.getModel('events'),
			this.oComponent.getModel('images'),
			this.oComponent.getModel('properties'),
			this.oComponent.getModel('propertiesTaxa'),
			this.oComponent.getModel('taxon'),
			this.mCurrentPlant
		);
		oPlantDetailsBootstrap.load(this.mCurrentPlant.plant_id)
	}

	//////////////////////////////////////////////////////////
	// GUI Handlers
	//////////////////////////////////////////////////////////
	onHandleFullScreen() {
		var sNextLayout = this.oLayoutModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
		this.oRouter.navTo("detail", { layout: sNextLayout, plant_id: this.mCurrentPlant.plant.id });
	}

	onHandleExitFullScreen() {
		var sNextLayout = this.oLayoutModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
		this.oRouter.navTo("detail", { layout: sNextLayout, plant_id: this.mCurrentPlant.plant.id });
	}

	onHandleClose() {
		var sNextLayout = this.oLayoutModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
		this.oRouter.navTo("master", { layout: sNextLayout });
	}

	public onToggleEditMode(oEvent: Event) {
		// toggle edit mode for some of the input controls (actually hide the read-only ones and 
		// unhide the others)
		var oSource = <OverflowToolbarButton>oEvent.getSource();
		var sCurrentType = oSource.getType();
		if (sCurrentType === 'Transparent') {
			// set edit mode
			oSource.setType('Emphasized');
			(<JSONModel>this.getView().getModel('status')).setProperty('/details_editable', true);
		} else {
			// set view mode (default)
			oSource.setType('Transparent');
			(<JSONModel>this.getView().getModel('status')).setProperty('/details_editable', false);
		}
	}

	//////////////////////////////////////////////////////////
	// Rename Plant Handler
	//////////////////////////////////////////////////////////
	onPressButtonRenamePlant(oEvent: Event) {
		// triggered by button in details upper menu
		// opens dialog to rename current plant
		if (!this._oPlantRenamer){

			if (!this._oPlantImagesLoader)
				this._oPlantImagesLoader = new PlantImagesLoader(this.oComponent.getModel('images'));

			this._oPlantRenamer = new PlantRenamer(this.oPlantLookup, this._oPlantImagesLoader, 
				this.oComponent.getModel('plants'), this.oComponent.getModel('images'), this.oComponent.getModel('untaggedImages'));
		}
		
		const oRenamePlantDialogHandler = new RenamePlantDialogHandler(this._oPlantRenamer);
		oRenamePlantDialogHandler.openRenamePlantDialog(this.getView(), this.mCurrentPlant.plant);
	}

	//////////////////////////////////////////////////////////
	// Plant Tag Handlers
	//////////////////////////////////////////////////////////
	public onPressTag(oEvent: Event) {
		var oSource = <ObjectStatus>oEvent.getSource();
		var sPathTag = oSource.getBindingContext('plants')!.getPath();
		const oDeletePlantTagMenuHandler = new DeletePlantTagMenuHandler(this.oComponent.getModel('plants'));
		oDeletePlantTagMenuHandler.openDeletePlantTagMenu(this.mCurrentPlant.plant, sPathTag, this.getView(), oSource);
	}

	onOpenAddTagDialog(oEvent: Event) {
		// create add tag dialog
		var oButton = <Control>oEvent.getSource();

		const oPlantsModel = this.oComponent.getModel('plants');
		const oNewPlantTagPopoverHandler = new NewPlantTagPopoverHandler(oPlantsModel);
		oNewPlantTagPopoverHandler.openNewPlantTagPopover(this.mCurrentPlant.plant, oButton, this.getView());
	}


	//////////////////////////////////////////////////////////
	// Plant Details Handlers
	//////////////////////////////////////////////////////////		
	onPressGoToPlant(parentPlantId: int) {
		//navigate to supplied plant
		if (!!parentPlantId) {
			Navigation.getInstance().navToPlantDetails(parentPlantId);
		} else {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.error("Can't determine Plant Index", {
				styleClass: bCompact ? "sapUiSizeCompact" : ""
			});
		}
	}

	onSuggestNursery(oEvent: Event) {
		// overwrite default suggestions (only beginsWith term) with custom one (contains term))
		var aFilters = [];
		var sTerm = oEvent.getParameter("suggestValue");
		if (sTerm) {
			aFilters.push(new Filter("name", FilterOperator.Contains, sTerm));
		}
		var oInput = <Input>oEvent.getSource();
		var oListBinding = <ListBinding>oInput.getBinding("suggestionItems");
		oListBinding.filter(aFilters);
		//do <<not>> filter the provided suggestions with default logic before showing them to the user
		oInput.setFilterSuggests(false);
	}

	onChangeActiveSwitch(oEvent: Event) {
		// open dialog to choose reason for plant deactivation
		var oSwitch = oEvent.getSource();
		if (oEvent.getParameter('state')) {
			return;
		}

		const oCancelPlantPopverHandler = new CancelPlantPopverHandler(this.oComponent.getModel('suggestions'), this.oComponent.getModel('plants'));
		oCancelPlantPopverHandler.openCancelPlantPopover(this.getView(), this.mCurrentPlant.plant);
	}

	onChangeParent(oEvent: Event) {
		// verify entered parent and set parent plant id
		var aPlants = <BPlant[]>this.getView().getModel('plants').getProperty('/PlantsCollection');
		var parentPlant = aPlants.find(plant => plant.plant_name === oEvent.getParameter('newValue').trim());

		if (!oEvent.getParameter('newValue').trim() || !parentPlant) {
			var parentalPlant = undefined;

		} else {
			// set parent plant
			parentalPlant = <FBAssociatedPlantExtractForPlant>{
				id: parentPlant.id,
				plant_name: parentPlant.plant_name,
				active: parentPlant.active
			}
		}

		// fn is fired by changes for parent and parent_ollen
		if ((<Input>oEvent.getSource()).data('parentType') === "parent_pollen") {
			this.mCurrentPlant.plant.parent_plant_pollen = parentalPlant;
		} else {
			this.mCurrentPlant.plant.parent_plant = parentalPlant;
		}
	}

	//////////////////////////////////////////////////////////
	// Delete Plant Handler
	//////////////////////////////////////////////////////////	
	onPressButtonDeletePlant(oEvent: Event) {
		//confirm dialog
		var oMenuItem = <MenuItem>oEvent.getSource();
		var oPlant = <BPlant>oMenuItem.getBindingContext('plants')!.getObject();
		var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

		const oPlantDeleter = new PlantDeleter(this.oComponent.getModel('plants'), this.onHandleClose.bind(this));
		oPlantDeleter.askToDeletePlant(oPlant, bCompact);
	}

	//////////////////////////////////////////////////////////
	// Clone Plant Handlers
	//////////////////////////////////////////////////////////
	onPressButtonClonePlant(oEvent: Event) {
		// triggered by button in details upper menu
		// opens dialog to clone current plant
		const oPlantsModel = this.oComponent.getModel('plants');
		const oClonePlantDialogHandler = new ClonePlantDialogHandler(this.oPlantLookup, oPlantsModel);
		oClonePlantDialogHandler.openClonePlantDialog(this.getView(), this.mCurrentPlant.plant);
	}


	onPressButtonCreateDescendantPlant(oEvent: Event) {
		// triggered by button in details upper menu
		// opens dialog to create descendant plant with current plant as mother plant

		const oNewDescendantPlantDialogHandler = new NewDescendantPlantDialogHandler(this.oPlantLookup, this.oComponent.getModel('plants'));
		oNewDescendantPlantDialogHandler.openNewDescendantPlantDialog(this.getView(), this.mCurrentPlant.plant);

	}

	//////////////////////////////////////////////////////////
	// Search Species Handler
	//////////////////////////////////////////////////////////
	onOpenFindSpeciesDialog() {

		if (!this._oSearchSpeciesDialogHandler){
			this._oSearchSpeciesDialogHandler = new SearchSpeciesDialogHandler(this.oComponent.getModel('plants'), this.oComponent.getModel('taxon'), this.getView());
		}
		const oTaxon = <BTaxon|undefined>this.getView().getBindingContext('taxon')!.getObject(); 
		this._oSearchSpeciesDialogHandler.openSearchSpeciesDialog(this.getView(), 
			this.mCurrentPlant.plant, oTaxon);
	}



	//////////////////////////////////////////////////////////
	// Leaflet Map Handler
	//////////////////////////////////////////////////////////	
	onShowMap(oEvent: Event) {
		if (!this._oLeafletMapHandler)
			this._oLeafletMapHandler = new LeafletMapHandler();
			this._oLeafletMapHandler.openLeafletMapDialog(this.getView());
	}

	//////////////////////////////////////////////////////////
	// Taxonomy Handlers
	//////////////////////////////////////////////////////////	
	onRefetchGbifImages(oEvent: Event) {
		const oTaxon = <BTaxon>(<Control>oEvent.getSource()).getBindingContext('taxon')!.getObject()
		if (!oTaxon.gbif_id)
			throw new Error('No gbif_id found for taxon ' + oTaxon.name);
		new OccurrenceImagesFetcher(this.oComponent.getModel('taxon')).fetchOccurrenceImages(oTaxon.gbif_id, this.mCurrentPlant.plant);
	}

	onIconPressUnassignImageFromTaxon(oEvent: Event) {
		const oSource = <Icon>oEvent.getSource();
		const oTaxonModel = <JSONModel>this.oComponent.getModel('taxon')
		new ImageToTaxonAssigner().unassignImageFromTaxon(oSource, oTaxonModel);
	}

	onIconPressAssignImageToTaxon(oEvent: Event) {
		const oSource = <Icon>oEvent.getSource();
		const oTaxonModel = <JSONModel>this.oComponent.getModel('taxon')
		new ImageToTaxonAssigner().assignImageToTaxon(oSource, oTaxonModel);
	}

	//////////////////////////////////////////////////////////
	// Properties Handlers
	//////////////////////////////////////////////////////////
	onOpenDialogAddProperty(oEvent: Event) {
		const oBtnAddProperty = <Button>oEvent.getSource();		const oPropertyNamesModel = <JSONModel>this.getView().getModel('propertyNames');
		const oPlantPropertiesModel = <JSONModel>this.getView().getModel('properties');
		const oTaxonPropertiesModel = <JSONModel>this.getView().getModel('propertiesTaxa');
		const oPropertyNameCRUD = new PropertyNameCRUD(oPropertyNamesModel, oPlantPropertiesModel, oTaxonPropertiesModel)

		const oAssignPropertyNamePopoverHandler = new AssignPropertyNamePopoverHandler(
			this.mCurrentPlant.plant, oPropertyNameCRUD);
		oAssignPropertyNamePopoverHandler.openPopupAddProperty(this.getView(), oBtnAddProperty);
	}

	onOpenDialogNewProperty(oEvent: Event) {
		var oBtnNewProperty = <Button>oEvent.getSource();
		const oPropertyNamesModel = <JSONModel>this.getView().getModel('propertyNames');
		const oPlantPropertiesModel = <JSONModel>this.getView().getModel('properties');
		const oTaxonPropertiesModel = <JSONModel>this.getView().getModel('propertiesTaxa');
		const oPropertyNameCRUD = new PropertyNameCRUD(oPropertyNamesModel, oPlantPropertiesModel, oTaxonPropertiesModel)
		const oNewPropertyNamePopoverHandler = new NewPropertyNamePopoverHandler(oPropertyNameCRUD, this.mCurrentPlant.plant)
		oNewPropertyNamePopoverHandler.openPopupNewProperty(this.mCurrentPlant.plant, oBtnNewProperty, this.getView());

	}
	onEditPropertyValueTag(oEvent: Event) {
		// open popover to edit or delete property value
		const oPlantPropertiesModel = <JSONModel>this.oComponent.getModel('properties');
		const oTaxonPropertiesModel = <JSONModel>this.oComponent.getModel('propertiesTaxa');
		const oPropertyValueCRUD = new PropertyValueCRUD(oPlantPropertiesModel, oTaxonPropertiesModel);

		var oSource = <ObjectStatus>oEvent.getSource();
		var sPathPropertyValue = oSource.getBindingContext('properties')!.getPath();
		const oPropertyValuePopoverHandler = new PropertyValuePopoverHandler(oPropertyValueCRUD, this.mCurrentPlant.plant);
		oPropertyValuePopoverHandler.openPropertyValuePopover(this.getView(), oSource, sPathPropertyValue)

	}

	//////////////////////////////////////////////////////////
	// Event Handlers
	//////////////////////////////////////////////////////////
	onOpenDialogAddEvent(oEvent: Event) {
		this.oEventDialogHandler.openDialogNewEvent(this.getView(), this.mCurrentPlant.plant);
	}

	onEditEvent(oEvent: Event) {
		// triggered by edit button in a custom list item header in events list
		const oSource = <Button>oEvent.getSource();
		const oSelectedEvent = <FBEvent>oSource.getBindingContext('events')!.getObject();
		this.oEventDialogHandler.openDialogEditEvent(this.getView(), oSelectedEvent)
	}

	onDeleteEventsTableRow(oEvent: Event) {
		const oSelectedEvent = <FBEvent>oEvent.getParameter('listItem').getBindingContext('events').getObject();
		this.oEventsListHandler.deleteRow(oSelectedEvent);
	}

	onIconPressUnassignImageFromEvent(oEvent: Event) {
		const sEventsBindingPath = oEvent.getParameter('listItem').getBindingContextPath('events');
		const oEventsModel = <JSONModel>this.oComponent.getModel('events');
		new ImageToEventAssigner().unassignImageFromEvent(sEventsBindingPath, oEventsModel);
	}

	onIconPressAssignImageToEvent(oEvent: Event) {
		// triggered by icon beside image; assign that image to one of the plant's events
		const oSource = <Icon>oEvent.getSource();
		var sPathCurrentImage = oSource.getBindingContext("images")!.getPath();
		if (!this._oAssignImageToEventDialogHandler){
			const oEventsModel = <JSONModel>this.oComponent.getModel('events');
			this._oAssignImageToEventDialogHandler = new AssignImageToEventDialogHandler(oEventsModel);
		}
		this._oAssignImageToEventDialogHandler.openAssignImageToEventDialog(this.getView(), sPathCurrentImage);

	}

	//////////////////////////////////////////////////////////
	// Image Handlers
	//////////////////////////////////////////////////////////
	onIconPressSetPreview(oEvent: Event) {
		// get selected image and current plant in model
		var oSource = <Icon>oEvent.getSource();
		var sPathCurrentImage = oSource.getBindingContext("images")!.getPath();
		var oCurrentImage = this.oComponent.getModel('images').getProperty(sPathCurrentImage);
		var sPathCurrentPlant = oSource.getBindingContext("plants")!.getPath();
		var oCurrentPlant = <BPlant>this.oComponent.getModel('plants').getProperty(sPathCurrentPlant);

		// temporarily set original image as preview image
		// upon reloading plants model, a specific preview image will be generated 
		var sUrlOriginal = oCurrentImage['filename'];
		var s = JSON.stringify(sUrlOriginal); // model stores backslash unescaped, so we need a workaround
		// var s2 = s.substring(1, s.length - 1);
		// oCurrentPlant['url_preview'] = s2;
		oCurrentPlant['filename_previewimage'] = oCurrentImage['filename'];

		this.oComponent.getModel('plants').updateBindings(false);
	}

	onAddPlantNameToUntaggedImage(oEvent: Event) {
		//adds selected plant in input field (via suggestions) to an image in (details view)
		//note: there's a same-named function in untagged controller doing the same thing for untagged images
		const oSource = <Input>oEvent.getSource();
		const oImage = <FBImage>oSource.getBindingContext("images")!.getObject()
		const oSelectedSuggestion = oEvent.getParameter('selectedRow');
		const oSelectedPlant = <BPlant>oSelectedSuggestion.getBindingContext('plants').getObject();
		const oImagesModel = this.oComponent.getModel('images');
		// this.imageEventHandlers.assignPlantToImage(oSelectedPlant, oImage, oImagesModel);
		new ImagePlantTagger(oImagesModel).addPlantToImage(oSelectedPlant, oImage);
		// this.imageEventHandlers.addPlantNameToImage();
		oImagesModel.updateBindings(true);
		oSource.setValue('');
	}
	onPressImagePlantToken(oEvent: Event) {
		//navigate to chosen plant in plant details view when clicking on plant token in untagged images view
		//note: there's a same-named function in untagged controller doing the same thing for untagged images
		const oSource = <Token>oEvent.getSource();
		const oPlantTag = <FBImagePlantTag>oSource.getBindingContext('images')!.getObject();
		if (!oPlantTag.plant_id || oPlantTag.plant_id <= 0) throw new Error("Unexpected error: No Plant ID");

		if (oPlantTag.plant_id === this.mCurrentPlant.plant.id) return; //already on this plant (no need to navigate)

		//navigate to plant in layout's current column (i.e. middle column)
		Navigation.getInstance().navToPlant(this.oPlantLookup.getPlantById(oPlantTag.plant_id));
	}

	onIconPressDeleteImage(oEvent: Event) {
		//note: there's a same-named function in untagged controller doing the same thing for untagged images
		const oSource = <Icon>oEvent.getSource();
		const oImage = <FBImage>oSource.getBindingContext("images")!.getObject()
		var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

		const oImagesModel = this.oComponent.getModel('images');;
		const oUntaggedImagesModel = this.oComponent.getModel('untaggedImages');
		//todo use imageregistryhandler instaed in imagedeleter
		const oImageDeleter = new ImageDeleter(oImagesModel, oUntaggedImagesModel, ModelsHelper.onGenericSuccessWithMessage);
		oImageDeleter.askToDeleteImage(oImage, bCompact);
	}

	onInputImageNewKeywordSubmit(oEvent: Event) {
		//note: there's a same-named function in untagged controller doing the same thing for untagged images
		const oInput = <Input>oEvent.getSource();
		oInput.setValue('');
		const sKeyword = oEvent.getParameter('value').trim();
		const oImage = <FBImage>oInput.getParent().getBindingContext('images')!.getObject();
		new ImageKeywordTagger(this.oComponent.getModel('images')).addKeywordToImage(sKeyword, oImage);
	}

	onSwitchImageEditDescription(oEvent: Event) {
		// switch "editable" for plant image description fields
		const oModelStatus = <JSONModel>this.getView().getModel('status');
		if (oModelStatus.getProperty('/images_editable')) {
			oModelStatus.setProperty('/images_editable', false);
		} else {
			oModelStatus.setProperty('/images_editable', true);
		}
	}

	onTokenizerKeywordImageTokenDelete(oEvent: Event) {
		// note: the token itself has already been deleted; here, we only delete the 
		// 		 corresponding plant-to-image entry from the model
		// note: there's a same-named function in untagged controller doing the same thing for untagged images

		// we get the token from the event parameters
		const aTokens = <Token[]>oEvent.getParameter('tokens');
		if (aTokens.length > 1) throw new Error("Unexpected error: More than one token to be deleted at once");
		const oToken = <Token>aTokens[0];
		const sKeywordTokenKey = oToken.getKey();

		// the event's source is the tokenizer
		const oTokenizer = <Tokenizer>oEvent.getSource();
		const oImage = <FBImage>oTokenizer.getBindingContext('images')!.getObject();

		// const oImagesModel = this.oComponent.getModel('images');
		// this.imageEventHandlers.removeKeywordImageTokenFromModel(sKeywordTokenKey, oImage, oImagesModel);
		new ImageKeywordTagger(this.oComponent.getModel('images')).removeKeywordFromImage(sKeywordTokenKey, oImage);
	}

	onTokenizerPlantImageTokenDelete(oEvent: Event) {
		// note: the token itself has already been deleted; here, we only delete the 
		// 		 corresponding keyword-to-image entry from the model
		// note: there's a same-named function in untagged controller doing the same thing for untagged images

		// we get the token from the event parameters
		const aTokens = <Token[]>oEvent.getParameter('tokens');
		if (aTokens.length > 1) throw new Error("Unexpected error: More than one token to be deleted at once");
		const oToken = <Token>aTokens[0];
		const sPlantTokenKey = oToken.getKey();

		// the event's source is the tokenizer
		const oTokenizer = <Tokenizer>oEvent.getSource();
		const oImage = <FBImage>oTokenizer.getBindingContext('images')!.getObject();

		// const oImagesModel = this.oComponent.getModel('images');
		// this.imageEventHandlers.removePlantImageTokenFromModel(sPlantTokenKey, oImage, oImagesModel);
		new ImagePlantTagger(this.oComponent.getModel('images')).removePlantFromImage(sPlantTokenKey, oImage);

	}

	//////////////////////////////////////////////////////////
	// Upload Handlers
	//////////////////////////////////////////////////////////
	onUploadPlantPhotosToServer(oEvent: Event) {
		//upload images and directly assign them to supplied plant; no keywords included
		var oFileUploader = <FileUploader>this.byId("idPlantPhotoUpload");
		if (!oFileUploader.getValue()) {
			// 
			return;
		}

		var sPath = 'plants/' + this.mCurrentPlant.plant.id + '/images/'
		Util.startBusyDialog('Uploading...', 'Image File(s)');
		var sUrl = Util.getServiceUrl(sPath);
		oFileUploader.setUploadUrl(sUrl);
		oFileUploader.upload();
	}

	handleUploadPlantImagesAborted(oEvent: Event) {
		// unfortunately never triggered at all by FileUploader
	}

	handleUploadPlantImagesComplete(oEvent: Event) {
		// handle message, show error if required
		var oResponse = JSON.parse(oEvent.getParameter('responseRaw'));
		if (!oResponse) {
			const sMsg = "Upload complete, but can't determine status.";
			MessageHandler.getInstance().addMessage(MessageType.Warning, sMsg);
		}
		MessageHandler.getInstance().addMessageFromBackend(oResponse.message);

		// add to images registry and refresh current plant's images
		const aImages: FBImage[] = oResponse.images;
		if (aImages.length > 0) {
			// this.modelsHelper.addToImagesRegistry(oResponse.images);
			const oImageRegistryHandler = ImageRegistryHandler.getInstance();
			oImageRegistryHandler.addImageToImagesRegistry(aImages);
			ChangeTracker.getInstance().addOriginalImages(aImages);
			// this.resetImagesCurrentPlant(this.mCurrentPlant.plant.id!);
			oImageRegistryHandler.resetImagesForPlant(this.mCurrentPlant.plant.id);
			this.oComponent.getModel('images').updateBindings(false);
		}

		Util.stopBusyDialog();
		MessageToast.show(oResponse.message.message);
	}

	onHandleTypeMissmatch(oEvent: Event) {
		// handle file type missmatch for image upload
		// note: there's a same-nemed method in flexible column layout controller handling uploads there
		const oFileUpload = <FileUploader>oEvent.getSource();
		const sFiletype = oEvent.getParameter("fileType")

		// todo move to separate image upload class, used by both detail and fcl views
		var aFileTypes = oFileUpload.getFileType().map(ele => "*." + ele)
		var sSupportedFileTypes = aFileTypes.join(", ");
		MessageToast.show("The file type *." + sFiletype +
			" is not supported. Choose one of the following types: " +
			sSupportedFileTypes);
	}
}