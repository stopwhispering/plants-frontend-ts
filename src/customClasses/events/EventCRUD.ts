import Util from "plants/ui/customClasses/shared/Util";
import MessageToast from "sap/m/MessageToast"
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import { LEventInEventsModel } from "plants/ui/definitions/EventsLocal";
import { FBPot, FBEvent, FBObservation, FBSoil, FCreateOrUpdateEvent } from "plants/ui/definitions/Events";
import { BPlant } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.events
 */
// export default class EventUtil extends ManagedObject {
export default class EventCRUD extends ManagedObject {
	private _oEventsModel: JSONModel;  // "events"

	public constructor(oEventsModel: JSONModel) {
		super();

		this._oEventsModel = oEventsModel;
	}

	removeEvent(oSelectedEvent: FBEvent): void {
		// remove an event from events model

		const aEvents = this._oEventsModel.getProperty('/PlantsEventsDict/' + oSelectedEvent.plant_id);

		// delete the item from array
		const iIndex = aEvents.indexOf(oSelectedEvent);
		if (iIndex < 0) {
			MessageToast.show('An error happended in internal processing of deletion.');
			return;
		}
		aEvents.splice(iIndex, 1);
		this._oEventsModel.refresh();
	}

	public addEvent(oPlant: BPlant, oNewEvent: FCreateOrUpdateEvent): void {
		//triggered by add button in add/edit event dialog
		//validates and filters data to be saved
		var sPathEventsModel = '/PlantsEventsDict/' + oPlant.id + '/';
		var aEventsCurrentPlant: (FBEvent|FCreateOrUpdateEvent)[] = this._oEventsModel.getProperty(sPathEventsModel);

		// assert date matches pattern "YYYY-MM-DD"
		Util.assertCorrectDate(oNewEvent.date);
		this._assertNoDuplicateOnDate(aEventsCurrentPlant, oNewEvent.date);

		// actual saving is done upon hitting save button
		// here, we only update the events model
		aEventsCurrentPlant.push(oNewEvent);
		this._oEventsModel.updateBindings(false);
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

	public updateEvent(oPlant: BPlant, oEvent: FBEvent, date: string, event_notes: string|undefined, iObservationId: int|undefined,
		observation: FBObservation|undefined, pot:FBPot|undefined, soil: FBSoil|undefined): void {
		//triggered by addOrEditEvent
		//triggered by button in add/edit event dialog
		//validates and filters data to be saved and triggers saving
		var sPathEventsModel = '/PlantsEventsDict/' + oPlant.id + '/';
		var aEventsCurrentPlant: FBEvent[] = this._oEventsModel.getProperty(sPathEventsModel);

		// assert date matches pattern "YYYY-MM-DD"
		Util.assertCorrectDate(date);
		this._assertNoDuplicateOnDate(aEventsCurrentPlant, date, oEvent);

		// update each attribute from the new model into the old event
		oEvent.date = date;
		oEvent.event_notes = event_notes;

		oEvent.observation = observation;
		if (oEvent.observation)
			oEvent.observation.id = iObservationId;

		oEvent.pot = pot;
		oEvent.soil = soil;

		// have events factory function in details controller regenerate the events list
		this._oEventsModel.updateBindings(false);  // we updated a proprety of that model
		this._oEventsModel.refresh(true);
	}
}