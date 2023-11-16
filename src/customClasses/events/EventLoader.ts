import Util from "plants/ui/customClasses/shared/Util";
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler"
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker";
import { BEvents, BResultsEventResource, PlantFlowerYearRead } from "plants/ui/definitions/Events";
import ErrorHandling from "../shared/ErrorHandling";

/**
 * @namespace plants.ui.customClasses.events
 */
export default class EventLoader extends ManagedObject {

	private _oEventsModel: JSONModel;
	private _oFlowerHistoryModel: JSONModel;

	public constructor(oEventsModel: JSONModel,
		oFlowerHistoryModel: JSONModel) {
		super();

		this._oEventsModel = oEventsModel;
		this._oFlowerHistoryModel = oFlowerHistoryModel; 
	}

	public async loadEventsForPlant(iPlantId: int) {
		// request plant's events (incl flower history) from backend
		// data is added to local events model and bound to current view upon receivement

		const oResult: BResultsEventResource = await Util.get(Util.getServiceUrl('events/' + iPlantId));
		this._cbReceivingEventsForPlant(iPlantId, oResult);
	}

	private _cbReceivingEventsForPlant(plantId: int, oData: BResultsEventResource): void {
		//insert (overwrite!) events data for current plant with data received from backend
		const aEvents = <BEvents>oData.events;
		this._oEventsModel.setProperty('/PlantsEventsDict/' + plantId + '/', aEvents);
		ChangeTracker.getInstance().setOriginalEventsForPlant(aEvents, plantId)

		//set/override flower history (read only)
		const aFlowerHistory = <PlantFlowerYearRead[]>oData.flower_history;
		this._oFlowerHistoryModel.setProperty('/PlantsFlowerHistoryDict/' + plantId + '/', aFlowerHistory);
		
		MessageHandler.getInstance().addMessageFromBackend(oData.message);
	}
}