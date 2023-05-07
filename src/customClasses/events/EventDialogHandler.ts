// Handler for Dialog to edit an event or create a new one.
import { LEventEditData } from "plants/ui/definitions/EventsLocal";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import List from "sap/m/List";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import View from "sap/ui/core/mvc/View";
import Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import Event from "sap/ui/base/Event";
import SoilDialogHandler from "./SoilDialogHandler";
import RadioButton from "sap/m/RadioButton";
import Util from "../shared/Util";
import { FBObservation, FBPot, FBSoil } from "plants/ui/definitions/Events";
import SoilCRUD from "./SoilCRUD";
import { LSuggestions } from "plants/ui/definitions/PlantsLocal";

/**
 * @namespace plants.ui.customClasses.events
 */
export default abstract class EventDialogHandler extends ManagedObject {
	protected _oSoilCRUD: SoilCRUD;
	protected _oEventDialog: Dialog;
	protected _oEventModel: JSONModel;  // "editOrNewEvent"
	protected _oView: View;

	protected _oSoilDialogHandler: SoilDialogHandler;

	public constructor(oView: View, oSuggestionsData: LSuggestions) {
		super();

		// this._oPlant = oPlant;
		this._oView = oView;  // todo refactor view out
		// this._oSuggestionsData = oSuggestionsData;

		this._oSoilCRUD = new SoilCRUD();
		this._oSoilDialogHandler = new SoilDialogHandler(this._oSoilCRUD);
		// this._oEventModel = new JSONModel(<LEventEditData>{});
	}

	//////////////////////////////////////////////////////////
	// Shared Event Handlers
	//////////////////////////////////////////////////////////
	onOpenDialogNewSoil(oEvent: Event) {
		this._oSoilDialogHandler.openDialogNewSoil(this._oEventDialog);  // to does this work with a dialog instead of a view?
	}

	activateRadioButton(oEvent: Event): void {
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
		this._oEventModel.setProperty('/soil', oSelectedDataNew);
	}

	onOpenDialogEditSoil(oEvent: Event) {
		const oSource = <Button>oEvent.getSource();
		const oSoil = <FBSoil>oSource.getBindingContext('soils')!.getObject();
		this._oSoilDialogHandler.openDialogEditSoil(oSoil, this._oEventDialog);  // todo does this work instead oif view?
	}

	onCancelAddOrEditEventDialog(oEvent: Event) {
		this._oEventDialog.close();
	}

	//////////////////////////////////////////////////////////
	// Shared Protected
	//////////////////////////////////////////////////////////
	protected _getSoilData(oEventEditData: LEventEditData): FBSoil | null {
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

	protected _getPotData(oEventEditData: LEventEditData): FBPot | null {
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

	protected _getObservationData(oEventEditData: LEventEditData): FBObservation | null {
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
}