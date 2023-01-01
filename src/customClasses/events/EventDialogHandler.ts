// Handler for Dialog to edit an event or create a new one.

import { LEventEditData, LEventEditDataSegments, LEventInEventsModel, LInitialSoil, LPotHeightOptions, LPotShapeOptions } from "plants/ui/definitions/EventsLocal";
import { BPlant } from "plants/ui/definitions/Plants";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import List from "sap/m/List";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import EventCRUD from "./EventCRUD";
import Event from "sap/ui/base/Event";
import SoilDialogHandler from "./SoilDialogHandler";
import RadioButton from "sap/m/RadioButton";
import Util from "../shared/Util";
import { FBEvent, FBObservation, FBPot, FBSoil, FCreateOrUpdateEvent } from "plants/ui/definitions/Events";
import SoilCRUD from "./SoilCRUD";
import { FBImage } from "plants/ui/definitions/Images";
import { LSuggestions } from "plants/ui/definitions/PlantsLocal";

/**
 * @namespace plants.ui.customClasses.events
 */
export default class EventDialogHandler extends ManagedObject {
	// private _oPlant: BPlant;
	private _oEventCRUD: EventCRUD;
	private _oSoilCRUD: SoilCRUD;
	private _oEventDialog: Dialog;
	private _oEventEditModel: JSONModel;  // "editOrNewEvent"
	private _oSuggestionsData: LSuggestions;
	private _oView: View;

	private _oSoilDialogHandler: SoilDialogHandler;

	public constructor(oEventCRUD: EventCRUD, oView: View, oSuggestionsData: LSuggestions) {
		super();

		// this._oPlant = oPlant;
		this._oEventCRUD = oEventCRUD;
		this._oView = oView;  // todo refactor view out
		this._oSuggestionsData = oSuggestionsData;

		this._oSoilCRUD = new SoilCRUD();
		this._oSoilDialogHandler = new SoilDialogHandler(this._oSoilCRUD);
		this._oEventEditModel = new JSONModel(<LEventEditData>{});
	}

	public openDialogNewEvent(oAttachTo: View, oPlant: BPlant): void {

		// if dialog was instantiated before...
		// if it was used to create a new event before, then just re-open it
		// if it was used to edit an event before, then destroy model and dialog first, then re-instantiate
		if (this._oEventDialog){
			if (this._oEventDialog.getModel("editOrNewEvent").getProperty('/mode') === 'new') {
				this._oEventDialog.open();
				return;
			} else {
				this._oEventDialog.getModel("editOrNewEvent").destroy();
				this._oEventDialog.setModel(null, "editOrNewEvent");
				this._oEventDialog.destroy();
			}
		}

		Fragment.load({
			name: "plants.ui.view.fragments.events.AddEvent",
			id: oAttachTo.getId(),
			controller: this
		}).then((oControl: Control | Control[]) => {
			// this.loadSoils();  // todo refactor view out
			this._oEventDialog = <Dialog>oControl;
			this._oSoilCRUD.loadSoils(this._oEventDialog);
			oAttachTo.addDependent(this._oEventDialog);

			// set defaults for new event
			let mEventEditData: LEventEditData = this._getInitialEvent(oPlant.id);
			mEventEditData.mode = 'new';
			this._oEventEditModel.setData(mEventEditData);  // = new JSONModel(mEventEditData);
			this._oEventDialog.setModel(this._oEventEditModel, "editOrNewEvent");

			this._oEventDialog.open();
		});
	}

	public openDialogEditEvent(oAttachTo: View, oSelectedEvent: FBEvent): void {

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

			const mEventEditData: LEventEditData = this._getSelectedEventInEditableFormat(oSelectedEvent);
			mEventEditData.mode = 'edit';
			this._oEventEditModel.setData(mEventEditData);
			this._oEventDialog.setModel(this._oEventEditModel, "editOrNewEvent");

			this._oEventDialog.open();
		});
	}

	private _getSelectedEventInEditableFormat(oSelectedEvent: FBEvent): LEventEditData {
		// get soils collection from backend proposals resource
		// this. _loadSoils(oView);  // todo remove here, do only once

		// update dialog title and save/update button
		this._oEventDialog.setTitle('Edit Event (' + oSelectedEvent.date + ')');
		(<Button>this._oView.byId('btnEventUpdateSave')).setText('Update');  // todo refactor view out

		// there is some logic involved in mapping the dialog controls and the events model, additionally
		// we don't want to update the events model entity immediately from the dialog but only upon
		// hitting update button, therefore we generate a edit model, fill it with our event's data,
		// and, upon hitting update button, do it the other way around
		const oPlant = <BPlant>this._oEventDialog.getBindingContext('plants')!.getObject();
		var dEventEdit: LEventEditData = this._getInitialEvent(oPlant.id);
		// dEventEdit.mode = 'edit';
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
			dEventEdit.observation!.observation_notes = oSelectedEvent.observation.observation_notes;  // in cm (decimal)
			dEventEdit.observation!.stem_max_diameter = oSelectedEvent.observation.stem_max_diameter;  // in cm (decimal)
		} else {
			dEventEdit.segments.observation = false;
		}

		// pot segment
		if (!!oSelectedEvent.pot) {
			dEventEdit.segments.pot = true;
			dEventEdit.pot!.diameter_width = oSelectedEvent.pot.diameter_width;  // in cm (decimal)
			dEventEdit.pot!.material = oSelectedEvent.pot.material;

			dEventEdit.potHeightOptions.very_flat = oSelectedEvent.pot.shape_side === 'very flat';
			dEventEdit.potHeightOptions.flat = oSelectedEvent.pot.shape_side === 'flat';
			dEventEdit.potHeightOptions.high = oSelectedEvent.pot.shape_side === 'high';
			dEventEdit.potHeightOptions.very_high = oSelectedEvent.pot.shape_side === 'very high';

			dEventEdit.potShapeOptions.square = oSelectedEvent.pot.shape_top === 'square';
			dEventEdit.potShapeOptions.round = oSelectedEvent.pot.shape_top === 'round';
			dEventEdit.potShapeOptions.oval = oSelectedEvent.pot.shape_top === 'oval';
			dEventEdit.potShapeOptions.hexagonal = oSelectedEvent.pot.shape_top === 'hexagonal';

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
		if (this._oEventDialog.getModel("editOrNewEvent")) {
			this._oEventDialog.getModel("editOrNewEvent").destroy();
		}
		// var oModel = new JSONModel(dEventEdit);
		return dEventEdit;
		// this._oEventsModel.setData(dEventEdit);
		// this._oEventDialog.setModel(this._oEventsModel, "editOrNewEvent");
		// oDialog.open();
	}
	//////////////////////////////////////////////////////////
	// Event Handlers
	//////////////////////////////////////////////////////////
	onOpenDialogNewSoil(oEvent: Event) {
		// const oSoilDialogHandler = new SoilDialogHandler(this._oSoilsModel);
		this._oSoilDialogHandler.openDialogNewSoil(this._oEventDialog);  // to does this work with a dialog instead of a view?
		// oSoilDialogHandler.openDialogNewSoil(this.getView());
	}

	public activateRadioButton(oEvent: Event): void {
		//todo refactor with input model
		const oSource = <Control>oEvent.getSource();
		const sRadioButtonId: string = oSource.data('radiobuttonId');
		const oRadioButton = <RadioButton>this._oView.byId(sRadioButtonId);
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
		const oSelectedDataNew = Util.getClonedObject(oSelectedSoil);
		this._oEventEditModel.setProperty('/soil', oSelectedDataNew);
		// });
	}

	onOpenDialogEditSoil(oEvent: Event) {
		const oSource = <Button>oEvent.getSource();
		const oSoil = <FBSoil>oSource.getBindingContext('soils')!.getObject();
		this._oSoilDialogHandler.openDialogEditSoil(oSoil, this._oEventDialog);  // todo does this work instead oif view?
	}

	onAddOrEditEvent(oEvent: Event) {
		//Triggered by 'Add' / 'Update' Button in Create/Edit Event Dialog
		const oEventNewOrEditData = <LEventEditData>this._oEventEditModel.getData();

		var sMode = oEventNewOrEditData.mode; //edit or new
		const oPlant = <BPlant>this._oEventDialog.getBindingContext('plants')!.getObject();

		if (sMode === 'edit') {
			this._editEvent(oPlant, oEventNewOrEditData);
		} else {  //'new'
			this._addEvent(oPlant, oEventNewOrEditData);
		}

		this._oEventDialog.close();
	}

	onCancelAddOrEditEventDialog(oEvent: Event) {
		this._oEventDialog.close();
	}

	//triggered by addOrEditEvent
	private _addEvent(oPlant: BPlant, oEventNewData: LEventEditData): void {
		//triggered by add button in add/edit event dialog
		//validates and filters data to be saved

		

		
		// var sPathEventsModel = '/PlantsEventsDict/' + oPlant.id + '/';
		// var aEventsCurrentPlant: FBEvent[] = this._oEventsModel.getProperty(sPathEventsModel);

		// assert date matches pattern "YYYY-MM-DD"
		// Util.assertCorrectDate(oEventNewData.date);
		// this._assertNoDuplicateOnDate(aEventsCurrentPlant, oEventNewData.date);

		// clone the data so we won't change the original new model
		const oNewEventSave = <LEventEditData>Util.getClonedObject(oEventNewData);

		if (oNewEventSave.segments.soil && (!oNewEventSave.soil || !oNewEventSave.soil.id)) {
			MessageToast.show('Please choose soil first.');
			return;
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

	private _getPotData(oEventEditData: LEventEditData): FBPot | null {
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

	private _getObservationData(oEventEditData: LEventEditData): FBObservation | null {
		//returns the cleansed observation data from the event edit data
		if (!oEventEditData.segments.observation)
			return null;

		const oObservationDataClone = JSON.parse(JSON.stringify(oEventEditData.observation));
		// if height or diameter are 0, reset them to undefined
		if (oObservationDataClone.height === 0.0) {
			oObservationDataClone.height = null;
		}
		if (oObservationDataClone.stem_max_diameter === 0.0) {
			oObservationDataClone.stem_max_diameter = null;
		}
		if (!oObservationDataClone.diseases) {
			oObservationDataClone.diseases = null;
		} else {
			oObservationDataClone.diseases = oObservationDataClone.diseases.trim();
		}
		if (!oObservationDataClone.observation_notes ) {
			oObservationDataClone.observation_notes = null;
		} else {
			oObservationDataClone.observation_notes = oObservationDataClone.observation_notes.trim();
		}
		return <FBObservation>oObservationDataClone;
	}

	private _editEvent(oPlant: BPlant, oEventEditData: LEventEditData): void {
		//triggered by addOrEditEvent
		//triggered by button in add/edit event dialog
		//validates and filters data to be saved and triggers saving

		// old record (which we are updating as it is a pointer to the events model itself) is hidden as a property in the new model
		if (!oEventEditData.oldEvent) {
			MessageToast.show("Can't determine old record. Aborting.");
			return;
		}
		const oOldEvent: FBEvent = oEventEditData.oldEvent;

		// // assert date matches pattern "YYYY-MM-DD"
		// Util.assertCorrectDate(oEventEditData.date);
		// this._assertNoDuplicateOnDate(aEventsCurrentPlant, oEventEditData.date, oOldEvent);

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
		const oEditedPot = <FBPot>this._getPotData(oEventEditData);
		const oEditedSoil = <FBSoil>this._getSoilData(oEventEditData);

		// update each attribute from the new model into the old event
		// oOldEvent.date = <string>oEventEditData.date;
		const event_notes = <string | undefined>(oEventEditData.event_notes && oEventEditData.event_notes.length > 0 ? oEventEditData.event_notes.trim() : undefined);

		const iOldObservationId = oEditedObservation ? <int | undefined>oEditedObservation.id : undefined;
		// oOldEvent.observation = <FBObservation>oEditedObservation;
		// if (oOldEvent.observation)
		// 	oOldEvent.observation.id = <int | undefined>iOldObservationId;

		// oOldEvent.pot = <FBPot | undefined>oEditedPot;
		// oOldEvent.soil = <FBSoil | undefined>oEditedSoil;

		this._oEventCRUD.updateEvent(oPlant, oOldEvent, <string>oEventEditData.date, event_notes, iOldObservationId, 
			oEditedObservation, oEditedPot, oEditedSoil);

		// // have events factory function in details controller regenerate the events list
		// this._oEventsModel.updateBindings(false);  // we updated a proprety of that model
		// this._oEventsModel.refresh(true);
	}

	private _getInitialEvent(iCurrentPlantId: int): LEventEditData {
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