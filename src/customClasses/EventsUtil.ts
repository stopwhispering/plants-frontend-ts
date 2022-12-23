import * as Util from "plants/ui/customClasses/Util";
import MessageToast from "sap/m/MessageToast"
import JSONModel from "sap/ui/model/json/JSONModel"
import Grid from "sap/ui/layout/Grid"
import GridData from "sap/ui/layout/GridData"
import CustomListItem from "sap/m/CustomListItem"
import ManagedObject from "sap/ui/base/ManagedObject"
import View from "sap/ui/core/mvc/View";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import {
	EventEditData, EventEditDataSegments, EventInEventsModel, InitialSoil, SoilEditData
} from "../definitions/EventsLocal";
import { PRPot,  PEvent, PRObservation, PResultsUpdateCreateSoil, PRSoil, PEvents, } from "../definitions/EventsFromBackend";
import RadioButton from "sap/m/RadioButton";
import ModelsHelper from "../model/ModelsHelper";
import { PPlant } from "../definitions/PlantsFromBackend";
import { LSuggestions } from "../definitions/PlantsLocal";
import Context from "sap/ui/model/Context";
import Controller from "sap/ui/core/mvc/Controller";
import VBox from "sap/m/VBox";
import GridListItem from "sap/f/GridListItem";
import GridList from "sap/f/GridList";
import { PImage } from "../definitions/ImageFromBackend";

/**
 * @namespace plants.ui.customClasses
 */
export default class EventsUtil extends ManagedObject {
	private static _instance: EventsUtil;
	private applyToFragment: Function;
	private oSuggestionsData;
	private modelsHelper: ModelsHelper

	public static getInstance(applyToFragment?: Function, oSuggestionsData?: LSuggestions): EventsUtil {
		if (!EventsUtil._instance && applyToFragment && oSuggestionsData) {
			EventsUtil._instance = new EventsUtil(applyToFragment, oSuggestionsData);
		}
		return EventsUtil._instance;
	}

	private constructor(applyToFragment: Function, oSuggestionsData: LSuggestions) {
		super();
		this.modelsHelper = ModelsHelper.getInstance();
		this.applyToFragment = applyToFragment;
		this.oSuggestionsData = oSuggestionsData;
	}

	eventsListFactory(sId: string, oBindingContext: Context) {
		//executed in Detail Controller Context
		let that: Controller = this as unknown as Controller

		var sContextPath = oBindingContext.getPath();
		var oEvent = <PEvent>oBindingContext.getObject();
		var oListItem = new CustomListItem({});
		oListItem.addStyleClass('sapUiTinyMarginBottom');
		var oGrid = new Grid({
			defaultSpan: "XL3 L3 M6 S12"
		});
		oListItem.addContent(oGrid);

		var oFragmentHeader = <VBox>that.byId("eventHeader").clone(sId);
		oGrid.addContent(oFragmentHeader);

		if (!!oEvent.observation) {
			var oContainerObservation = <VBox>that.byId("eventObservation").clone(sId);
			oGrid.addContent(oContainerObservation);
		}

		if (!!oEvent.pot) {
			var oContainerPot = <VBox>that.byId("eventPot").clone(sId);
			oGrid.addContent(oContainerPot);
		}

		if (!!oEvent.soil) {
			var oContainerSoil = that.byId("eventSoil").clone(sId);
			oGrid.addContent(<VBox>oContainerSoil);
		}

		// we want the images item to get the rest of the row or the whole next row if current row is almost full 
		// calculate number of cols in grid layout for images container in screen sizes xl/l
		// todo: switch from grid layout to the new (with 1.60) gridlist, where the following is probably
		// not required
		var iCols = (oGrid.getContent().length * 3) - 1;
		if ((12 - iCols) < 3) {
			var sColsImageContainerL = "XL12 L12";
		} else {
			sColsImageContainerL = "XL" + (12 - iCols) + " L" + (12 - iCols);
		}
		var sColsContainer = sColsImageContainerL + " M6 S12";

		var oContainerOneImage = <GridListItem>that.byId("eventImageListItem").clone(sId);

		// add items aggregation binding
		var oContainerImages = <GridList>that.byId("eventImageContainer").clone(sId);
		oContainerImages.bindAggregation('items',
			{
				path: "events>" + sContextPath + "/images",
				template: oContainerOneImage,
				templateShareable: false
			});

		// add layoutData aggregation binding to set number of columns in outer grid
		oContainerImages.setLayoutData(new GridData({ span: sColsContainer }));
		oGrid.addContent(oContainerImages);

		return oListItem;
	}

	deleteEventsTableRow(oSelectedEvent: PEvent, oEventsModel: JSONModel, oCurrentPlant: PPlant) {
		// deleting row from events table

		var aEvents = oEventsModel.getProperty('/PlantsEventsDict/' + oCurrentPlant.id);

		// delete the item from array
		var iIndex = aEvents.indexOf(oSelectedEvent);
		if (iIndex < 0) {
			MessageToast.show('An error happended in internal processing of deletion.');
			return;
		}
		aEvents.splice(iIndex, 1);
		oEventsModel.refresh();
	}

	private _getObservationData(oEventEditData: EventEditData): PRObservation|null {
		//returns the cleansed observation data from the event edit data
		if (!oEventEditData.segments.observation)
			return null;

		const oObservationDataClone = JSON.parse(JSON.stringify(oEventEditData.observation));
		// if height or diameter are 0, reset them to undefined
		if (oObservationDataClone.height === 0.0) {
			oObservationDataClone.height = undefined;
		}
		if (oObservationDataClone.stem_max_diameter === 0.0) {
			oObservationDataClone.stem_max_diameter = undefined;
		}
		if (!oObservationDataClone.diseases || oObservationDataClone.diseases.length === 0) {
			oObservationDataClone.diseases = undefined;
		}
		if (!oObservationDataClone.observation_notes || oObservationDataClone.observation_notes === 0) {
			oObservationDataClone.observation_notes = undefined;
		} else {
			oObservationDataClone.observation_notes = oObservationDataClone.observation_notes.trim();
		}
		return <PRObservation>oObservationDataClone;
	}
	
	private _getPotData(oEventEditData: EventEditData, oView: View): PRPot|null {
		//loads, parses, and cleanses the pot data from the the dialog control
		if (!oEventEditData.segments.pot)
			return null;
		const oPotDataClone = <PRPot>JSON.parse(JSON.stringify(oEventEditData.pot));

		if ((<RadioButton>oView.byId('idPotHeight0')).getSelected()) {
			oPotDataClone.shape_side = 'very flat';
		} else if ((<RadioButton>oView.byId('idPotHeight1')).getSelected()) {
			oPotDataClone.shape_side = 'flat';
		} else if ((<RadioButton>oView.byId('idPotHeight2')).getSelected()) {
			oPotDataClone.shape_side = 'high';
		} else if ((<RadioButton>oView.byId('idPotHeight3')).getSelected()) {
			oPotDataClone.shape_side = 'very high';
		} else {
			throw new Error('Pot height not selected');
		}

		if ((<RadioButton>oView.byId('idPotShape0')).getSelected()) {
			oPotDataClone.shape_top = 'square';
		} else if ((<RadioButton>oView.byId('idPotShape1')).getSelected()) {
			oPotDataClone.shape_top = 'round';
		} else if ((<RadioButton>oView.byId('idPotShape2')).getSelected()) {
			oPotDataClone.shape_top = 'oval';
		} else if ((<RadioButton>oView.byId('idPotShape3')).getSelected()) {
			oPotDataClone.shape_top = 'hexagonal';
		} else {
			throw new Error('Pot shape not selected');
		}

		return oPotDataClone;
	}

	private _getSoilData(oEventEditData: EventEditData, oView: View): PRSoil|null {
		//loads, parses, and cleanses the soil data from the the dialog control
		//note: we submit the whole soil object to the backend, but the backend does only care about the id
		//      for modifying or creating a soil, there's a separate service
		//      however, we parse the whole object here to make sure we have the correct data
		if (!oEventEditData.segments.soil)
			return null;
		
		const oSoilDataClone = <PRSoil>JSON.parse(JSON.stringify(oEventEditData.soil));
		if (!oSoilDataClone.description || oSoilDataClone.description.length == 0) {
			oSoilDataClone.description = undefined;
		}
		return oSoilDataClone;
	}

	public _loadSoils(oView: View) {
		// triggered when opening dialog to add/edit event
		// get soils collection from backend proposals resource
		var sUrl = Util.getServiceUrl('events/soils');
		let oSoilsModel = <JSONModel>oView.getModel('soils');
		if (!oSoilsModel) {
			oSoilsModel = new JSONModel(sUrl);
			oView.setModel(oSoilsModel, 'soils');
		} else {
			oSoilsModel.loadData(sUrl);
		}
	}

	//triggered by addOrEditEvent
	private _addEvent(oView: View, oEventsModel: JSONModel, aEventsCurrentPlant: EventInEventsModel[]) {
		//triggered by add button in add/edit event dialog
		//validates and filters data to be saved

		// get new event data
		const oDialog = <Dialog>oView.byId('dialogEvent');
		const oNewEventModel = <JSONModel>oDialog.getModel("editOrNewEvent");
		const oNewEventData = <EventEditData>oNewEventModel.getData();

		// assert date matches pattern "YYYY-MM-DD"
		Util.assertCorrectDate(oNewEventData.date);
		this._assertNoDuplicateOnDate(aEventsCurrentPlant, oNewEventData.date);

		// clone the data so we won't change the original new model
		const oNewEventSave = <EventEditData>Util.getClonedObject(oNewEventData);

		if (oNewEventSave.segments.soil && (!oNewEventSave.soil || !oNewEventSave.soil.id)){
			MessageToast.show('Please choose soil first.');
			return;
		}

		// get the data in the dialog's segments
		const oNewObservation = <PRObservation | undefined>this._getObservationData(oNewEventSave);
		const oNewPot = <PRPot | undefined>this._getPotData(oNewEventSave, oView);
		const oNewSoil = <PRSoil | undefined>this._getSoilData(oNewEventSave, oView);

		const oNewEvent: EventInEventsModel = {
			// id: number; no id, yet
			date: oNewEventSave.date,
			event_notes: <string|undefined>(oNewEventSave.event_notes && oNewEventSave.event_notes.length > 0 ? oNewEventSave.event_notes.trim() : undefined),
			observation: oNewObservation,
			pot: oNewPot,
			soil: oNewSoil,
			plant_id: oNewEventSave.plant_id,
			images: <PImage[]>[]
		}

		// actual saving is done upon hitting save button
		// here, we only update the events model
		aEventsCurrentPlant.push(oNewEvent);
		oEventsModel.updateBindings(false);
		oDialog.close();
	}

	private _assertNoDuplicateOnDate(aEventsCurrentPlant: EventInEventsModel[], sDate: string, oEvent?: PEvent) {
		// make sure there's only one event per day and plant (otherwise backend problems would occur)
		// if new event data is supplied, we're editing an event and need to make sure we're not comparing the event to itself
		const found = aEventsCurrentPlant.find(function (element) {
			return (element.date === sDate && element !== oEvent);
		});
		if (!!found) {
			MessageToast.show('Duplicate event on that date.');
			throw new Error('Duplicate event on that date.');
		}
	}

	private _editEvent(oView: View, oEventsModel: JSONModel, aEventsCurrentPlant: PEvent[]): void {
		//triggered by addOrEditEvent
		//triggered by button in add/edit event dialog
		//validates and filters data to be saved and triggers saving

		// get new event data
		const oDialog = <Dialog>oView.byId('dialogEvent');
		const oEditEventModel = <JSONModel>oDialog.getModel("editOrNewEvent");
		const oEventEditData = <EventEditData>oEditEventModel.getData();

		// old record (which we are updating as it is a pointer to the events model itself) is hidden as a property in the new model
		if (!oEventEditData.oldEvent) {
			MessageToast.show("Can't determine old record. Aborting.");
			return;
		}
		const oOldEvent: PEvent = oEventEditData.oldEvent;

		// assert date matches pattern "YYYY-MM-DD"
		Util.assertCorrectDate(oEventEditData.date);
		this._assertNoDuplicateOnDate(aEventsCurrentPlant, oEventEditData.date, oOldEvent);

		if (oOldEvent.plant_id !== oEventEditData.plant_id) {
			MessageToast.show('Plant ID cannot be changed.');
			throw new Error('Plant ID cannot be changed.');
		}

		if (oEventEditData.segments.soil && (!oEventEditData.soil || !oEventEditData.soil.id)){
			MessageToast.show('Please choose soil first.');
			return;
		}

		// get the data in the dialog's segments
		const oEditedObservation = <PRObservation>this._getObservationData(oEventEditData);
		const oEditedPot = <PRPot>this._getPotData(oEventEditData, oView);
		const oEditedSoil = <PRSoil>this._getSoilData(oEventEditData, oView);

		// update each attribute from the new model into the old event
		oOldEvent.date = <string>oEventEditData.date;
		oOldEvent.event_notes = <string|undefined>(oEventEditData.event_notes && oEventEditData.event_notes.length > 0 ? oEventEditData.event_notes.trim() : undefined);
		
		const iOldObservationId = oEditedObservation ? <int|undefined>oEditedObservation.id: undefined;
		oOldEvent.observation = <PRObservation>oEditedObservation;
		if (oOldEvent.observation)
			oOldEvent.observation.id = <int|undefined>iOldObservationId;

		oOldEvent.pot = <PRPot|undefined>oEditedPot;
		oOldEvent.soil = <PRSoil|undefined>oEditedSoil;

		// have events factory function in details controller regenerate the events list
		oEventsModel.updateBindings(false);  // we updated a proprety of that model
		oEventsModel.refresh(true);
		oDialog.close();
	}

	addOrEditEvent(oView: View, oCurrentPlant: PPlant) {
		var oDialog = oView.byId('dialogEvent');
		var oNewEventModel = <JSONModel>oDialog.getModel("editOrNewEvent");
		var dDataNew = <EventEditData>oNewEventModel.getData();
		var sMode = dDataNew.mode; //edit or new

		var oEventsModel = <JSONModel>oView.getModel('events');
		var sPathEventsModel = '/PlantsEventsDict/' + oCurrentPlant.id + '/';
		var aEventsCurrentPlant = oEventsModel.getProperty(sPathEventsModel);

		if (sMode === 'edit') {
			this._editEvent(oView, oEventsModel, aEventsCurrentPlant);
		} else {  //'new'
			this._addEvent(oView, oEventsModel, aEventsCurrentPlant);
		}
	}

	public editEvent(oSelectedEvent: PEvent, oView: View, iCurrentPlantId: int) {
		this.applyToFragment('dialogEvent', this._initEditSelectedEvent.bind(this, oSelectedEvent, oView, iCurrentPlantId));
	}

	private _initEditSelectedEvent(oSelectedEvent: PEvent, oView: View, iCurrentPlantId: int, oDialog: Dialog) {
		// get soils collection from backend proposals resource
		this._loadSoils(oView);

		// update dialog title and save/update button
		oDialog.setTitle('Edit Event (' + oSelectedEvent.date + ')');
		(<Button>oView.byId('btnEventUpdateSave')).setText('Update');

		// there is some logic involved in mapping the dialog controls and the events model, additionally
		// we don't want to update the events model entity immediately from the dialog but only upon
		// hitting update button, therefore we generate a edit model, fill it with our event's data,
		// and, upon hitting update button, do it the other way around
		var dEventEdit: EventEditData = this._getInitialEvent(iCurrentPlantId);
		dEventEdit.mode = 'edit';
		dEventEdit.date = oSelectedEvent.date;
		dEventEdit.event_notes = oSelectedEvent.event_notes;

		// we need to remember the old record
		dEventEdit.oldEvent = oSelectedEvent;
		if (oSelectedEvent.pot && oSelectedEvent.pot.id) {
			dEventEdit.pot!.id = oSelectedEvent.pot.id;
		}
		if (oSelectedEvent.observation && oSelectedEvent.observation.id) {
			dEventEdit.observation!.id = oSelectedEvent.observation.id;
		}

		// observation segment
		if (!!oSelectedEvent.observation) {
			// activate observation tab if there is an observation
			dEventEdit.segments.observation = true;
			dEventEdit.observation!.diseases = oSelectedEvent.observation.diseases;
			dEventEdit.observation!.height = oSelectedEvent.observation.height;
			dEventEdit.observation!.observation_notes = oSelectedEvent.observation.observation_notes;
			dEventEdit.observation!.stem_max_diameter = oSelectedEvent.observation.stem_max_diameter;
		} else {
			dEventEdit.segments.observation = false;
		}

		// pot segment
		if (!!oSelectedEvent.pot) {
			dEventEdit.segments.pot = true;
			dEventEdit.pot!.diameter_width = oSelectedEvent.pot.diameter_width;
			dEventEdit.pot!.material = oSelectedEvent.pot.material;
			// the shape attributes are not set via model
			switch (oSelectedEvent.pot.shape_side) {
				case 'very flat':
					(<RadioButton>oView.byId('idPotHeight0')).setSelected(true); break;
				case 'flat':
					(<RadioButton>oView.byId('idPotHeight1')).setSelected(true); break;
				case 'high':
					(<RadioButton>oView.byId('idPotHeight2')).setSelected(true); break;
				case 'very high':
					(<RadioButton>oView.byId('idPotHeight3')).setSelected(true); break;
			}

			switch (oSelectedEvent.pot.shape_top) {
				case 'square':
					(<RadioButton>oView.byId('idPotShape0')).setSelected(true); break;
				case 'round':
					(<RadioButton>oView.byId('idPotShape1')).setSelected(true); break;
				case 'oval':
					(<RadioButton>oView.byId('idPotShape2')).setSelected(true); break;
				case 'hexagonal':
					(<RadioButton>oView.byId('idPotShape3')).setSelected(true); break;
			}
		} else {
			dEventEdit.segments.pot = false;
		}

		// soil segment
		if (!!oSelectedEvent.soil) {
			dEventEdit.segments.soil = true;
			dEventEdit.soil = Util.getClonedObject(oSelectedEvent.soil);
		} else {
			dEventEdit.segments.soil = false;
		}

		// set model and open dialog
		if (oDialog.getModel("editOrNewEvent")) {
			oDialog.getModel("editOrNewEvent").destroy();
		}
		var oModel = new JSONModel(dEventEdit);
		oDialog.setModel(oModel, "editOrNewEvent");
		oDialog.open();
	}

	public _getInitialEvent(iCurrentPlantId: int): EventEditData {
		// create initial data for the Create/Edit Event Dialog (we don't use the 
		// actual data there in case of editing an event)
		// called by both function to add and to edit event
		const oPot = <PRPot>{
			'diameter_width': 4,
			'material': this.oSuggestionsData['potMaterialCollection'][0].name
		};

		const oObservation = <PRObservation>{
			'height': 0,
			'stem_max_diameter': 0,
			'diseases': '',
			'observation_notes': ''
		}

		const oSoil: InitialSoil = {
			id: undefined,
			soil_name: undefined,
			mix: undefined,
			description: undefined,
		}

		const oEventEditDataSegments = <EventEditDataSegments>{
			// defaults to inactive segments
			observation: false,
			pot: false,
			soil: false,
		}

		const oEventEditData = <EventEditData>{
			plant_id: iCurrentPlantId, 
			date: Util.getToday(),
			event_notes: '',
			pot: oPot,
			observation: oObservation,
			soil: oSoil,
			segments: oEventEditDataSegments,
			mode: "new",  // will be overwritten in case of editing
		};		
		return oEventEditData;
	}

	openDialogEditSoil(oView: View, oSoil: PRSoil): void {
		var dEditedSoil = <SoilEditData>{
			dialog_title: 'Edit Soil (ID ' + oSoil.id + ')',
			btn_text: 'Update',
			new: false,
			id: oSoil.id,
			soil_name: oSoil.soil_name,
			description: oSoil.description,
			mix: oSoil.mix
		}
		var oEditedSoilModel = new JSONModel(dEditedSoil);

		this.applyToFragment('dialogEditSoil', (oDialog: Dialog) => {
			oDialog.setModel(oEditedSoilModel, 'editedSoil');
			oDialog.bindElement({
				path: '/',
				model: "editedSoil"
			});
			oView.addDependent(oDialog);
			oDialog.open();
		});
	}

	openDialogNewSoil(oView: View): void {
		var dNewSoil = <SoilEditData>{
			dialog_title: 'New Soil',
			btn_text: 'Create',
			new: true,
			id: undefined,
			soil_name: '',
			description: '',
			mix: ''
		}
		var oNewSoilModel = new JSONModel(dNewSoil);

		this.applyToFragment('dialogEditSoil', (oDialog: Dialog) => {
			oDialog.setModel(oNewSoilModel, 'editedSoil');
			oDialog.bindElement({
				path: '/',
				model: "editedSoil"
			});
			oView.addDependent(oDialog);
			oDialog.open();
		});
	}

	private _saveNewSoil(oNewSoil: SoilEditData, oSoilsModel: JSONModel): void {

		// check if there's already a same-named soil
		var aSoils = <PRSoil[]>oSoilsModel.getData().SoilsCollection;
		var existing_soil_found = aSoils.find(function (element) {
			return element.soil_name === oNewSoil.soil_name;
		});
		if (existing_soil_found) {
			MessageToast.show("Soil name already exists.")
			return;
		}

		var newSoil = {
			id: undefined,
			soil_name: oNewSoil.soil_name,
			description: oNewSoil.description,
			mix: oNewSoil.mix
		}

		Util.startBusyDialog('Saving new soil...');
		$.ajax({
			url: Util.getServiceUrl('events/soils'),
			type: 'POST',
			contentType: "application/json",
			data: JSON.stringify(newSoil),
			context: this
		})
			.done(this._cbSavedNewSoil.bind(this, oSoilsModel))
			.fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Save New Soil'));
	}

	private _updateExistingSoil(oSoilData: SoilEditData, oSoilsModel: JSONModel) {
		var updatedSoil = {
			id: oSoilData.id,
			soil_name: oSoilData.soil_name,
			description: oSoilData.description,
			mix: oSoilData.mix
		}

		Util.startBusyDialog('Saving updated soil...');
		$.ajax({
			url: Util.getServiceUrl('events/soils'),
			type: 'PUT',
			contentType: "application/json",
			data: JSON.stringify(updatedSoil),
			context: this
		})
			.done(this._cbUpdatedExistingSoil.bind(this, oSoilsModel))
			.fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Save New Soil'));
	}

	public updateOrCreateSoil(oEditedSoil: SoilEditData, oSoilsModel: JSONModel) {
		//make sure soil has a name and a mix
		if (oEditedSoil.soil_name === "" || oEditedSoil.mix === "") {
			MessageToast.show('Enter soil mix name and mix ingredients.');
			return;
		}

		// new soil
		if (oEditedSoil.new) {
			if (oEditedSoil.id) {
				MessageToast.show("Unexpected ID found.")
				return;
			}
			// _cbSavedNewSoil will be called asynchronously, closing dialogue
			this._saveNewSoil(oEditedSoil, oSoilsModel);

			// update existing soil
		} else {
			// _cbUpdatedExistingSoil will be called asynchronously, closing dialogue
			this._updateExistingSoil(oEditedSoil, oSoilsModel);
		}
	}

	private _cbUpdatedExistingSoil(oSoilsModel: JSONModel, data: PResultsUpdateCreateSoil) {
		// callback for request updating existing soil 
		if (!data.soil.id) {
			MessageToast.show("Unexpected backend error - No Soil ID")
			return;
		}

		var aSoils = <PRSoil[]>oSoilsModel.getData().SoilsCollection;
		var oSOil = aSoils.find(function (element) {
			return element.id === data.soil.id;
		});
		if (!oSOil) {
			MessageToast.show("Updated soil not found in Model")
			return;
		}

		oSOil.soil_name = data.soil.soil_name
		oSOil.description = data.soil.description
		oSOil.mix = data.soil.mix

		oSoilsModel.updateBindings(false);

		// busy dialog was started before ajax call
		Util.stopBusyDialog();
		this.applyToFragment('dialogEditSoil', (oDialog: Dialog) => oDialog.close(),);

		// todo also update in current plant events list (currently requires a reload)
	}

	private _cbSavedNewSoil(oSoilsModel: JSONModel, data: PResultsUpdateCreateSoil) {
		// callback for request saving new soil 
		if (!data.soil.id) {
			MessageToast.show("Unexpected backend error - No Soil ID")
			return;
		}

		var aSoils = oSoilsModel.getData().SoilsCollection;
		var oNewSoil = {
			id: data.soil.id,
			soil_name: data.soil.soil_name,
			description: data.soil.description,
			mix: data.soil.mix
		}
		aSoils.push(oNewSoil);
		oSoilsModel.updateBindings(false);

		// busy dialog was started before ajax call
		Util.stopBusyDialog();
		this.applyToFragment('dialogEditSoil', (oDialog: Dialog) => oDialog.close(),);
	}

}