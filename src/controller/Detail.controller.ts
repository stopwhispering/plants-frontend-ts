import BaseController from "plants/ui/controller/BaseController"
import JSONModel from "sap/ui/model/json/JSONModel"
import Filter from "sap/ui/model/Filter"
import formatter from "plants/ui/model/formatter"
import MessageToast from "sap/m/MessageToast"
import * as Util from "plants/ui/customClasses/shared/Util";
import Navigation from "plants/ui/customClasses/singleton/Navigation"
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler"
import EventCRUD from "plants/ui/customClasses/events/EventCRUD"
import Sorter from "sap/ui/model/Sorter"
import FilterOperator from "sap/ui/model/FilterOperator"
import ImageToTaxonAssigner from "plants/ui/customClasses/images/ImageToTaxonAssigner"
import ImageToEventAssigner from "plants/ui/customClasses/images/ImageToEventAssigner"
import TaxonomyUtil from "plants/ui/customClasses/taxonomy/TaxonomyUtil"
import Fragment from "sap/ui/core/Fragment"
import Dialog from "sap/m/Dialog"
import {
	ObjectStatusCollection,
} from "plants/ui/definitions/entities"
import { IdToFragmentMap, ResponseStatus } from "plants/ui/definitions/SharedLocal"
import { FBEvent, FBSoil } from "plants/ui/definitions/Events"
import { EventEditData, SoilEditData } from "plants/ui/definitions/EventsLocal"
import DatePicker from "sap/m/DatePicker"
import Event from "sap/ui/base/Event"
import Control from "sap/ui/core/Control"
import Popover from "sap/m/Popover"
import Input from "sap/m/Input"
import Icon from "sap/ui/core/Icon"
import ListBinding from "sap/ui/model/ListBinding"
import MenuItem from "sap/m/MenuItem"
import OverflowToolbarButton from "sap/m/OverflowToolbarButton"
import ObjectStatus from "sap/m/ObjectStatus"
import { MessageType } from "sap/ui/core/library"
import FileUploader from "sap/ui/unified/FileUploader"
import Button from "sap/m/Button"
import CheckBox from "sap/m/CheckBox"
import Menu from "sap/m/Menu"
import Table from "sap/m/Table"
import GenericTag from "sap/m/GenericTag"
import Context from "sap/ui/model/Context"
import RadioButton from "sap/m/RadioButton"
import List from "sap/m/List"
import GridListItem from "sap/f/GridListItem"
import { FBImage, FBImagePlantTag } from "plants/ui/definitions/Images"
import Token from "sap/m/Token"
import { FBCancellationReason, FBAssociatedPlantExtractForPlant, BPlant, FBPropagationType } from "plants/ui/definitions/Plants"
import { LCurrentPlant, LDescendantPlantInput } from "plants/ui/definitions/PlantsLocal"
import Tokenizer from "sap/m/Tokenizer"
import ColumnListItem from "sap/m/ColumnListItem"
import ResourceModel from "sap/ui/model/resource/ResourceModel"
import ResourceBundle from "sap/base/i18n/ResourceBundle"
import { LCancellationReasonChoice } from "plants/ui/definitions/PlantsLocal"
import PlantLookup from "plants/ui/customClasses/plants/PlantLookup"
import PlantCreator from "plants/ui/customClasses/plants/PlantCreator"
import SuggestionService from "plants/ui/customClasses/shared/SuggestionService"
import PlantCloner from "plants/ui/customClasses/plants/PlantCloner"
import PlantRenamer from "plants/ui/customClasses/plants/PlantRenamer"
import PlantTagger from "plants/ui/customClasses/plants/PlantTagger"
import PlantNameGenerator from "plants/ui/customClasses/plants/PlantNameGenerator"
import PlantDeleter from "plants/ui/customClasses/plants/PlantDeleter"
import ImageRegistryHandler from "plants/ui/customClasses/singleton/ImageRegistryHandler"
import PlantDetailsBootstrap from "plants/ui/customClasses/plants/PlantDetailsBootstrap"
import PlantImagesLoader from "plants/ui/customClasses/plants/PlantImagesLoader"
import ImageDeleter from "plants/ui/customClasses/images/ImageDeleter"
import MessageBox from "sap/m/MessageBox"
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker"
import { BResultsRetrieveTaxonDetailsRequest, BTaxon } from "plants/ui/definitions/Taxon"
import ImageKeywordTagger from "plants/ui/customClasses/images/ImageKeywordTagger"
import ImagePlantTagger from "plants/ui/customClasses/images/ImagePlantTagger"
import SoilCRUD from "plants/ui/customClasses/events/SoilCRUD"
import SoilDialogHandler from "plants/ui/customClasses/events/SoilDialogHandler"
import EventListItemFactory from "plants/ui/customClasses/events/EventListItemFactory"
import AssignPropertyNamePopoverOpener from "plants/ui/customClasses/properties/AssignPropertyNamePopoverOpener"
import NewPropertyNamePopoverOpener from "plants/ui/customClasses/properties/NewPropertyNamePopoverOpener"
import PropertyNameCRUD from "plants/ui/customClasses/properties/PropertyNameCRUD"
import { LPopoverWithPropertiesCategory, LTemporaryAvailableProperties } from "plants/ui/definitions/PropertiesLocal"
import PropertyValueCRUD from "plants/ui/customClasses/properties/PropertyValueCRUD"
import ModelsHelper from "../model/ModelsHelper"
import OccurrenceImagesFetcher from "../customClasses/taxonomy/OccurrenceImagesFetcher"
import SpeciesFinder from "../customClasses/taxonomy/SpeciesFinder"
import TaxonToPlantAssigner from "../customClasses/taxonomy/TaxonToPlantAssigner"
import { LAjaxLoadDetailsForSpeciesDoneCallback } from "../definitions/TaxonLocal"

/**
 * @namespace plants.ui.controller
 */
export default class Detail extends BaseController {
	// container for xml view control event handlers
	public formatter = new formatter();
	private eventCRUD: EventCRUD;
	private oPlantLookup: PlantLookup;
	public suggestionService: SuggestionService; // public because used in formatter
	// helper classes for controllers
	// TraitUtil = TraitUtil.getInstance()
	private TaxonomyUtil = TaxonomyUtil.getInstance();
	private mCurrentPlant: LCurrentPlant;  // container currentPlantId, currentPlantIndex, currentPlant
	private oLayoutModel: JSONModel;

	private mIdToFragment = <IdToFragmentMap>{
		dialogRenamePlant: "plants.ui.view.fragments.detail.DetailRename",
		dialogCancellation: "plants.ui.view.fragments.detail.DetailCancellation",
		menuDeleteTag: "plants.ui.view.fragments.detail.DetailTagDelete",
		dialogAddTag: "plants.ui.view.fragments.detail.DetailTagAdd",
		dialogCreateDescendant: "plants.ui.view.fragments.detail.DetailCreateDescendant",
		dialogEvent: "plants.ui.view.fragments.events.AddEvent",
		dialogAssignEventToImage: "plants.ui.view.fragments.events.DetailAssignEvent",
		dialogClonePlant: "plants.ui.view.fragments.detail.DetailClone",
		dialogFindSpecies: "plants.ui.view.fragments.detail.DetailFindSpecies",
		dialogLeafletMap: "plants.ui.view.fragments.taxonomy.DetailTaxonomyMap",
		dialogEditPropertyValue: "plants.ui.view.fragments.properties.EditPropertyValue",
		dialogAddProperties: "plants.ui.view.fragments.properties.AvailableProperties",
		dialogNewPropertyName: "plants.ui.view.fragments.properties.NewPropertyName",
		dialogEditSoil: "plants.ui.view.fragments.events.EditSoil",
	}

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

		this.eventCRUD = new EventCRUD(oSuggestionsModel.getData());

		this.oLayoutModel = this.oComponent.getModel();

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
		// this.mCurrentPlant.plant_id = parseInt(oEvent.getParameter("arguments").plant_id || this.mCurrentPlant.plant_id || "0");
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

	protected applyToFragment(sId: string, fn: Function, fnInit?: Function) {
		// to enable vs code to connect fragments with a controller, we may not mention
		// the Dialog/Popover ID in the base controller; therefore we have these names
		// hardcoded in each controller 
		super.applyToFragment(sId, fn, fnInit, this.mIdToFragment);
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
	// Shared Handlers
	//////////////////////////////////////////////////////////
	onLiveChangeNewPlantName(oEvent: Event, type: 'clone' | 'rename' | 'descendant') {
		// called from either rename or clone fragment
		var sText = oEvent.getParameter('value');
		if (type === 'clone') {
			(<Button>this.byId('btnClonePlantSubmit')).setEnabled(sText.length > 0);
		} else if (type === 'rename') {
			(<Button>this.byId('btnRenamePlantSubmit')).setEnabled(sText.length > 0);
		} else if (type === 'descendant') {
			(<Button>this.byId('btnDescendantDialogCreate')).setEnabled(sText.length > 0);
		}
	}

	//////////////////////////////////////////////////////////
	// Clone Plant Handlers
	//////////////////////////////////////////////////////////	
	onPressButtonSubmitClonePlant(oEvent: Event) {
		// use ajax to clone plant in backend
		const sClonedPlantName = (<Input>this.byId('inputClonedPlantName')).getValue().trim();
		const oPlantCloner = new PlantCloner(this.oComponent.getModel('plants'), this.oPlantLookup)
		const oDialogClonePlant = <Dialog>this.byId('dialogClonePlant');
		oPlantCloner.clonePlant(this.mCurrentPlant.plant, sClonedPlantName, oDialogClonePlant);
	}

	//////////////////////////////////////////////////////////
	// Rename Plant Handlers
	//////////////////////////////////////////////////////////
	onPressButtonRenamePlant(oEvent: Event) {
		// triggered by button in details upper menu
		// opens dialog to rename current plant

		// check if there are any unsaved changes
		const oChangeTracker = ChangeTracker.getInstance();
		const aModifiedPlants: BPlant[] = oChangeTracker.getModifiedPlants();
		const aModifiedImages: FBImage[] = oChangeTracker.getModifiedImages();
		const aModifiedTaxa: BTaxon[] = oChangeTracker.getModifiedTaxa();

		// var aModifiedPlants = this.getModifiedPlants();
		// var aModifiedImages = this.getModifiedImages();
		// var aModifiedTaxa = this.getModifiedTaxa();
		if ((aModifiedPlants.length !== 0) || (aModifiedImages.length !== 0) || (aModifiedTaxa.length !== 0)) {
			MessageToast.show('There are unsaved changes. Save modified data or reload data first.');
			return;
		}

		this.applyToFragment('dialogRenamePlant', (oDialog: Dialog) => {
			var oInput = <Input>this.byId('inputNewPlantName');
			oInput.setValue(this.mCurrentPlant.plant.plant_name);
			oDialog.open();
		});
	}

	onPressButtonSubmitRenamePlant(oEvent: Event) {
		// use ajax to rename plant in backend
		const sNewPlantName = (<Input>this.byId('inputNewPlantName')).getValue().trim();

		const oDialogRenamePlant = <Dialog>this.byId('dialogRenamePlant');
		const oPlantImagesLoader = new PlantImagesLoader(this.oComponent.getModel('images'));
		const oPlantRenamer = new PlantRenamer(this.oPlantLookup, oPlantImagesLoader, this.oComponent.getModel('plants'), this.oComponent.getModel('images'), this.oComponent.getModel('untaggedImages'));
		// oPlantRenamer.renamePlant(this.mCurrentPlant.plant, sNewPlantName, this._requestImagesForPlant.bind(this), oDialogRenamePlant);
		oPlantRenamer.renamePlant(this.mCurrentPlant.plant, sNewPlantName, oDialogRenamePlant);
	}

	//////////////////////////////////////////////////////////
	// Plant Tag Handlers
	//////////////////////////////////////////////////////////
	public onPressTag(oEvent: Event) {
		var oSource = <ObjectStatus>oEvent.getSource();
		// create delete dialog for tags
		var sPathTag = oSource.getBindingContext('plants')!.getPath();

		this.applyToFragment('menuDeleteTag', (oMenu: Menu) => {
			oMenu.bindElement({
				path: sPathTag,
				model: "plants"
			});
			oMenu.openBy(oSource, true);
		});
	}

	pressDeleteTag(oEvent: Event) {
		var oSource = <ObjectStatus>oEvent.getSource();
		var oContext = oSource.getBindingContext('plants');
		// get position in tags array
		var sPathItem = oContext!.getPath();
		var iIndex = sPathItem.substr(sPathItem.lastIndexOf('/') + 1);
		// remove item from array
		this.oComponent.getModel('plants').getData().PlantsCollection[this.mCurrentPlant.plant_index!].tags.splice(iIndex, 1);
		this.oComponent.getModel('plants').refresh();
	}

	onOpenAddTagDialog(oEvent: Event) {
		// create add tag dialog
		var oButton = oEvent.getSource();

		this.applyToFragment(
			'dialogAddTag',
			(p: Popover) => p.openBy(oButton, true),
			_initTagDialog.bind(this));
		function _initTagDialog(oPopover: Popover) {
			var mObjectStatusSelection = <ObjectStatusCollection>{
				ObjectStatusCollection: [
					{ selected: false, 'text': 'None', 'state': 'None' },
					{ selected: false, 'text': 'Indication01', 'state': 'Indication01' },
					{ selected: false, 'text': 'Success', 'state': 'Success' },
					{ selected: true, 'text': 'Information', 'state': 'Information' },
					{ selected: false, 'text': 'Error', 'state': 'Error' },
					{ selected: false, 'text': 'Warning', 'state': 'Warning' }
				],
				Value: ''
			};
			var oTagTypesModel = new JSONModel(mObjectStatusSelection);
			oPopover.setModel(oTagTypesModel, 'tagTypes');
		}
	}

	onAddTag(oEvent: Event) {
		// create a new tag inside the plant's object in the plants model
		// it will be saved in backend when saving the plant
		// new/deleted tags are within scope of the plants model modification tracking
		const oPopover = <Popover>this.byId('dialogAddTag');
		const oPlant = <BPlant>this.oComponent.getModel('plants').getData().PlantsCollection[this.mCurrentPlant.plant_index!];
		const oPlantTagger = new PlantTagger(this.oComponent.getModel('plants'));
		const oModelTagTypes = <JSONModel>oPopover.getModel('tagTypes');
		oPlantTagger.addTagToPlant(oPlant, oModelTagTypes);
		(<Popover>this.byId('dialogAddTag')).close();
	}

	//////////////////////////////////////////////////////////
	// Plant Details Handlers
	//////////////////////////////////////////////////////////		
	onSetInactive(oEvent: Event) {
		//set plant inactive after choosing a reason (e.g. freezing, drought, etc.)
		//we don't use radiobuttongroup helper, so we must get selected element manually
		var aReasons = <LCancellationReasonChoice[]>this.oComponent.getModel('suggestions').getProperty('/cancellationReasonCollection');
		var oReasonSelected = aReasons.find(ele => ele.selected);

		//set current plant's cancellation reason and date
		var oCurrentPlant = <BPlant>this.getView().getBindingContext('plants')!.getObject();
		oCurrentPlant.cancellation_reason = oReasonSelected!.text as FBCancellationReason;
		var oDatePicker = <DatePicker>this.byId("cancellationDate");
		let oDate: Date = oDatePicker.getDateValue() as unknown as Date;
		var sDateFormatted = Util.formatDate(oDate);
		// this.getView().getBindingContext('plants').getObject().cancellation_date = sDateFormatted;
		oCurrentPlant.cancellation_date = sDateFormatted;
		(<JSONModel>this.oComponent.getModel('plants')).updateBindings(false);

		(<Dialog>this.byId('dialogCancellation')).close();
	}

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

		var oView = this.getView();
		if (!this.byId('dialogCancellation')) {
			Fragment.load({
				name: "plants.ui.view.fragments.detail.DetailCancellation",
				id: oView.getId(),
				controller: this
			}).then((oControl: Control | Control[]) => {
				const oPopover: Popover = oControl as Popover;
				(<DatePicker>oView.byId("cancellationDate")).setDateValue(new Date());
				oView.addDependent(oPopover);
				oPopover.openBy(oSwitch, true);
			});
		} else {
			(<Popover>this.byId('dialogCancellation')).openBy(oSwitch, true);
		}
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
	// Delete Plant Handlers
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

		// check if there are any unsaved changes

		const oChangeTracker = ChangeTracker.getInstance();
		const aModifiedPlants: BPlant[] = oChangeTracker.getModifiedPlants();
		const aModifiedImages: FBImage[] = oChangeTracker.getModifiedImages();
		const aModifiedTaxa: BTaxon[] = oChangeTracker.getModifiedTaxa();
		// var aModifiedPlants = this.getModifiedPlants();
		// var aModifiedImages = this.getModifiedImages();
		// var aModifiedTaxa = this.getModifiedTaxa();
		if ((aModifiedPlants.length !== 0) || (aModifiedImages.length !== 0) || (aModifiedTaxa.length !== 0)) {
			MessageToast.show('There are unsaved changes. Save modified data or reload data first.');
			return;
		}

		this.applyToFragment('dialogClonePlant', (o: Dialog) => {
			const oPlantNameGenerator = new PlantNameGenerator(this.oPlantLookup);
			const clonePlantName = oPlantNameGenerator.generatePlantNameWithRomanizedSuffix(this.mCurrentPlant.plant.plant_name, 2);
			// const clonePlantName = this._generatePlantNameWithRomanizedSuffix(this.mCurrentPlant.plant.plant_name, 2);
			const oInput = <Input>this.byId('inputClonedPlantName');
			oInput.setValue(clonePlantName);
			o.open();
		});
	}

	//////////////////////////////////////////////////////////
	// Create Descendant Plant Handlers
	//////////////////////////////////////////////////////////
	onDescendantDialogCreate(oEvent: Event) {
		// triggered from create-descendant-dialog to create the descendant plant
		const descendantPlantInput = <LDescendantPlantInput>(<JSONModel>this.byId('dialogCreateDescendant').getModel('descendant')).getData();
		// this.oPlantLookup.createDescendantPlant(descendantPlantInput);

		const oPlantCreator = new PlantCreator(this.oComponent.getModel('plants'), this.oPlantLookup);
		oPlantCreator.createDescendantPlant(descendantPlantInput);

		this.applyToFragment('dialogCreateDescendant', (oDialog: Dialog) => oDialog.close());
	}

	onDescendantDialogChangeParent(oEvent: Event, parentType: 'parent' | 'parent_pollen') {
		// reset parent plant (/pollen) input if entered plant name is invalid
		var parentPlantName = oEvent.getParameter('newValue').trim();

		if (!parentPlantName || !this.oPlantLookup.plantNameExists(parentPlantName)) {
			(<Input>oEvent.getSource()).setValue('');
			return;
		}

		this.onUpdatePlantNameSuggestion();
	}

	onDescendantDialogSwitchParents() {
		// triggered by switch button; switch parent plant and parent plant pollen
		var model = <JSONModel>this.byId('dialogCreateDescendant').getModel('descendant');
		var parentPlantName = model.getProperty('/parentPlant');
		model.setProperty('/parentPlant', model.getProperty('/parentPlantPollen'));
		model.setProperty('/parentPlantPollen', parentPlantName);

		this.onUpdatePlantNameSuggestion();
	}

	onPressButtonCreateDescendantPlant(oEvent: Event) {
		// triggered by button in details upper menu
		// opens dialog to create descendant plant with current plant as mother plant

		// check if there are any unsaved changes
		const oChangeTracker = ChangeTracker.getInstance();
		const aModifiedPlants: BPlant[] = oChangeTracker.getModifiedPlants();
		const aModifiedImages: FBImage[] = oChangeTracker.getModifiedImages();
		const aModifiedTaxa: BTaxon[] = oChangeTracker.getModifiedTaxa();
		// var aModifiedPlants = this.getModifiedPlants();
		// var aModifiedImages = this.getModifiedImages();
		// var aModifiedTaxa = this.getModifiedTaxa();
		if ((aModifiedPlants.length !== 0) || (aModifiedImages.length !== 0) || (aModifiedTaxa.length !== 0)) {
			MessageToast.show('There are unsaved changes. Save modified data or reload data first.');
			return;
		}

		this.applyToFragment('dialogCreateDescendant', (oDialog: Dialog) => {
			// create json model descendant and set it (default settings are when opening)
			var defaultPropagationType: FBPropagationType = 'seed (collected)';
			var descendantPlantDataInit: LDescendantPlantInput = {
				propagationType: defaultPropagationType,
				parentPlant: this.oPlantLookup.getPlantById(this.mCurrentPlant.plant_id!).plant_name,
				parentPlantPollen: undefined,
				descendantPlantName: undefined
			};
			var oModelDescendant = new JSONModel(descendantPlantDataInit);
			oDialog.setModel(oModelDescendant, "descendant");
			this.onUpdatePlantNameSuggestion();
			oDialog.open();
		}
		);
	}

	onUpdatePlantNameSuggestion() {
		// generate new plant name suggestion
		const oCheckbox = <CheckBox>this.byId('autoNameDescendantPlantName');
		if (!oCheckbox.getSelected()) {
			return;
		}

		const oDescendantModel = <JSONModel>this.byId('dialogCreateDescendant').getModel('descendant');
		const oDescendantPlantInput = <LDescendantPlantInput>oDescendantModel.getData();
		const oPlantNameGenerator = new PlantNameGenerator(this.oPlantLookup);
		const sSuggestedName = oPlantNameGenerator.generateDescendantPlantName(oDescendantPlantInput);

		const oModelDescendant = <JSONModel>this.byId('dialogCreateDescendant').getModel('descendant');
		oModelDescendant.setProperty('/descendantPlantName', sSuggestedName);
	}

	//////////////////////////////////////////////////////////
	// Taxonomy Handlers
	//////////////////////////////////////////////////////////
	onOpenFindSpeciesDialog() {
		this.applyToFragment('dialogFindSpecies',
			(oDialog: Dialog) => oDialog.open(),
			(oDialog: Dialog) => {
				var oKewResultsModel = new JSONModel();
				this.getView().setModel(oKewResultsModel, 'kewSearchResults');
			});
	}

	onButtonFindSpecies(oEvent: Event) {
		const sTaxonNamePattern = (<Input>this.byId('inputTaxonNamePattern')).getValue();
		const bIncludeExternalApis = (<CheckBox>this.byId('cbIncludeExternalApis')).getSelected();
		const bSearchForGenusNotSpecies = (<CheckBox>this.byId('cbGenus')).getSelected();
		const oModelKewSearchResults = <JSONModel>this.getView().getModel('kewSearchResults');  //model attached to view, not component
		// this.TaxonomyUtil.findSpecies(sTaxonNamePattern, bIncludeExternalApis, bSearchForGenusNotSpecies, oModelKewSearchResults);
		new SpeciesFinder(oModelKewSearchResults).searchSpecies(sTaxonNamePattern, bIncludeExternalApis, bSearchForGenusNotSpecies);
	}

	onFindSpeciesChoose(oEvent: Event) {
		const oSelectedItem = <ColumnListItem>(<Table>this.byId('tableFindSpeciesResults')).getSelectedItem();
		const sCustomName = (<GenericTag>this.byId('textFindSpeciesAdditionalName')).getText().trim();
		const oDialog = <Dialog>this.getView().byId("dialogFindSpecies");
		const oModelKewSearchResults = <JSONModel>this.getView().getModel('kewSearchResults');  //model attached to view, not component
		const oView = this.getView();
		const oTaxonToPlantAssigner = new TaxonToPlantAssigner(this.oComponent.getModel('plants'), this.oComponent.getModel('taxon'))

		const cbReceivingAdditionalSpeciesInformation: LAjaxLoadDetailsForSpeciesDoneCallback = (
			data: BResultsRetrieveTaxonDetailsRequest, sStatus: ResponseStatus, oResponse: JQueryXHR) => {
			Util.stopBusyDialog();
			MessageToast.show(data.message.message);
			MessageHandler.getInstance().addMessageFromBackend(data.message);
			oDialog.close();
			oTaxonToPlantAssigner.assignTaxonToPlant(this.mCurrentPlant.plant, data.taxon_data, data.botanical_name);

			// bind received taxon to view (otherwise applied upon switching plant in detail view)
			oView.bindElement({
				path: "/TaxaDict/" + data.taxon_data.id,
				model: "taxon"
			});
		}

		new SpeciesFinder(oModelKewSearchResults).loadDetailsForSpecies(oSelectedItem, sCustomName, this.mCurrentPlant.plant, cbReceivingAdditionalSpeciesInformation);
	}

	onFindSpeciesTableSelectedOrDataUpdated(oEvent: Event) {
		const oSelectedItem = <ColumnListItem>(<Table>this.byId('tableFindSpeciesResults')).getSelectedItem();
		const oText = <GenericTag>this.byId('textFindSpeciesAdditionalName');
		const oInputAdditionalName = <Input>this.byId('inputFindSpeciesAdditionalName');
		this.TaxonomyUtil.findSpeciesTableSelectedOrDataUpdated(oText, oInputAdditionalName, oSelectedItem);
	}

	onFindSpeciesAdditionalNameLiveChange(oEvent: Event) {
		this.TaxonomyUtil.findSpeciesAdditionalNameLiveChange(this.getView());
	}

	onDialogFindSpeciesBeforeOpen(oEvent: Event) {
		this.TaxonomyUtil.findSpeciesBeforeOpen(this.getView());
	}

	onShowMap(oEvent: Event) {
		// var oSource = evt.getSource();
		this.applyToFragment('dialogLeafletMap',
			(oDialog: Dialog) => oDialog.open());
	}
	onRefetchGbifImages(oEvent: Event) {
		const oTaxon = <BTaxon>(<Control>oEvent.getSource()).getBindingContext('taxon')!.getObject()
		if (!oTaxon.gbif_id)
			throw new Error('No gbif_id found for taxon ' + oTaxon.name);
		new OccurrenceImagesFetcher(this.oComponent.getModel('taxon')).fetchOccurrenceImages(oTaxon.gbif_id, this.mCurrentPlant.plant);
	}

	onCloseLeafletMap(oEvent: Event) {
		this.applyToFragment('dialogLeafletMap', (oDialog: Dialog) => oDialog.close());
	}

	afterCloseLeafletMap(oEvent: Event) {
		this.applyToFragment('dialogLeafletMap', (oDialog: Dialog) => oDialog.destroy());
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
	onEditPropertyValueDelete(oEvent: Event) {
		var oPropertiesModel = <JSONModel>this.oComponent.getModel('properties');
		const oPropertiesTaxaModel = <JSONModel>this.oComponent.getModel('propertiesTaxa');
		const oPropertiesBindingContext = <Context>(<Button>oEvent.getSource()).getBindingContext('properties');
		// this.propertiesUtil.editPropertyValueDelete(oPropertiesModel, oPropertiesTaxaModel, oPropertiesBindingContext, this.mCurrentPlant.plant)

		const oPropertyValueCRUD = new PropertyValueCRUD();
		oPropertyValueCRUD.editPropertyValueDelete(oPropertiesModel, oPropertiesTaxaModel, oPropertiesBindingContext, this.mCurrentPlant.plant);
	}

	onCloseDialogEditPropertyValue(evt: Event) {
		this.applyToFragment('dialogEditPropertyValue', (oPopover: Popover) => oPopover.close());
	}

	onAfterCloseAddPropertyNamePopover(evt: Event) {
		// when closing Add Properties Popover, make sure it is destroyed and reset the Add-Property Button from Emphasized to Default
		evt.getParameter('openBy').setType('Transparent');
		evt.getSource().destroy();
	}

	onAfterCloseNewPropertyNamePopover(evt: Event) {
		// when closing New Property Name Popover, make sure it is destroyed and reset the New-Property Button from Emphasized to Default
		evt.getParameter('openBy').setType('Transparent');
		evt.getSource().destroy();

		// this.propertiesUtil.closeNewPropertyNameDialog();
		// const oBtnNewPropertyName = <Button>this.byId("btnNewPropertyName");
		// oBtnNewPropertyName.setType('Transparent');
	}

	onOpenDialogAddProperty(oEvent: Event) {
		const oBtnAddProperty = <Button>oEvent.getSource();

		if (this.byId('dialogAddProperties')) {  // todo do this in corresponding events instead
			this.byId('dialogAddProperties').destroy();
		}
		const oPromiseFragmentLoaded = <Promise<Popover>>Fragment.load({
			name: 'plants.ui.view.fragments.properties.AvailableProperties',
			id: this.getView().getId(),
			controller: this
		});
		new AssignPropertyNamePopoverOpener().openPopupAddPropertyWhenPromiseResolved(oPromiseFragmentLoaded, this.mCurrentPlant.plant, oBtnAddProperty);
	}

	onAssignPropertyNameToPlantAndOrTaxon(oEvent: Event) {
		// this.propertiesUtil.assignPropertyNameToPlantAndOrTaxon(this.getView(), <Button>oEvent.getSource());

		const oBtn = <Button>oEvent.getSource();
		const oPropertyNamesModel = <JSONModel>this.getView().getModel('propertyNames');
		const oPlantPropertiesModel = <JSONModel>this.getView().getModel('properties');
		const oTaxonPropertiesModel = <JSONModel>this.getView().getModel('propertiesTaxa');
		const oPropertyNameCRUD = new PropertyNameCRUD(oPropertyNamesModel, oPlantPropertiesModel, oTaxonPropertiesModel)

		const aAvailablePropertiesFromDialog = <LTemporaryAvailableProperties[]>(<JSONModel>oBtn.getModel('propertiesCompare')).getData();

		// const oPropertiesInCategory = <FBPropertiesInCategory>oBtn.getBindingContext('properties')!.getObject()
		const oPropertiesInCategory = (<LPopoverWithPropertiesCategory>this.byId('dialogAddProperties')).property_category;
		// const iTaxonId = (<BPlant>oBtn.getBindingContext('plants')!.getObject()).taxon_id!;  // dialog wouldn't open at all if we had no taxon_id

		oPropertyNameCRUD.assignPropertyNameToPlantAndOrTaxon(this.mCurrentPlant.plant.taxon_id, aAvailablePropertiesFromDialog, oPropertiesInCategory);

		(<Popover>this.byId('dialogAddProperties')).close();
		(<Popover>this.byId('dialogAddProperties')).destroy();
	}

	onNewPropertyNameCreate(oEvent: Event) {
		// this.propertiesUtil.createNewPropertyName(oSourceControl, this.getView());

		var oSourceControl = <Input | Button>oEvent.getSource();
		// const oCategory = <FBPropertiesInCategory>oSourceControl.getBindingContext('properties')!.getObject();
		const oCategory = (<LPopoverWithPropertiesCategory>this.byId('dialogNewPropertyName')).property_category;
		const oPropertyNamesModel = <JSONModel>this.getView().getModel('propertyNames');
		const oPlantPropertiesModel = <JSONModel>this.getView().getModel('properties');
		const oTaxonPropertiesModel = <JSONModel>this.getView().getModel('propertiesTaxa');
		const sPropertyName = (<Input>this.byId('inpPropertyName')).getValue();
		const bAddToPlant = (<CheckBox>this.byId("chkNewPropertyNameAddToPlant")).getSelected();
		const bAddToTaxon = (<CheckBox>this.byId("chkNewPropertyNameAddToTaxon")).getSelected();

		const oPropertyNameCRUD = new PropertyNameCRUD(oPropertyNamesModel, oPlantPropertiesModel, oTaxonPropertiesModel)
		oPropertyNameCRUD.createNewPropertyName(sPropertyName, oCategory, this.mCurrentPlant.plant, bAddToPlant, bAddToTaxon);

		(<Popover>this.byId('dialogNewPropertyName')).close();
	}

	onOpenDialogNewProperty(oEvent: Event) {
		// const oPlant = <BPlant>this.getView().getBindingContext('plants')!.getObject()
		var oBtnNewProperty = <Button>oEvent.getSource();
		// this.propertiesUtil.openDialogNewProperty(oPlant, oSource);

		const oPromiseFragmentLoaded = <Promise<Popover>>Fragment.load({
			name: 'plants.ui.view.fragments.properties.NewPropertyName',
			id: this.getView().getId(),
			controller: this
		});
		new NewPropertyNamePopoverOpener().openPopupNewPropertyWhenPromiseResolved(oPromiseFragmentLoaded, this.mCurrentPlant.plant, oBtnNewProperty);

	}
	onEditPropertyValueTag(oEvent: Event) {
		// show fragment to edit or delete property value
		var oSource = <ObjectStatus>oEvent.getSource();
		var sPathPropertyValue = oSource.getBindingContext('properties')!.getPath();
		// var oModelSoils = this._getFragment('dialogEvent').getModel('soils');

		this.applyToFragment('dialogEditPropertyValue', (oPopover: Popover) => {
			// oPopover.setModel(oModelSoils, 'soils');
			oPopover.bindElement({
				path: sPathPropertyValue,
				model: "properties"
			});
			oPopover.openBy(oSource, true);
		});
	}

	//////////////////////////////////////////////////////////
	// Event Handlers
	//////////////////////////////////////////////////////////
	public activateRadioButton(oEvent: Event): void {
		const oSource = <Control>oEvent.getSource();
		const sRadioButtonId: string = oSource.data('radiobuttonId');
		const oRadioButton = <RadioButton>this.byId(sRadioButtonId);
		oRadioButton.setSelected(true);
	}

	onSoilMixSelect(oEvent: Event) {
		// transfer selected soil from soils model to new/edit-event model (which has only one entry)
		const oSource = <List>oEvent.getSource()
		const oContexts = <Context[]>oSource.getSelectedContexts();
		if (oContexts.length !== 1) {
			MessageToast.show('No or more than one soil selected');
			throw new Error('No or more than one soil selected');
		}
		var oSelectedSoil = <FBSoil>oContexts[0].getObject();
		this.applyToFragment('dialogEvent', (oDialog: Dialog) => {
			const oModelNewEvent = <JSONModel>oDialog.getModel("editOrNewEvent");
			const oSelectedDataNew = Util.getClonedObject(oSelectedSoil);
			oModelNewEvent.setProperty('/soil', oSelectedDataNew);
		});
	}

	onOpenDialogAddEvent(oEvent: Event) {
		this.applyToFragment('dialogEvent', (oDialog: Dialog) => {
			// get soils collection from backend proposals resource
			this.eventCRUD._loadSoils(this.getView());

			// if dialog was used for editing an event before, then destroy it first
			if (!!oDialog.getModel("editOrNewEvent") && oDialog.getModel("editOrNewEvent").getProperty('/mode') !== 'new') {
				oDialog.getModel("editOrNewEvent").destroy();
				oDialog.setModel(null, "editOrNewEvent");

				// set header and button to add instead of edit
				const oI18Model = <ResourceModel>this.getView().getModel("i18n");
				const oResourceBundle = <ResourceBundle>oI18Model.getResourceBundle();
				oDialog.setTitle(oResourceBundle.getText("header_event"));
				const oBtnSave = <Button>this.getView().byId('btnEventUpdateSave');
				oBtnSave.setText('Add');
			}

			// set defaults for new event
			if (!oDialog.getModel("editOrNewEvent")) {
				let mEventEditData: EventEditData = this.eventCRUD.getInitialEvent(this.mCurrentPlant.plant.id!);
				mEventEditData.mode = 'new';
				const oEventEditModel = new JSONModel(mEventEditData);
				oDialog.setModel(oEventEditModel, "editOrNewEvent");
			}

			this.getView().addDependent(oDialog);
			oDialog.open();
		})
	}

	onEditEvent(oEvent: Event) {
		// triggered by edit button in a custom list item header in events list
		const oSource = <Button>oEvent.getSource();
		const oSelectedEvent = <FBEvent>oSource.getBindingContext('events')!.getObject();
		// this.eventCRUD.editEvent(oSelectedEvent, this.getView(), this.mCurrentPlant.plant.id!);
		this.applyToFragment('dialogEvent', this.eventCRUD.initEditSelectedEvent.bind(this, oSelectedEvent, this.getView(), this.mCurrentPlant.plant.id));
	}
	onOpenDialogEditSoil(oEvent: Event) {
		const oSource = <Button>oEvent.getSource();
		const oSoil = <FBSoil>oSource.getBindingContext('soils')!.getObject();
		// this.eventCRUD.openDialogEditSoil(this.getView(), oSoil);

		const oPromiseFragmentLoaded = <Promise<Dialog>>Fragment.load({
			name: 'plants.ui.view.fragments.events.EditSoil',
			id: this.getView().getId(),
			controller: this
		});
		new SoilDialogHandler().openDialogEditSoilWhenPromiseResolved(oSoil, oPromiseFragmentLoaded, this.getView());
	}
	onOpenDialogNewSoil(oEvent: Event) {
		// we need to load the fragment in the controller to connect the fragment's events to the controller
		// the dialog is always destroyed upon closing, so we don't need to check for existence
		const oPromiseFragmentLoaded = <Promise<Dialog>>Fragment.load({
			name: 'plants.ui.view.fragments.events.EditSoil',
			id: this.getView().getId(),
			controller: this
		});
		new SoilDialogHandler().openDialogNewSoilWhenPromiseResolved(oPromiseFragmentLoaded, this.getView());

	}

	onAddOrEditEvent(oEvent: Event) {
		//Triggered by 'Add' / 'Update' Button in Create/Edit Event Dialog
		this.eventCRUD.addOrEditEvent(this.getView(), this.mCurrentPlant.plant);
	}
	onUpdateOrCreateSoil(oEvent: Event) {
		const oEditedSoil = <SoilEditData>(<Button>oEvent.getSource()).getBindingContext('editedSoil')!.getObject();
		const oSoilsModel = <JSONModel>this.byId('dialogEvent').getModel('soils');
		// this.eventCRUD.updateOrCreateSoil(oEditedSoil, oSoilsModel);

		const oDialogEditSoil = <Dialog>this.byId('dialogEditSoil');
		const oSoilCRUD = new SoilCRUD(oSoilsModel);
		oSoilCRUD.updateOrCreateSoil(oEditedSoil, oDialogEditSoil);


	}
	onCancelEditSoil(oEvent: Event) {
		this.applyToFragment('dialogEditSoil', (oDialog: Dialog) => oDialog.close(),);
	}
	onDeleteEventsTableRow(oEvent: Event) {
		const oSelectedEvent = <FBEvent>oEvent.getParameter('listItem').getBindingContext('events').getObject();
		const oEventsModel = <JSONModel>this.oComponent.getModel('events');
		this.eventCRUD.deleteEventsTableRow(oSelectedEvent, oEventsModel, this.mCurrentPlant.plant)

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
		// generate dialog from fragment if not already instantiated		
		this.applyToFragment('dialogAssignEventToImage', (oPopover: Popover) => {
			// bind the selected image's path in images model to the popover dialog
			oPopover.bindElement({
				path: sPathCurrentImage,
				model: "images"
			});
			oPopover.openBy(oSource, true);
		});
	}

	onSelectEventForImage(oEvent: Event) {
		// triggered upon selection of event in event selection dialog for an image get selected event
		const oSource = <GridListItem>oEvent.getSource();
		const oEventsModel = <JSONModel>this.getView().getModel('events');
		const oImage = <FBImage>oSource.getBindingContext('images')!.getObject();
		const oSelectedEvent = <FBEvent>oSource.getBindingContext('events')!.getObject();
		new ImageToEventAssigner().assignImageToEvent(oImage, oSelectedEvent, oEventsModel);
		(<Popover>this.byId('dialogAssignEventToImage')).close();
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