// Handler for Dialog to edit an event or create a new one.
import { LEventEditData, LPotHeightOptions, LPotShapeOptions, LEventEditDataSegments } from "plants/ui/definitions/EventsLocal";
import { PlantRead } from "plants/ui/definitions/Plants";
import Dialog from "sap/m/Dialog";
import MessageToast from "sap/m/MessageToast";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import EventCRUD from "./EventCRUD";
import Util from "../shared/Util";
import { ObservationCreateUpdate, SoilRead, EventRead, PotCreateUpdate, EventCreateUpdate } from "plants/ui/definitions/Events";
import { LSuggestions } from "plants/ui/definitions/PlantsLocal";
import EventDialogHandler from "./EventDialogHandler";
import { Button$PressEvent } from "sap/m/Button";
import Event from "sap/ui/base/Event";
import { Switch$ChangeEvent } from "sap/m/Switch";

/**
 * @namespace plants.ui.customClasses.events
 */
export default class EditEventDialogHandler extends EventDialogHandler {
	private _oEventCRUD: EventCRUD;
	// protected _oEventModel: JSONModel;  // "editOrNewEvent"
	// private _oSuggestionsData: LSuggestions;

	public constructor(oEventCRUD: EventCRUD, oView: View, oSuggestionsData: LSuggestions) {
		super(oView, oSuggestionsData);

		this._oEventCRUD = oEventCRUD;
		this._oEventModel = new JSONModel(<LEventEditData>{});
		// this._oSuggestionsData = oSuggestionsData;
	}


	//////////////////////////////////////////////////////////
	// Public
	//////////////////////////////////////////////////////////
	public openDialogEditEvent(oAttachTo: View, oSelectedEvent: EventRead): void {

		// if dialog was instantiated before, then destroy model and dialog first, then re-instantiate
		if (this._oEventDialog){
			this._oEventDialog.getModel("editOrNewEvent").destroy();
			this._oEventDialog.setModel(null, "editOrNewEvent");
			this._oEventDialog.destroy();
		}
		
		Fragment.load({
			name: "plants.ui.view.fragments.events.AddEvent",
			id: oAttachTo.getId(),
			controller: this
		}).then((oControl: Control | Control[]) => {
			this._oEventDialog = <Dialog>oControl;
			this._oSoilCRUD.loadSoils(this._oEventDialog);
			oAttachTo.addDependent(this._oEventDialog);

			// this._oEventDialog.setTitle('Edit Event (' + oSelectedEvent.date + ')');
			const mEventEditData: LEventEditData = this._getSelectedEventInEditableFormat(oSelectedEvent);
			if (this._oEventDialog.getModel("editOrNewEvent")) {
				this._oEventDialog.getModel("editOrNewEvent").destroy();
			}
			this._oEventModel.setData(mEventEditData);
			this._oEventDialog.setModel(this._oEventModel, "editOrNewEvent");
			this._oEventDialog.open();
		});
	}

	//////////////////////////////////////////////////////////
	// Event Handlers
	//////////////////////////////////////////////////////////
	onOpenDialogNewSoil(oEvent: Button$PressEvent) {
		// const oSoilDialogHandler = new SoilDialogHandler(this._oSoilsModel);
		this._oSoilDialogHandler.openDialogNewSoil(this._oEventDialog);  // to does this work with a dialog instead of a view?
		// oSoilDialogHandler.openDialogNewSoil(this.getView());
	}

	onAddOrEditEvent(oEvent: Button$PressEvent) {
		//Triggered by 'Add' / 'Update' Button in Create/Edit Event Dialog
		const oEventNewOrEditData = <LEventEditData>this._oEventModel.getData();
		const oPlant = <PlantRead>this._oEventDialog.getBindingContext('plants')!.getObject();
		this._editEvent(oPlant, oEventNewOrEditData);
		this._oEventDialog.close();
	}

	//////////////////////////////////////////////////////////
	// Private
	//////////////////////////////////////////////////////////
	private _getSelectedEventInEditableFormat(oSelectedEvent: EventRead): LEventEditData {
		let dPotHeightOptions: LPotHeightOptions;
		let dPotShapeOptions: LPotShapeOptions;
		
		const shape_side = oSelectedEvent.pot ? oSelectedEvent.pot.shape_side : undefined;
		const shape_top = oSelectedEvent.pot ? oSelectedEvent.pot.shape_top : undefined;
		dPotHeightOptions = {
			very_flat: shape_side === 'very flat',
			flat: shape_side === 'flat',
			high: shape_side === 'high',
			very_high: shape_side === 'very high'
		};
		
		dPotShapeOptions = {
			square: shape_top === 'square',
			round: shape_top === 'round',
			oval: shape_top === 'oval',
			hexagonal: shape_top === 'hexagonal'
		};

		const dSegments: LEventEditDataSegments = {
			observation: (!!oSelectedEvent.observation),
			soil: (!!oSelectedEvent.soil),
			pot: (!!oSelectedEvent.pot),
		};

		//deep-clone event
		var dClonedEvent: EventRead = Util.getClonedObject(oSelectedEvent);
		var dEventEdit: LEventEditData = {
			...dClonedEvent,
			oldEvent: oSelectedEvent,
			potHeightOptions: dPotHeightOptions,
			potShapeOptions: dPotShapeOptions,
			selectedSoilId: (oSelectedEvent.soil ? oSelectedEvent.soil.id : undefined),
			segments: dSegments

		}
		return dEventEdit;
	}

	private _editEvent(oPlant: PlantRead, oEventEditData: LEventEditData){
		//triggered by addOrEditEvent
		//triggered by button in add/edit event dialog
		//validates and filters data to be saved and triggers saving

		// old record (which we are updating as it is a pointer to the events model itself) is hidden as a property in the new model
		if (!oEventEditData.oldEvent) {
			MessageToast.show("Can't determine old record. Aborting.");
			throw new Error("Can't determine old record. Aborting.");
		}
		const oOldEvent: EventCreateUpdate = oEventEditData.oldEvent;

		if (oOldEvent.plant_id !== oEventEditData.plant_id) {
			MessageToast.show('Plant ID cannot be changed.');
			throw new Error('Plant ID cannot be changed.');
		}

		if (oEventEditData.segments.soil && (!oEventEditData.soil || !oEventEditData.soil.id)) {
			MessageToast.show('Please choose soil first.');
			throw new Error('No soil chosen.');
		}

		// get the data in the dialog's segments
		const oEditedObservation = <ObservationCreateUpdate>this._getObservationData(oEventEditData);
		const oEditedPot = <PotCreateUpdate>this._getPotData(oEventEditData);
		const oEditedSoil = <SoilRead>this._getSoilData(oEventEditData);

		// update each attribute from the new model into the old event
		const event_notes = <string | undefined>(oEventEditData.event_notes && oEventEditData.event_notes.length > 0 ? oEventEditData.event_notes.trim() : undefined);
		const iOldObservationId = oEditedObservation ? <int | undefined>oEditedObservation.id : undefined;

		this._oEventCRUD.updateEvent(oPlant, oOldEvent, <string>oEventEditData.date, event_notes, iOldObservationId, 
			oEditedObservation, oEditedPot, oEditedSoil);

	}

	// private _getDefaultPot(): PotCreateUpdate {
	// 	// todo merge with same function in NewEventDialogHandler.ts
	// 	const oPot = <PotCreateUpdate>{
	// 		'diameter_width': 4.0,  // in cm (decimal)
	// 		'material': this._oSuggestionsData['potMaterialCollection'][0].name
	// 	};
	// 	return oPot;
	// }

	onPotSwitchChange(oEvent: Switch$ChangeEvent) {
		// create default pot options if pot switch is turned on
		const oEventEditData = <LEventEditData>this._oEventModel.getData();
		const bPotSwitch = oEvent.getParameter("state");
		if (bPotSwitch) {
			// pot switch is on, so we need to set the pot width to a default value
			if (!oEventEditData.pot) {
				oEventEditData.pot = this._getDefaultPot();
			}
		}
	}

}