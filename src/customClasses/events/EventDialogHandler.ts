// Handler for Dialog to edit an event or create a new one.

import { LEventEditData } from "plants/ui/definitions/EventsLocal";
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
import { FBEvent, FBSoil } from "plants/ui/definitions/Events";
import SoilCRUD from "./SoilCRUD";

/**
 * @namespace plants.ui.customClasses.events
 */
export default class EventDialogHandler extends ManagedObject {
	// private _oPlant: BPlant;
	private _oEventCRUD: EventCRUD;
	private _oSoilCRUD: SoilCRUD;
	private _oEventDialog: Dialog;
	private _oEventEditModel: JSONModel;  // "editOrNewEvent"
	private _oView: View;
	private _oEventsModel: JSONModel;  // "events"

	private _oSoilDialogHandler: SoilDialogHandler;

	public constructor(oEventCRUD: EventCRUD, oView: View, oEventsModel: JSONModel) {
		super();

		// this._oPlant = oPlant;
		this._oEventCRUD = oEventCRUD;
		this._oView = oView;  // todo refactor view out
		this._oEventsModel = oEventsModel;

		this._oSoilCRUD = new SoilCRUD();
		this._oSoilDialogHandler = new SoilDialogHandler(this._oSoilCRUD.getSoilsModel(), this._oSoilCRUD);
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
			let mEventEditData: LEventEditData = this._oEventCRUD.getInitialEvent(oPlant.id);
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
		var dEventEdit: LEventEditData = this._oEventCRUD.getInitialEvent(oPlant.id);
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
		// this.applyToFragment('dialogEvent', (oDialog: Dialog) => {
		// const oModelNewEvent = <JSONModel>this._oEventDialog.getModel("editOrNewEvent");
		const oSelectedDataNew = Util.getClonedObject(oSelectedSoil);
		this._oEventEditModel.setProperty('/soil', oSelectedDataNew);
		// });
	}

	onOpenDialogEditSoil(oEvent: Event) {
		const oSource = <Button>oEvent.getSource();
		const oSoil = <FBSoil>oSource.getBindingContext('soils')!.getObject();
		// const oSoilDialogHandler = new SoilDialogHandler(this._oSoilsModel);
		// oSoilDialogHandler.openDialogEditSoil(oSoil, this.getView());
		this._oSoilDialogHandler.openDialogEditSoil(oSoil, this._oEventDialog);  // todo does this work instead oif view?
	}

	onAddOrEditEvent(oEvent: Event) {
		//Triggered by 'Add' / 'Update' Button in Create/Edit Event Dialog
		// this._oEventCRUD.addOrEditEvent(this.getView(), this.mCurrentPlant.plant);
		const oEventNewOrEditData = <LEventEditData>this._oEventEditModel.getData();
		// this._oEventCRUD.addOrEditEvent(this._oView, this._oPlant, oEventNewOrEditData);  // todo refactor view out

		var sMode = oEventNewOrEditData.mode; //edit or new
		const oPlant = <BPlant>this._oEventDialog.getBindingContext('plants')!.getObject();
		var sPathEventsModel = '/PlantsEventsDict/' + oPlant.id + '/';
		var aEventsCurrentPlant = this._oEventsModel.getProperty(sPathEventsModel);

		if (sMode === 'edit') {
			this._oEventCRUD.editEvent(this._oView, aEventsCurrentPlant, oEventNewOrEditData);
		} else {  //'new'
			this._oEventCRUD.addEvent(this._oView, aEventsCurrentPlant, oEventNewOrEditData);
		}

		this._oEventDialog.close();
	}

	onCancelAddOrEditEventDialog(oEvent: Event) {
		this._oEventDialog.close();
	}

}