import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import EventCRUD from "../customClasses/events/EventCRUD";
import { FBEvent } from "../definitions/Events";

/**
 * @namespace plants.ui.controller
 */
export default class EventsListHandler extends ManagedObject {

    private _oEventsModel: JSONModel;
    private _oEventCRUD: EventCRUD;

    constructor(oEventsModel: JSONModel, oEventCRUD: EventCRUD) {
        super();

        this._oEventsModel = oEventsModel;
        this._oEventCRUD = oEventCRUD;
        }   

	public deleteRow(oSelectedEvent: FBEvent): void {
		this._oEventCRUD.removeEvent(oSelectedEvent, this._oEventsModel)
	}

}