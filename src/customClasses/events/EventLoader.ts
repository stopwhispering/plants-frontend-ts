import Util from "plants/ui/customClasses/shared/Util";
import ModelsHelper from "plants/ui/model/ModelsHelper"
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler"
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker";
import { BEvents, BResultsEventResource } from "plants/ui/definitions/Events";

/**
 * @namespace plants.ui.customClasses.events
 */
export default class EventLoader extends ManagedObject {

	private _oEventsModel: JSONModel;

	public constructor(oEventsModel: JSONModel) {
		super();

		this._oEventsModel = oEventsModel;
	}

	public loadEventsForPlant(iPlantId: int): void {
		// request plant's events from backend
		// data is added to local events model and bound to current view upon receivement
		const uri = 'events/' + iPlantId;
		$.ajax({
			url: Util.getServiceUrl(uri),
			context: this,
			async: true
		})
			.done(this._cbReceivingEventsForPlant.bind(this, iPlantId))
			.fail(ModelsHelper.onReceiveErrorGeneric.bind(this, 'Event (GET)'))
	}

	private _cbReceivingEventsForPlant(plantId: int, oData: BResultsEventResource): void {
		//insert (overwrite!) events data for current plant with data received from backend
		const aEvents = <BEvents>oData.events;
		this._oEventsModel.setProperty('/PlantsEventsDict/' + plantId + '/', aEvents);
		ChangeTracker.getInstance().setOriginalEventsForPlant(aEvents, plantId)
		MessageHandler.getInstance().addMessageFromBackend(oData.message);
	}
}