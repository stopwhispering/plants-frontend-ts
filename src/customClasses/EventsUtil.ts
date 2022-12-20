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
	EventEditData, EventEditDataSegments, PEvent, PEvents, PObservation, PPot,
	PResultsUpdateCreateSoil, PSoil, SoilEditData
} from "../definitions/entities";
import RadioButton from "sap/m/RadioButton";
import ModelsHelper from "../model/ModelsHelper";
import { LSuggestions, PPlant } from "../definitions/plant_entities";
import Context from "sap/ui/model/Context";
import Controller from "sap/ui/core/mvc/Controller";
import VBox from "sap/m/VBox";
import GridListItem from "sap/f/GridListItem";
import GridList from "sap/f/GridList";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";

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

	public openDialogAddEvent(oView: View) {

		this.applyToFragment('dialogEvent', (oDialog: Dialog) => {
			// get soils collection from backend proposals resource
			this._loadSoils(oView);

			// if dialog was used for editing an event before, then destroy it first
			if (!!oDialog.getModel("new") && oDialog.getModel("new").getProperty('/mode') !== 'new') {
				oDialog.getModel("new").destroy();
				oDialog.setModel(null, "new");

				// set header and button to add instead of edit
				const oI18Model = <ResourceModel>oView.getModel("i18n");
				const oResourceBundle = <ResourceBundle>oI18Model.getResourceBundle();
				oDialog.setTitle(oResourceBundle.getText("header_event"));
				const oBtnSave = <Button>oView.byId('btnEventUpdateSave');
				oBtnSave.setText('Add');
			}

			// set defaults for new event
			if (!oDialog.getModel("new")) {
				let mEventEditData = this._getInitialEvent();
				mEventEditData.mode = 'new';
				const oEventEditModel = new JSONModel(mEventEditData);
				oDialog.setModel(oEventEditModel, "new");
			}

			oView.addDependent(oDialog);
			oDialog.open();
		})
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

	private _handleEventSegments(dDataSave: EventEditData, oView: View) {
		//modifies the data by reading/updating/validating the segments observation, pot, and soil

		//observation tab
		if (dDataSave.segments!.observation !== 'cancel') {

			// if height or diameter are 0, reset them to undefined
			if (dDataSave.observation!.height === 0) {
				dDataSave.observation!.height = undefined;
			}
			if (dDataSave.observation!.stem_max_diameter === 0) {
				dDataSave.observation!.stem_max_diameter = undefined;
			}
		} else {
			delete dDataSave.observation;
		}

		//pot tab
		if (dDataSave.segments!.pot !== 'cancel' && dDataSave.pot) {
			// if width/diameter is 0, resetz it to undefined
			if (dDataSave.pot.diameter_width === 0) {
				dDataSave.pot.diameter_width = undefined;
			}

			dDataSave.pot_event_type = dDataSave.segments!.pot;  //repot or status

			//pot shape properties can't be taken directly from model because of radiobutton handling without formal RadioGroup class
			if ((<RadioButton>oView.byId('idPotHeight0')).getSelected()) {
				dDataSave.pot.shape_side = 'very flat';
			} else if ((<RadioButton>oView.byId('idPotHeight1')).getSelected()) {
				dDataSave.pot.shape_side = 'flat';
			} else if ((<RadioButton>oView.byId('idPotHeight2')).getSelected()) {
				dDataSave.pot.shape_side = 'high';
			} else if ((<RadioButton>oView.byId('idPotHeight3')).getSelected()) {
				dDataSave.pot.shape_side = 'very high';
			}

			if ((<RadioButton>oView.byId('idPotShape0')).getSelected()) {
				dDataSave.pot.shape_top = 'square';
			} else if ((<RadioButton>oView.byId('idPotShape1')).getSelected()) {
				dDataSave.pot.shape_top = 'round';
			} else if ((<RadioButton>oView.byId('idPotShape2')).getSelected()) {
				dDataSave.pot.shape_top = 'oval';
			} else if ((<RadioButton>oView.byId('idPotShape3')).getSelected()) {
				dDataSave.pot.shape_top = 'hexagonal';
			}
		} else {
			delete dDataSave.pot;
		}

		//soil tab
		if (dDataSave.segments!.soil !== 'cancel') {

			dDataSave.soil_event_type = dDataSave.segments!.soil;  //change or status

			//make sure soil was seleccted
			//note: we submit the whole soil object to the backend, but the backend does only care about the id
			//for modifying or creating a soil, there's a separate service
			if (!dDataSave!.soil!.id) {
				throw new Error('Choose soil.');
			}
			// this.validateSoilSelection.call(this, dDataSave);	
		} else {
			delete dDataSave.soil;
		}
	}

	private _loadSoils(oView: View) {
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

	private _addEvent(oView: View, oEventsModel: JSONModel, aEventsCurrentPlant: PEvents, plant_id: int) {
		//triggered by addOrEditEvent
		//triggered by button in add/edit event dialog
		//validates and filters data to be saved and triggers saving

		// get new event data
		var oDialog = <Dialog>oView.byId('dialogEvent');
		var oNewEventModel = <JSONModel>oDialog.getModel("new");
		var oNewEvent = <EventEditData>oNewEventModel.getData();
		oNewEvent.plant_id = plant_id;

		// trim date, e.g. from "2019-09-29 __:__" to "2019-09-29"
		while (oNewEvent.date.endsWith('_') ||
			oNewEvent.date.endsWith(':')) {
			oNewEvent.date = oNewEvent.date.slice(0, -1);  //remove last char
			oNewEvent.date = oNewEvent.date.trim();
		}

		// make sure there's only one event per day and plant (otherwise backend problems would occur)
		var found = aEventsCurrentPlant.find(function (element) {
			return element.date === oNewEvent.date;
		});
		if (!!found) {
			MessageToast.show('Duplicate event on that date.');
			return;
		}

		// clone the data so we won't change the original new model
		const oNewEventSave = <EventEditData>Util.getClonedObject(oNewEvent);

		// general tab (always validate)
		if (oNewEventSave.date.length === 0) {
			MessageToast.show('Enter date.');
			return;
		}

		// treat data in observation, pot, and soil segments
		try {
			this._handleEventSegments(oNewEventSave, oView);
		} catch (e: any) {
			MessageToast.show(e);
			return;
		}

		// no need to submit the segments selection to the backend
		delete oNewEventSave.segments;

		// actual saving is done upon hitting save button
		// here, we only update the events model
		// the plant's events have been loaded upon first visiting the plant's details view
		delete oNewEventSave.mode;
		aEventsCurrentPlant.push(oNewEventSave);
		oEventsModel.updateBindings(false);
		oDialog.close();
	}

	private _editEvent(oView: View, oEventsModel: JSONModel, aEventsCurrentPlant: PEvent[]) {
		//triggered by addOrEditEvent
		//triggered by button in add/edit event dialog
		//validates and filters data to be saved and triggers saving

		// get new event data
		var oDialog = <Dialog>oView.byId('dialogEvent')
		var oEditEventModel = <JSONModel>oDialog.getModel("new");
		var oEventEditData = <EventEditData>oEditEventModel.getData();

		// old record (which we are updating as it is a pointer to the events model itself) is hidden as a property in the new model
		if (!oEventEditData.old_event) {
			MessageToast.show("Can't determine old record. Aborting.");
			return;
		}
		var oOldEvent = <EventEditData>oEventEditData.old_event;

		// trim date, e.g. from "2019-09-29 __:__" to "2019-09-29"
		while (oEventEditData.date.endsWith('_') ||
			oEventEditData.date.endsWith(':')) {
			oEventEditData.date = oEventEditData.date.slice(0, -1);  //remove last char
			oEventEditData.date = oEventEditData.date.trim();
		}

		// general tab (always validate)
		if (oEventEditData.date.length === 0) {
			MessageToast.show('Enter date.');
			return;
		}

		// make sure there's only one event per day and plant; here: there may not be an existing event on that date except for
		// the event updated itself
		var found = aEventsCurrentPlant.find(function (element) {
			return (element.date === oEventEditData.date && element !== oOldEvent);
		});
		if (!!found) {
			MessageToast.show('Duplicate event on that date.');
			return;
		}

		// update each attribute from the new model into the event
		const aEventEditDataAttributes = Object.keys(oEventEditData);
		aEventEditDataAttributes.forEach(function (key: string) {
			const oClonedAttr = Util.getClonedObject(oEventEditData[key as keyof typeof oEventEditData]);
			oOldEvent[key as keyof typeof oEventEditData] = Util.getClonedObject(oEventEditData[key as keyof typeof oEventEditData]);
		});

		// treat data in observation, pot, and soil segments
		try {
			this._handleEventSegments(oOldEvent, oView);
		} catch (e: any) {
			MessageToast.show(e);
			return;
		}

		// tidy up
		delete oOldEvent.segments;
		delete oOldEvent.mode;
		delete oOldEvent.old_event; // this is strange; it deletes the property which is the object itself without deleting itself

		// have events factory function in details controller regenerate the events list
		oEventsModel.updateBindings(false);  // we updated a proprety of that model
		oEventsModel.refresh(true);
		oDialog.close();
	}

	addOrEditEvent(oView: View, oCurrentPlant: PPlant) {
		var oDialog = oView.byId('dialogEvent');
		var oNewEventModel = <JSONModel>oDialog.getModel("new");
		var dDataNew = <EventEditData>oNewEventModel.getData();
		var sMode = dDataNew.mode; //edit or new

		var oEventsModel = <JSONModel>oView.getModel('events');
		var sPathEventsModel = '/PlantsEventsDict/' + oCurrentPlant.id + '/';
		var aEventsCurrentPlant = oEventsModel.getProperty(sPathEventsModel);

		if (sMode === 'edit') {
			this._editEvent(oView, oEventsModel, aEventsCurrentPlant);
		} else {  //'new'
			this._addEvent(oView, oEventsModel, aEventsCurrentPlant, oCurrentPlant.id!);
		}
	}

	public editEvent(oSelectedEvent: PEvent, oView: View) {
		this.applyToFragment('dialogEvent', this._initEditSelectedEvent.bind(this, oSelectedEvent, oView));
	}

	private _initEditSelectedEvent(oSelectedEvent: PEvent, oView: View, oDialog: Dialog) {
		// get soils collection from backend proposals resource
		this._loadSoils(oView);

		// update dialog title and save/update button
		oDialog.setTitle('Edit Event (' + oSelectedEvent.date + ')');
		(<Button>oView.byId('btnEventUpdateSave')).setText('Update');

		// there is some logic involved in mapping the dialog controls and the events model, additionally
		// we don't want to update the events model entity immediately from the dialog but only upon
		// hitting update button, therefore we generate a edit model, fill it with our event's data,
		// and, upon hitting update button, do it the other way around
		var dEventEdit: EventEditData = this._getInitialEvent();
		dEventEdit.mode = 'edit';
		dEventEdit.date = oSelectedEvent.date;
		dEventEdit.event_notes = oSelectedEvent.event_notes;

		// we need to remember the old record
		dEventEdit.old_event = oSelectedEvent as EventEditData;
		if (oSelectedEvent.pot && oSelectedEvent.pot.id) {
			dEventEdit.pot!.id = oSelectedEvent.pot.id;
		}
		if (oSelectedEvent.observation && oSelectedEvent.observation.id) {
			dEventEdit.observation!.id = oSelectedEvent.observation.id;
		}

		// observation segment
		if (!!oSelectedEvent.observation) {
			// switch on start tab
			dEventEdit.segments!.observation = 'status';
			dEventEdit.observation!.diseases = oSelectedEvent.observation.diseases;
			dEventEdit.observation!.height = oSelectedEvent.observation.height;
			dEventEdit.observation!.observation_notes = oSelectedEvent.observation.observation_notes;
			dEventEdit.observation!.stem_max_diameter = oSelectedEvent.observation.stem_max_diameter;
		} else {
			dEventEdit.segments!.observation = 'cancel';
		}

		// pot segment
		if (!!oSelectedEvent.pot) {
			dEventEdit.segments!.pot = oSelectedEvent.pot_event_type;
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
			dEventEdit.segments!.pot = 'cancel';
		}

		// soil segment
		if (!!oSelectedEvent.soil) {
			dEventEdit.segments!.soil = oSelectedEvent.soil_event_type;
			dEventEdit.soil = Util.getClonedObject(oSelectedEvent.soil);
		} else {
			dEventEdit.segments!.soil = 'cancel';
		}

		// set model and open dialog
		if (oDialog.getModel("new")) {
			oDialog.getModel("new").destroy();
		}
		var oModel = new JSONModel(dEventEdit);
		oDialog.setModel(oModel, "new");
		oDialog.open();
	}

	private _getInitialEvent(): EventEditData {
		// create initial data for the Create/Edit Event Dialog (we don't use the 
		// actual data there in case of editing an event)
		// called by both function to add and to edit event
		const oPot = <PPot>{
			'diameter_width': 4,
			'material': this.oSuggestionsData['potMaterialCollection'][0].name
		};

		const oObservation = <PObservation>{
			'height': 0,
			'stem_max_diameter': 0,
			'diseases': '',
			'observation_notes': ''
		}

		const oSoil = <PSoil>{
			'id': undefined,
			'soil_name': '',
			'mix': '',
			'description': ''
		}

		const oEventEditDataSegments = <EventEditDataSegments>{
			// defaults as to whether segments are active (and what to save in backend)
			'observation': 'cancel',
			'pot': 'cancel',
			'soil': 'cancel'
		}

		const oEventEditData = <EventEditData>{
			'date': Util.getToday(),
			'event_notes': '',
			'pot': oPot,
			'observation': oObservation,
			'soil': oSoil,
			'segments': oEventEditDataSegments,
			'mode': undefined,
		};
		return oEventEditData;
	}

	openDialogEditSoil(oView: View, oSoil: PSoil): void {
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
		var aSoils = <PSoil[]>oSoilsModel.getData().SoilsCollection;
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

		var aSoils = <PSoil[]>oSoilsModel.getData().SoilsCollection;
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