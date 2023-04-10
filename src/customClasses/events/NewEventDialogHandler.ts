// Handler for Dialog to edit an event or create a new one.

import { LEventData, LEventEditData, LEventEditDataSegments, LInitialSoil, LNewEventData, LPotHeightOptions, LPotShapeOptions } from "plants/ui/definitions/EventsLocal";
import { BPlant } from "plants/ui/definitions/Plants";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import EventCRUD from "./EventCRUD";
import Event from "sap/ui/base/Event";
import Util from "../shared/Util";
import { FBObservation, FBPot, FBSoil, FCreateOrUpdateEvent } from "plants/ui/definitions/Events";
import { FBImage } from "plants/ui/definitions/Images";
import { LSuggestions } from "plants/ui/definitions/PlantsLocal";
import EventDialogHandler from "./EventDialogHandler";

/**
 * @namespace plants.ui.customClasses.events
 */
export default class NewEventDialogHandler extends EventDialogHandler {
	private _oEventCRUD: EventCRUD;
	private _oSuggestionsData: LSuggestions;

	public constructor(oEventCRUD: EventCRUD, oView: View, oSuggestionsData: LSuggestions) {
		super(oView, oSuggestionsData);

		this._oEventCRUD = oEventCRUD;
		this._oEventModel = new JSONModel(<LNewEventData>{});
		this._oSuggestionsData = oSuggestionsData;
	}


	//////////////////////////////////////////////////////////
	// Public
	//////////////////////////////////////////////////////////
	public openDialogNewEvent(oAttachTo: View, oPlant: BPlant): void {
		// if dialog was instantiated before...
		// if it was used to create a new event before, then just re-open it
		// if it was used to edit an event before, then destroy model and dialog first, then re-instantiate
		if (this._oEventDialog){
			this._oEventDialog.open();
			return;
		}

		Fragment.load({
			name: "plants.ui.view.fragments.events.AddEvent",
			id: oAttachTo.getId(),
			controller: this
		}).then((oControl: Control | Control[]) => {
			this._oEventDialog = <Dialog>oControl;
			this._oSoilCRUD.loadSoils(this._oEventDialog);
			oAttachTo.addDependent(this._oEventDialog);

			// set defaults for new event
			let mNewEventData: LNewEventData = this._getInitialEvent(oPlant.id);
			this._oEventModel.setData(mNewEventData);
			this._oEventDialog.setModel(this._oEventModel, "editOrNewEvent");

			this._oEventDialog.open();
		});
	}

	//////////////////////////////////////////////////////////
	// Event Handlers
	//////////////////////////////////////////////////////////
	onOpenDialogNewSoil(oEvent: Event) {
		this._oSoilDialogHandler.openDialogNewSoil(this._oEventDialog);  // todo does this work with a dialog instead of a view?
	}

	onAddOrEditEvent(oEvent: Event) {
		//Triggered by 'Add' / 'Update' Button in Create/Edit Event Dialog
		const oEventNewOrEditData = <LEventEditData>this._oEventModel.getData();
		const oPlant = <BPlant>this._oEventDialog.getBindingContext('plants')!.getObject();
		this._addEvent(oPlant, oEventNewOrEditData);
		this._oEventDialog.close();
	}

	//////////////////////////////////////////////////////////
	// Private
	//////////////////////////////////////////////////////////
	private _addEvent(oPlant: BPlant, oEventNewData: LEventEditData){
		//triggered by add button in add/edit event dialog
		//validates and filters data to be saved

		// clone the data so we won't change the original new model
		const oNewEventSave = <LEventEditData>Util.getClonedObject(oEventNewData);

		if (oNewEventSave.segments.soil && (!oNewEventSave.soil || !oNewEventSave.soil.id)) {
			MessageToast.show('Please choose soil first.');
			throw new Error('No soil chosen.');
		}

		// get the data in the dialog's segments
		const oNewObservation = <FBObservation | undefined>this._getObservationData(oNewEventSave);
		const oNewPot = <FBPot | undefined>this._getPotData(oNewEventSave);
		const oNewSoil = <FBSoil | undefined>this._getSoilData(oNewEventSave);

		const oNewEvent: FCreateOrUpdateEvent = {
			// id: number; no id, yet
			date: oNewEventSave.date,
			event_notes: <string | undefined>(oNewEventSave.event_notes && oNewEventSave.event_notes.length > 0 ? oNewEventSave.event_notes.trim() : undefined),
			observation: oNewObservation,
			pot: oNewPot,
			soil: oNewSoil,
			plant_id: oNewEventSave.plant_id,
			images: <FBImage[]>[]
		}

		this._oEventCRUD.addEvent(oPlant, oNewEvent)
	}

	private _getInitialEvent(iCurrentPlantId: int): LEventData {
		// create initial data for the Create/Edit Event Dialog (we actually don't use the 
		// data in case of editing an event)
		// called by both function to add and to edit event
		const oPot = <FBPot>{
			'diameter_width': 4.0,  // in cm (decimal)
			'material': this._oSuggestionsData['potMaterialCollection'][0].name
		};

		const oObservation: FBObservation = {
			'height': 0.0,  // in cm (decimal)
			'stem_max_diameter': 0.0,  // in cm (decimal)
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

		const oEventData: LEventData = {
			plant_id: iCurrentPlantId,
			date: Util.getToday(),
			event_notes: '',
			pot: oPot,
			observation: oObservation,
			soil: oSoil,
			potHeightOptions: oPotHeightOptions,
			potShapeOptions: oPotShapeOptions,
			segments: oEventEditDataSegments,
			// mode: "new",  // will be overwritten in case of editing  //todo remove
		};
		return oEventData;
	}


}