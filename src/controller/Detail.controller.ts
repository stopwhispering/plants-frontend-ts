import BaseController from "plants/ui/controller/BaseController"
import JSONModel from "sap/ui/model/json/JSONModel"
import Filter from "sap/ui/model/Filter"
import formatter from "plants/ui/model/formatter"
import MessageToast from "sap/m/MessageToast"
import Util from "plants/ui/customClasses/shared/Util";
import Navigation from "plants/ui/customClasses/singleton/Navigation"
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler"
import EventCRUD from "plants/ui/customClasses/events/EventCRUD"
import FilterOperator from "sap/ui/model/FilterOperator"
import ImageToTaxonAssigner from "plants/ui/customClasses/images/ImageToTaxonAssigner"
import ImageToEventAssigner from "plants/ui/customClasses/images/ImageToEventAssigner"
import { EventRead } from "plants/ui/definitions/Events"
import Control from "sap/ui/core/Control"
import Input, { Input$SubmitEvent, Input$SuggestEvent, Input$SuggestionItemSelectedEvent } from "sap/m/Input"
import Icon, { Icon$PressEvent } from "sap/ui/core/Icon"
import ListBinding from "sap/ui/model/ListBinding"
import MenuItem, { MenuItem$PressEvent } from "sap/m/MenuItem"
import OverflowToolbarButton from "sap/m/OverflowToolbarButton"
import { MessageType } from "sap/ui/core/library"
import FileUploader, { FileUploader$ChangeEvent, FileUploader$TypeMissmatchEvent, FileUploader$UploadAbortedEvent, FileUploader$UploadCompleteEvent } from "sap/ui/unified/FileUploader"
import Button, { Button$PressEvent } from "sap/m/Button"
import Context from "sap/ui/model/Context"
import { ImagePlantTag, Keyword } from "plants/ui/definitions/Images"
import Token, { Token$PressEvent } from "sap/m/Token"
import { FBAssociatedPlantExtractForPlant, PlantRead, PlantTag } from "plants/ui/definitions/Plants"
import { LCurrentPlant } from "plants/ui/definitions/PlantsLocal"
import Tokenizer, { Tokenizer$TokenDeleteEvent } from "sap/m/Tokenizer"
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
import { TaxonRead } from "plants/ui/definitions/Taxon"
import ImageKeywordTagger from "plants/ui/customClasses/images/ImageKeywordTagger"
import ImagePlantTagger from "plants/ui/customClasses/images/ImagePlantTagger"
import ModelsHelper from "../model/ModelsHelper"
import OccurrenceImagesFetcher from "../customClasses/taxonomy/OccurrenceImagesFetcher"
import EventsListHandler from "../customClasses/events/EventsListHandler"
import AssignImageToEventDialogHandler from "../view/fragments/events/AssignImageToEventDialogHandler"
import RenamePlantDialogHandler from "../customClasses/plants/RenamePlantDialogHandler"
import NewDescendantPlantDialogHandler from "../customClasses/plants/NewDescendantPlantDialogHandler"
import ClonePlantDialogHandler from "../customClasses/plants/ClonePlantDialogHandler"
import CancelPlantPopverHandler from "../customClasses/plants/CancelPlantPopverHandler"
import SearchSpeciesDialogHandler from "../customClasses/taxonomy/SearchSpeciesDialogHandler"
import NewPlantTagPopoverHandler from "../customClasses/plants/NewPlantTagPopoverHandler"
import DeletePlantTagMenuHandler from "../customClasses/plants/DeletePlantTagMenuHandler"
import LeafletMapHandler from "../customClasses/taxonomy/LeafletMapHandler"
import SearchField, { SearchField$LiveChangeEvent } from "sap/m/SearchField"
import GridList from "sap/f/GridList"
import {ImageRead} from "plants/ui/definitions/Images"
import NewEventDialogHandler from "../customClasses/events/NewEventDialogHandler"
import EditEventDialogHandler from "../customClasses/events/EditEventDialogHandler"
import { ListBase$DeleteEvent } from "sap/m/ListBase"
import GridListItem from "sap/f/GridListItem"
import { InputBase$ChangeEvent } from "sap/m/InputBase"
import { ObjectStatus$PressEvent } from "sap/m/ObjectStatus"
import Route, { Route$PatternMatchedEvent } from "sap/ui/core/routing/Route"
import { LRouteMatchedArguments } from "../definitions/entities"
import Event from "sap/ui/base/Event"
import InputWithIcon, { InputWithIcon$EndButtonPressEvent } from "../control/InputWithIcon"


/**
 * @namespace plants.ui.controller
 */
export default class Detail extends BaseController {
	// container for xml view control event handlers
	public formatter = new formatter();
	private eventCRUD: EventCRUD;
	private oNewEventDialogHandler: NewEventDialogHandler;
	private oEditEventDialogHandler: EditEventDialogHandler;
	private oPlantLookup: PlantLookup;
	private mCurrentPlant: LCurrentPlant;  // container currentPlantId, currentPlantIndex, currentPlant
	private oLayoutModel: JSONModel;
	private oEventsListHandler: EventsListHandler;

	private _oAssignImageToEventDialogHandler: AssignImageToEventDialogHandler;  // lazy loaded
	private _oPlantImagesLoader: PlantImagesLoader;  // lazy loaded
	private _oPlantRenamer: PlantRenamer;  // lazy loaded
	private _oSearchSpeciesDialogHandler: SearchSpeciesDialogHandler;  // lazy loaded
	private _oLeafletMapHandler: LeafletMapHandler;  // lazy loaded
	private oDeletePlantTagMenuHandler: DeletePlantTagMenuHandler;  // lazy loaded
	private oNewPlantTagPopoverHandler: NewPlantTagPopoverHandler;  // lazy loaded

	onInit() {
		super.onInit();

		const oSuggestionsModel = <JSONModel>this.oComponent.getModel('suggestions');
		SuggestionService.createInstance(oSuggestionsModel);  // required in NewDescendantPlantDialogHandler
		// this.suggestionService = SuggestionService.getInstance();

		this.mCurrentPlant = <LCurrentPlant>{
			plant_id: undefined,
			plant_index: undefined,
			plant: undefined,
		}

		this.oPlantLookup = new PlantLookup(this.oComponent.getModel('plants'));

		this.eventCRUD = new EventCRUD(this.oComponent.getModel('events'));

		this.oLayoutModel = this.oComponent.getModel();

		this.oNewEventDialogHandler = new NewEventDialogHandler(this.eventCRUD, 
			this.getView(), oSuggestionsModel.getData());
		this.oEditEventDialogHandler = new EditEventDialogHandler(this.eventCRUD, 
			this.getView(), oSuggestionsModel.getData());

		// const oEventsModel = <JSONModel>this.oComponent.getModel('events');
		this.oEventsListHandler = new EventsListHandler(this.eventCRUD);

		// default: view mode for plants information
		this.oComponent.getModel('status').setProperty('/details_editable', false);

		(<Route>this.oRouter.getRoute("detail")).attachPatternMatched(this._onPatternMatched, this);
		this.oRouter.getRoute("untagged").attachPatternMatched(this._onPatternMatched, this);

		// // bind factory function to events list aggregation binding
		// var oEventsList = this.byId("eventsList");

		// // we want to pass the view to the factory function without changing this-context, 
		// // so instead of using .bind(...) we curry the factory function
		// const fnCurryFactory = (sId: string, oBindingContext: Context) => EventListItemFactory(this.getView(), sId, oBindingContext);
		// oEventsList.bindAggregation("items",
		// 	{
		// 		path: "events>",
		// 		templateShareable: false,
		// 		factory: fnCurryFactory,
		// 		sorter: new Sorter('date', true)  // descending by date
		// 	});
		// var oEventsList = this.byId("eventsList");
		// oEventsList.bindAggregation("items",
		// 	{
		// 		path: "events>",
		// 		templateShareable: false,
		// 		sorter: new Sorter('date', true)  // descending by date
		// 	});

		this.oComponent.getModel('status').setProperty('/images_editable', false);
	}
	
	private _onPatternMatched(oEvent: Route$PatternMatchedEvent) {
		// if accessed directly, we might not have loaded the plants model, yet
		// in that case, we have only the plant_id (from the url's hash), but not the position of that plant
		// in the plants model index. so we must defer binding the plant to the view

		// todo still required?
		// Util.startBusyDialog();

		// bind taxon of current plant and events to view (deferred as we may not know the plant name here, yet)
		const oArguments = <LRouteMatchedArguments>oEvent.getParameter("arguments");
		this.mCurrentPlant.plant_id = parseInt(oArguments.plant_id) || this.mCurrentPlant.plant_id || 0;


		const oPlantDetailsBootstrap = new PlantDetailsBootstrap(
			this.getView(),
			this.oComponent.getModel('plants'),
			this.oComponent.getModel('events'),
			this.oComponent.getModel('flower_history'),
			this.oComponent.getModel('images'),
			this.oComponent.getModel('taxon'),
			this.mCurrentPlant,
			[<Control>this.byId('eventsSection'), <Control>this.byId('flowerHistorySection')],
			[<Control>this.byId('imagesSection')]
		);
		oPlantDetailsBootstrap.load(this.mCurrentPlant.plant_id);
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

	public onToggleEditMode(oEvent: Button$PressEvent) {
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
	onPressButtonRenamePlant(oEvent: MenuItem$PressEvent) {
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
	public onPressTag(oEvent: ObjectStatus$PressEvent) {
		if (!this.oDeletePlantTagMenuHandler)
			this.oDeletePlantTagMenuHandler = new DeletePlantTagMenuHandler(this.oComponent.getModel('plants'));
		
	const oSource = <Control>oEvent.getSource();
	// const sPathTag = oSource.getBindingContext('plants')!.getPath();
	const sTagText = (<PlantTag>oSource.getBindingContext('plants').getObject()).text;
	this.oDeletePlantTagMenuHandler.openDeletePlantTagMenu(this.mCurrentPlant.plant, sTagText, this.getView(), oSource, "Plant");
	}

	onOpenAddTagDialog(oEvent: Button$PressEvent) {
		// create add tag dialog
		if (!this.oNewPlantTagPopoverHandler)
			this.oNewPlantTagPopoverHandler = new NewPlantTagPopoverHandler(this.oComponent.getModel('plants'));
		var oButton = <Control>oEvent.getSource();
		const bPlantHasTaxon = !!this.mCurrentPlant.plant.taxon_id;
		this.oNewPlantTagPopoverHandler.openNewPlantTagPopover([this.mCurrentPlant.plant], oButton, this.getView(), bPlantHasTaxon);
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

	onSuggestNursery(oEvent: Input$SuggestEvent) {
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

	onSwitchActive(oEvent: Button$PressEvent) {
		// open dialog to choose reason for plant deactivation
		if (!this.mCurrentPlant.plant.active){
			this.mCurrentPlant.plant.active = true;
			this.oComponent.getModel('plants').updateBindings(false);
			return;
		}

		const oSource = <Control>oEvent.getSource();
		const oCancelPlantPopverHandler = new CancelPlantPopverHandler(this.oComponent.getModel('suggestions'), 
																	   this.oComponent.getModel('plants'));
		oCancelPlantPopverHandler.openCancelPlantPopover(this.getView(), this.mCurrentPlant.plant, oSource);
	}

	onChangeParent(oEvent: InputBase$ChangeEvent) {
		// verify entered parent and set parent plant id
		var aPlants = <PlantRead[]>this.getView().getModel('plants').getProperty('/PlantsCollection');
		var parentPlant = aPlants.find(plant => plant.plant_name === oEvent.getParameter('value').trim());

		// if (!oEvent.getParameter('newValue').trim() || !parentPlant) {
		if (!oEvent.getParameter('value').trim() || !parentPlant) {
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
	onPressButtonDeletePlant(oEvent: MenuItem$PressEvent) {
		//confirm dialog
		var oMenuItem = <MenuItem>oEvent.getSource();
		var oPlant = <PlantRead>oMenuItem.getBindingContext('plants')!.getObject();
		var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

		const oPlantDeleter = new PlantDeleter(this.oComponent.getModel('plants'), this.onHandleClose.bind(this));
		oPlantDeleter.askToDeletePlant(oPlant, bCompact);
	}

	//////////////////////////////////////////////////////////
	// Clone Plant Handlers
	//////////////////////////////////////////////////////////
	onPressButtonClonePlant(oEvent: MenuItem$PressEvent) {
		// triggered by button in details upper menu
		// opens dialog to clone current plant
		const oPlantsModel = this.oComponent.getModel('plants');
		const oClonePlantDialogHandler = new ClonePlantDialogHandler(this.oPlantLookup, oPlantsModel);
		oClonePlantDialogHandler.openClonePlantDialog(this.getView(), this.mCurrentPlant.plant);
	}


	onPressButtonCreateDescendantPlant(oEvent: MenuItem$PressEvent) {
		// triggered by button in details upper menu
		// opens dialog to create descendant plant with current plant as mother plant

		const oNewDescendantPlantDialogHandler = new NewDescendantPlantDialogHandler(this.oPlantLookup, this.oComponent.getModel('plants'), this.oComponent.getModel('suggestions'));
		oNewDescendantPlantDialogHandler.openNewDescendantPlantDialog(this.getView(), this.mCurrentPlant.plant);

	}

	//////////////////////////////////////////////////////////
	// Search Species Handler
	//////////////////////////////////////////////////////////
	onOpenFindSpeciesDialog() {

		if (!this._oSearchSpeciesDialogHandler){
			this._oSearchSpeciesDialogHandler = new SearchSpeciesDialogHandler(this.oComponent.getModel('plants'), this.oComponent.getModel('taxon'), this.getView());
		}
		const oTaxonContext = <Context|undefined>this.getView().getBindingContext('taxon');
		if (!oTaxonContext){
			return;
		}
		const oTaxon = <TaxonRead|undefined>oTaxonContext.getObject(); 
		this._oSearchSpeciesDialogHandler.openSearchSpeciesDialog(this.getView(), 
			this.mCurrentPlant.plant, oTaxon);
	}



	//////////////////////////////////////////////////////////
	// Leaflet Map Handler
	//////////////////////////////////////////////////////////	
	onShowMap(oEvent: Button$PressEvent) {
		if (!this._oLeafletMapHandler)
			this._oLeafletMapHandler = new LeafletMapHandler();
			this._oLeafletMapHandler.openLeafletMapDialog(this.getView());
	}

	//////////////////////////////////////////////////////////
	// Taxonomy Handlers
	//////////////////////////////////////////////////////////	
	onRefetchGbifImages(oEvent: Button$PressEvent) {
		const oTaxon = <TaxonRead>(<Control>oEvent.getSource()).getBindingContext('taxon')!.getObject()
		if (!oTaxon.gbif_id)
			throw new Error('No gbif_id found for taxon ' + oTaxon.name);
		new OccurrenceImagesFetcher(this.oComponent.getModel('taxon')).fetchOccurrenceImages(oTaxon.gbif_id, this.mCurrentPlant.plant);
	}

	onIconPressUnassignImageFromTaxon(oEvent: Icon$PressEvent) {
		const oSource = <Icon>oEvent.getSource();
		const oTaxonModel = <JSONModel>this.oComponent.getModel('taxon')
		new ImageToTaxonAssigner().unassignImageFromTaxon(oSource, oTaxonModel);
	}

	onIconPressAssignImageToTaxon(oEvent: Icon$PressEvent) {
		const oSource = <Icon>oEvent.getSource();
		const oTaxonModel = <JSONModel>this.oComponent.getModel('taxon')
		new ImageToTaxonAssigner().assignImageToTaxon(oSource, oTaxonModel);
	}

	//////////////////////////////////////////////////////////
	// Event Handlers
	//////////////////////////////////////////////////////////
	onOpenDialogAddEvent(oEvent: Button$PressEvent) {
		this.oNewEventDialogHandler.openDialogNewEvent(this.getView(), this.mCurrentPlant.plant);
	}

	onEditEvent(oEvent: Button$PressEvent) {
		// triggered by edit button in a custom list item header in events list
		const oSource = <Button>oEvent.getSource();
		const oSelectedEvent = <EventRead>oSource.getBindingContext('events')!.getObject();
		this.oEditEventDialogHandler.openDialogEditEvent(this.getView(), oSelectedEvent)
	}

	onDeleteEventsTableRow(oEvent: ListBase$DeleteEvent) {
		const oSelectedEvent = <EventRead>oEvent.getParameter('listItem').getBindingContext('events').getObject();
		this.oEventsListHandler.deleteRow(oSelectedEvent);
	}

	onIconPressUnassignImageFromEvent(oEvent: ListBase$DeleteEvent) {
		//@ts-ignore
		const sEventsBindingPath = (<GridListItem>oEvent.getParameter('listItem')).getBindingContextPath('events');
		const oEventsModel = <JSONModel>this.oComponent.getModel('events');
		new ImageToEventAssigner().unassignImageFromEvent(sEventsBindingPath, oEventsModel);
	}

	onIconPressAssignImageToEvent(oEvent: Icon$PressEvent) {
		// triggered by icon beside image; assign that image to one of the plant's events
		const oSource = <Icon>oEvent.getSource();
		var sPathCurrentImage = oSource.getBindingContext("images")!.getPath();
		if (!this._oAssignImageToEventDialogHandler){
			const oEventsModel = <JSONModel>this.oComponent.getModel('events');
			this._oAssignImageToEventDialogHandler = new AssignImageToEventDialogHandler(oEventsModel);
		}
		this._oAssignImageToEventDialogHandler.openAssignImageToEventDialog(this.getView(), oSource, sPathCurrentImage);

	}

	//////////////////////////////////////////////////////////
	// Image Handlers
	//////////////////////////////////////////////////////////
	onIconPressSetPreview(oEvent: Icon$PressEvent) {
		// get selected image and current plant in model
		var oSource = <Icon>oEvent.getSource();
		var sPathCurrentImage = oSource.getBindingContext("images")!.getPath();
		var oCurrentImage = <ImageRead>this.oComponent.getModel('images').getProperty(sPathCurrentImage);
		var sPathCurrentPlant = oSource.getBindingContext("plants")!.getPath();
		var oCurrentPlant = <PlantRead>this.oComponent.getModel('plants').getProperty(sPathCurrentPlant);

		oCurrentPlant.preview_image_id = oCurrentImage.id;
		this.oComponent.getModel('plants').updateBindings(false);
	}

	onEndButtonPressToDash(oEvent: InputWithIcon$EndButtonPressEvent) {
		const oButton = <InputWithIcon>oEvent.getSource();
        if (oButton.getEnabled() && oButton.getEditable()) {
			oButton.setValue('-');
        }
	}

	onAddPlantNameToUntaggedImage(oEvent: Input$SuggestionItemSelectedEvent) {
		//adds selected plant in input field (via suggestions) to an image in (details view)
		//note: there's a same-named function in untagged controller doing the same thing for untagged images
		const oSource = <Input>oEvent.getSource();
		const oImage = <ImageRead>oSource.getBindingContext("images")!.getObject()
		const oSelectedSuggestion = oEvent.getParameter('selectedRow');
		const oSelectedPlant = <PlantRead>oSelectedSuggestion.getBindingContext('plants').getObject();
		const oImagesModel = this.oComponent.getModel('images');
		// this.imageEventHandlers.assignPlantToImage(oSelectedPlant, oImage, oImagesModel);
		new ImagePlantTagger(oImagesModel).addPlantToImage(oSelectedPlant, oImage);
		// this.imageEventHandlers.addPlantNameToImage();
		oImagesModel.updateBindings(true);
		oSource.setValue('');
	}
	onPressImagePlantToken(oEvent: Token$PressEvent) {
		//navigate to chosen plant in plant details view when clicking on plant token in untagged images view
		//note: there's a same-named function in untagged controller doing the same thing for untagged images
		const oSource = <Token>oEvent.getSource();
		const oPlantTag = <ImagePlantTag>oSource.getBindingContext('images')!.getObject();
		if (!oPlantTag.plant_id || oPlantTag.plant_id <= 0) throw new Error("Unexpected error: No Plant ID");

		if (oPlantTag.plant_id === this.mCurrentPlant.plant.id) return; //already on this plant (no need to navigate)

		//navigate to plant in layout's current column (i.e. middle column)
		Navigation.getInstance().navToPlant(this.oPlantLookup.getPlantById(oPlantTag.plant_id));
	}

	onIconPressDeleteImage(oEvent: Icon$PressEvent) {
		//note: there's a same-named function in untagged controller doing the same thing for untagged images
		const oSource = <Icon>oEvent.getSource();
		const oImage = <ImageRead>oSource.getBindingContext("images")!.getObject()
		var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

		const oImagesModel = this.oComponent.getModel('images');;
		const oUntaggedImagesModel = this.oComponent.getModel('untaggedImages');
		//todo use imageregistryhandler instaed in imagedeleter
		const oImageDeleter = new ImageDeleter(oImagesModel, oUntaggedImagesModel);
		oImageDeleter.askToDeleteImage(oImage, bCompact);
	}
	
	private _assignKeywordToImage(oInput: Input, sKeyword: string, oImage: ImageRead) {
		//note: there's a same-named function in untagged controller doing the same thing for untagged images
		oInput.setValue('');
		new ImageKeywordTagger(this.oComponent.getModel('images')).addKeywordToImage(sKeyword, oImage);
	}

	onInputImageNewKeywordSubmit(oEvent: Input$SubmitEvent) {
		//note: there's a same-named function in untagged controller doing the same thing for untagged images
		const oInput = <Input>oEvent.getSource();
		const oImage = <ImageRead>oInput.getParent().getBindingContext('images')!.getObject();
		if (oEvent.getParameter('value').trim().length < 1) {
			MessageToast.show("Please enter a keyword with at least one character.");
			return;
		}
		this._assignKeywordToImage(oInput, oEvent.getParameter('value').trim(), oImage);

		// const oInput = <Input>oEvent.getSource();
		// oInput.setValue('');
		// const sKeyword = oEvent.getParameter('value').trim();
		// const oImage = <ImageRead>oInput.getParent().getBindingContext('images')!.getObject();
		// new ImageKeywordTagger(this.oComponent.getModel('images')).addKeywordToImage(sKeyword, oImage);
	}
	
	onKeywordSuggestionItemSelected(oEvent: Input$SuggestionItemSelectedEvent) {
		//note: there's a same-named function in untagged controller doing the same thing for untagged images
		// triggered when a keyword suggestion is selected in the tokenizer; simulate behaviour of pressing the "Enter" key
		const oInput = <Input>oEvent.getSource();
		const oSelectedItem = oEvent.getParameter("selectedItem");

		if (oSelectedItem) {
			const oInput = <Input>oEvent.getSource();
			const oImage = <ImageRead> oInput.getParent().getBindingContext('images')!.getObject();
			this._assignKeywordToImage(oInput, oSelectedItem.getText(), oImage);
		}
	}

	onSwitchImageEditDescription(oEvent: Icon$PressEvent) {
		// switch "editable" for plant image description fields
		const oModelStatus = <JSONModel>this.getView().getModel('status');
		if (oModelStatus.getProperty('/images_editable')) {
			oModelStatus.setProperty('/images_editable', false);
		} else {
			oModelStatus.setProperty('/images_editable', true);
		}
	}

	onTokenizerKeywordImageTokenDelete(oEvent: Tokenizer$TokenDeleteEvent) {
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
		const oImage = <ImageRead>oTokenizer.getBindingContext('images')!.getObject();

		// const oImagesModel = this.oComponent.getModel('images');
		// this.imageEventHandlers.removeKeywordImageTokenFromModel(sKeywordTokenKey, oImage, oImagesModel);
		new ImageKeywordTagger(this.oComponent.getModel('images')).removeKeywordFromImage(sKeywordTokenKey, oImage);
	}

	onTokenizerPlantImageTokenDelete(oEvent: Tokenizer$TokenDeleteEvent) {
		// note: the token itself has already been deleted; here, we only delete the 
		// 		 corresponding keyword-to-image entry from the model
		// note: there's a same-named function in untagged controller doing the same thing for untagged images

		// we get the token from the event parameters
		const aTokens = <Token[]>oEvent.getParameter('tokens');
		if (aTokens.length > 1) throw new Error("Unexpected error: More than one token to be deleted at once");
		const oToken = <Token>aTokens[0];
		const sPlantTokenKey = oToken.getKey();
		const iPlantId = parseInt(sPlantTokenKey);

		// the event's source is the tokenizer
		const oTokenizer = <Tokenizer>oEvent.getSource();
		const oImage = <ImageRead>oTokenizer.getBindingContext('images')!.getObject();

		new ImagePlantTagger(this.oComponent.getModel('images')).removePlantFromImage(iPlantId, oImage);

	}

	//////////////////////////////////////////////////////////
	// Upload Handlers
	//////////////////////////////////////////////////////////
	onUploadPlantPhotosToServer(oEvent: FileUploader$ChangeEvent) {
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

	handleUploadPlantImagesAborted(oEvent: FileUploader$UploadAbortedEvent) {
		// unfortunately never triggered at all by FileUploader
	}

	handleUploadPlantImagesComplete(oEvent: FileUploader$UploadCompleteEvent) {
		// handle message, show error if required
		var oResponse = JSON.parse(oEvent.getParameter('responseRaw'));
		if (!oResponse) {
			const sMsg = "Upload complete, but can't determine status.";
			MessageHandler.getInstance().addMessage(MessageType.Warning, sMsg);
		}
		MessageHandler.getInstance().addMessageFromBackend(oResponse.message);

		// add to images registry and refresh current plant's images
		const aImages: ImageRead[] = oResponse.images;
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

	onHandleTypeMissmatch(oEvent: FileUploader$TypeMissmatchEvent) {
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
	onLiveChangeImageFilter(oEvent: SearchField$LiveChangeEvent) {

		// add filter to ongoing pollinations gridlist
		var aFilters = [];
		var sQuery = (<SearchField>oEvent.getSource()).getValue().trim().toUpperCase();
		if (sQuery && sQuery.length > 0) {
			var filter = new Filter([
				new Filter("description", function (sDescription) {
					return (sDescription || "").toUpperCase().indexOf(sQuery) > -1;
				}),
				new Filter("plants", function (aPlants: ImagePlantTag[]) {
					return (aPlants.some(oPlantTag => 
						oPlantTag.plant_name.toUpperCase().includes(sQuery) ||
						oPlantTag.plant_id === parseInt(sQuery)))
				}),
				new Filter("keywords", function (aKeywords: Keyword[]) {
					return (aKeywords.some(oKeywordTag => oKeywordTag.keyword.toUpperCase().includes(sQuery)))
				}),
				new Filter("record_date_time", FilterOperator.Contains, sQuery),
			], false);
			aFilters.push(filter);
		}

		// update list binding
		const oDetailImagesGridList = <GridList>this.byId('detailImagesGridList');
		var oBinding = <ListBinding>oDetailImagesGridList .getBinding("items");
		oBinding.filter(aFilters, "Application");
	}
	onPressTaxonTag(oEvent: ObjectStatus$PressEvent) {
	if (!this.oDeletePlantTagMenuHandler)
		this.oDeletePlantTagMenuHandler = new DeletePlantTagMenuHandler(this.oComponent.getModel('plants'));
		
		const oSource = <Control>oEvent.getSource();
		// const sPathTag = oSource.getBindingContext('plants')!.getPath();
		const sTagText = (<PlantTag>oSource.getBindingContext('plants').getObject()).text;
		this.oDeletePlantTagMenuHandler.openDeletePlantTagMenu(this.mCurrentPlant.plant, sTagText, this.getView(), oSource, "Taxon");
	}
}