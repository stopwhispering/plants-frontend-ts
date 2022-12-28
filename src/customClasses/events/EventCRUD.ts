import * as Util from "plants/ui/customClasses/shared/Util";
import MessageToast from "sap/m/MessageToast"
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import View from "sap/ui/core/mvc/View";
import Dialog from "sap/m/Dialog";
import Button from "sap/m/Button";
import {
	EventEditData, EventEditDataSegments, EventInEventsModel, InitialSoil
} from "plants/ui/definitions/EventsLocal";
import { FBPot,  FBEvent, FBObservation, FBSoil } from "plants/ui/definitions/Events";
import RadioButton from "sap/m/RadioButton";
import { BPlant } from "plants/ui/definitions/Plants";
import { LSuggestions } from "plants/ui/definitions/PlantsLocal";
import { FBImage } from "plants/ui/definitions/Images";

/**
 * @namespace plants.ui.customClasses.events
 */
// export default class EventUtil extends ManagedObject {
export default class EventCRUD extends ManagedObject {
	private static _instance: EventCRUD;
	private applyToFragment: Function;
	private oSuggestionsData;

	public static getInstance(applyToFragment?: Function, oSuggestionsData?: LSuggestions): EventCRUD {

		// todo really singleton??
		if (!EventCRUD._instance && applyToFragment && oSuggestionsData) {
			EventCRUD._instance = new EventCRUD(applyToFragment, oSuggestionsData);
		}
		return EventCRUD._instance;
	}

	private constructor(applyToFragment: Function, oSuggestionsData: LSuggestions) {
		super();
		this.applyToFragment = applyToFragment;
		this.oSuggestionsData = oSuggestionsData;
	}

	deleteEventsTableRow(oSelectedEvent: FBEvent, oEventsModel: JSONModel, oCurrentPlant: BPlant) {
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

	private _getObservationData(oEventEditData: EventEditData): FBObservation|null {
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
		return <FBObservation>oObservationDataClone;
	}
	
	private _getPotData(oEventEditData: EventEditData, oView: View): FBPot|null {
		//loads, parses, and cleanses the pot data from the the dialog control
		if (!oEventEditData.segments.pot)
			return null;
		const oPotDataClone = <FBPot>JSON.parse(JSON.stringify(oEventEditData.pot));

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

	private _getSoilData(oEventEditData: EventEditData, oView: View): FBSoil|null {
		//loads, parses, and cleanses the soil data from the the dialog control
		//note: we submit the whole soil object to the backend, but the backend does only care about the id
		//      for modifying or creating a soil, there's a separate service
		//      however, we parse the whole object here to make sure we have the correct data
		if (!oEventEditData.segments.soil)
			return null;
		
		const oSoilDataClone = <FBSoil>JSON.parse(JSON.stringify(oEventEditData.soil));
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
		const oNewObservation = <FBObservation | undefined>this._getObservationData(oNewEventSave);
		const oNewPot = <FBPot | undefined>this._getPotData(oNewEventSave, oView);
		const oNewSoil = <FBSoil | undefined>this._getSoilData(oNewEventSave, oView);

		const oNewEvent: EventInEventsModel = {
			// id: number; no id, yet
			date: oNewEventSave.date,
			event_notes: <string|undefined>(oNewEventSave.event_notes && oNewEventSave.event_notes.length > 0 ? oNewEventSave.event_notes.trim() : undefined),
			observation: oNewObservation,
			pot: oNewPot,
			soil: oNewSoil,
			plant_id: oNewEventSave.plant_id,
			images: <FBImage[]>[]
		}

		// actual saving is done upon hitting save button
		// here, we only update the events model
		aEventsCurrentPlant.push(oNewEvent);
		oEventsModel.updateBindings(false);
		oDialog.close();
	}

	private _assertNoDuplicateOnDate(aEventsCurrentPlant: EventInEventsModel[], sDate: string, oEvent?: FBEvent): void {
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

	private _editEvent(oView: View, oEventsModel: JSONModel, aEventsCurrentPlant: FBEvent[]): void {
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
		const oOldEvent: FBEvent = oEventEditData.oldEvent;

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
		const oEditedObservation = <FBObservation>this._getObservationData(oEventEditData);
		const oEditedPot = <FBPot>this._getPotData(oEventEditData, oView);
		const oEditedSoil = <FBSoil>this._getSoilData(oEventEditData, oView);

		// update each attribute from the new model into the old event
		oOldEvent.date = <string>oEventEditData.date;
		oOldEvent.event_notes = <string|undefined>(oEventEditData.event_notes && oEventEditData.event_notes.length > 0 ? oEventEditData.event_notes.trim() : undefined);
		
		const iOldObservationId = oEditedObservation ? <int|undefined>oEditedObservation.id: undefined;
		oOldEvent.observation = <FBObservation>oEditedObservation;
		if (oOldEvent.observation)
			oOldEvent.observation.id = <int|undefined>iOldObservationId;

		oOldEvent.pot = <FBPot|undefined>oEditedPot;
		oOldEvent.soil = <FBSoil|undefined>oEditedSoil;

		// have events factory function in details controller regenerate the events list
		oEventsModel.updateBindings(false);  // we updated a proprety of that model
		oEventsModel.refresh(true);
		oDialog.close();
	}

	addOrEditEvent(oView: View, oCurrentPlant: BPlant) {
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

	public editEvent(oSelectedEvent: FBEvent, oView: View, iCurrentPlantId: int) {
		this.applyToFragment('dialogEvent', this._initEditSelectedEvent.bind(this, oSelectedEvent, oView, iCurrentPlantId));
	}

	private _initEditSelectedEvent(oSelectedEvent: FBEvent, oView: View, iCurrentPlantId: int, oDialog: Dialog) {
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
		const oPot = <FBPot>{
			'diameter_width': 4,
			'material': this.oSuggestionsData['potMaterialCollection'][0].name
		};

		const oObservation = <FBObservation>{
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
}