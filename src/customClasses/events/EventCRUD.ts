import Util from "plants/ui/customClasses/shared/Util";
import MessageToast from "sap/m/MessageToast"
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import View from "sap/ui/core/mvc/View";
import {
	LEventEditData, LEventEditDataSegments, LEventInEventsModel, LInitialSoil, LPotHeightOptions, LPotShapeOptions
} from "plants/ui/definitions/EventsLocal";
import { FBPot, FBEvent, FBObservation, FBSoil } from "plants/ui/definitions/Events";
import RadioButton from "sap/m/RadioButton";
import { BPlant } from "plants/ui/definitions/Plants";
import { LSuggestions } from "plants/ui/definitions/PlantsLocal";
import { FBImage } from "plants/ui/definitions/Images";

/**
 * @namespace plants.ui.customClasses.events
 */
// export default class EventUtil extends ManagedObject {
export default class EventCRUD extends ManagedObject {
	private _oEventsModel: JSONModel;  // "events"
	private oSuggestionsData;


	public constructor(oEventsModel: JSONModel, oSuggestionsData: LSuggestions) {
		super();

		this._oEventsModel = oEventsModel;
		this.oSuggestionsData = oSuggestionsData;
	}

	removeEvent(oSelectedEvent: FBEvent, oEventsModel: JSONModel): void {
		// remove an event from events model

		const aEvents = oEventsModel.getProperty('/PlantsEventsDict/' + oSelectedEvent.plant_id);

		// delete the item from array
		const iIndex = aEvents.indexOf(oSelectedEvent);
		if (iIndex < 0) {
			MessageToast.show('An error happended in internal processing of deletion.');
			return;
		}
		aEvents.splice(iIndex, 1);
		oEventsModel.refresh();
	}

	private _getObservationData(oEventEditData: LEventEditData): FBObservation | null {
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

	private _getPotData(oEventEditData: LEventEditData, oView: View): FBPot | null {
		//loads, parses, and cleanses the pot data from the the dialog control
		if (!oEventEditData.segments.pot)
			return null;
		const oPotDataClone = <FBPot>JSON.parse(JSON.stringify(oEventEditData.pot));

		if (oEventEditData.potHeightOptions.very_flat)
			oPotDataClone.shape_side = 'very flat';
		else if (oEventEditData.potHeightOptions.flat)
			oPotDataClone.shape_side = 'flat';
		else if (oEventEditData.potHeightOptions.high)
			oPotDataClone.shape_side = 'high';
		else if (oEventEditData.potHeightOptions.very_high)
			oPotDataClone.shape_side = 'very high';
		else
			throw new Error('Pot height not selected');

		if (oEventEditData.potShapeOptions.square)
			oPotDataClone.shape_top = 'square';
		else if (oEventEditData.potShapeOptions.round)
			oPotDataClone.shape_top = 'round';
		else if (oEventEditData.potShapeOptions.oval)
			oPotDataClone.shape_top = 'oval';
		else if (oEventEditData.potShapeOptions.hexagonal)
			oPotDataClone.shape_top = 'hexagonal';
		else
			throw new Error('Pot shape not selected');

		return oPotDataClone;
	}

	private _getSoilData(oEventEditData: LEventEditData): FBSoil | null {
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

	//triggered by addOrEditEvent
	public addEvent(oView: View, aEventsCurrentPlant: LEventInEventsModel[], oEventNewData: LEventEditData): void {
		//triggered by add button in add/edit event dialog
		//validates and filters data to be saved

		// assert date matches pattern "YYYY-MM-DD"
		Util.assertCorrectDate(oEventNewData.date);
		this._assertNoDuplicateOnDate(aEventsCurrentPlant, oEventNewData.date);

		// clone the data so we won't change the original new model
		const oNewEventSave = <LEventEditData>Util.getClonedObject(oEventNewData);

		if (oNewEventSave.segments.soil && (!oNewEventSave.soil || !oNewEventSave.soil.id)) {
			MessageToast.show('Please choose soil first.');
			return;
		}

		// get the data in the dialog's segments
		const oNewObservation = <FBObservation | undefined>this._getObservationData(oNewEventSave);
		const oNewPot = <FBPot | undefined>this._getPotData(oNewEventSave, oView);
		const oNewSoil = <FBSoil | undefined>this._getSoilData(oNewEventSave);

		const oNewEvent: LEventInEventsModel = {
			// id: number; no id, yet
			date: oNewEventSave.date,
			event_notes: <string | undefined>(oNewEventSave.event_notes && oNewEventSave.event_notes.length > 0 ? oNewEventSave.event_notes.trim() : undefined),
			observation: oNewObservation,
			pot: oNewPot,
			soil: oNewSoil,
			plant_id: oNewEventSave.plant_id,
			images: <FBImage[]>[]
		}

		// actual saving is done upon hitting save button
		// here, we only update the events model
		aEventsCurrentPlant.push(oNewEvent);
		this._oEventsModel.updateBindings(false);
		// oDialog.close();
	}

	private _assertNoDuplicateOnDate(aEventsCurrentPlant: LEventInEventsModel[], sDate: string, oEvent?: FBEvent): void {
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

	public editEvent(oView: View, aEventsCurrentPlant: FBEvent[], oEventEditData: LEventEditData): void {
		//triggered by addOrEditEvent
		//triggered by button in add/edit event dialog
		//validates and filters data to be saved and triggers saving

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

		if (oEventEditData.segments.soil && (!oEventEditData.soil || !oEventEditData.soil.id)) {
			MessageToast.show('Please choose soil first.');
			return;
		}

		// get the data in the dialog's segments
		const oEditedObservation = <FBObservation>this._getObservationData(oEventEditData);
		const oEditedPot = <FBPot>this._getPotData(oEventEditData, oView);
		const oEditedSoil = <FBSoil>this._getSoilData(oEventEditData);

		// update each attribute from the new model into the old event
		oOldEvent.date = <string>oEventEditData.date;
		oOldEvent.event_notes = <string | undefined>(oEventEditData.event_notes && oEventEditData.event_notes.length > 0 ? oEventEditData.event_notes.trim() : undefined);

		const iOldObservationId = oEditedObservation ? <int | undefined>oEditedObservation.id : undefined;
		oOldEvent.observation = <FBObservation>oEditedObservation;
		if (oOldEvent.observation)
			oOldEvent.observation.id = <int | undefined>iOldObservationId;

		oOldEvent.pot = <FBPot | undefined>oEditedPot;
		oOldEvent.soil = <FBSoil | undefined>oEditedSoil;

		// have events factory function in details controller regenerate the events list
		this._oEventsModel.updateBindings(false);  // we updated a proprety of that model
		this._oEventsModel.refresh(true);
	}

	public getInitialEvent(iCurrentPlantId: int): LEventEditData {
//todo move to soildialoghandler?

		// create initial data for the Create/Edit Event Dialog (we actually don't use the 
		// data in case of editing an event)
		// called by both function to add and to edit event
		const oPot = <FBPot>{
			'diameter_width': 4,
			'material': this.oSuggestionsData['potMaterialCollection'][0].name
		};

		const oObservation: FBObservation = {
			'height': 0,
			'stem_max_diameter': 0,
			'diseases': '',
			'observation_notes': ''
		}

		const oSoil: LInitialSoil = {
			id: undefined,
			soil_name: undefined,
			mix: undefined,
			description: undefined,
		}

		const oEventEditDataSegments: LEventEditDataSegments = {
			// defaults to inactive segments
			observation: false,
			pot: false,
			soil: false,
		}

		const oPotHeightOptions: LPotHeightOptions = {
			very_flat: false,
			flat: false,
			high: true,  // default
			very_high: false
		}

		const oPotShapeOptions: LPotShapeOptions = {
			square: true,  // default
			round: false,
			oval: false,
			hexagonal: false
		}

		const oEventEditData: LEventEditData = {
			plant_id: iCurrentPlantId,
			date: Util.getToday(),
			event_notes: '',
			pot: oPot,
			observation: oObservation,
			soil: oSoil,
			potHeightOptions: oPotHeightOptions,
			potShapeOptions: oPotShapeOptions,
			segments: oEventEditDataSegments,
			mode: "new",  // will be overwritten in case of editing
		};
		return oEventEditData;
	}
}