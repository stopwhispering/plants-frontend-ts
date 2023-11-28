import ManagedObject from "sap/ui/base/ManagedObject";
import EventCRUD from "./EventCRUD";
import { EventRead } from "../../definitions/Events";

/**
 * @namespace plants.ui.customClasses.events
 */
export default class EventsListHandler extends ManagedObject {

    private _oEventCRUD: EventCRUD;

    constructor(oEventCRUD: EventCRUD) {
        super();

        this._oEventCRUD = oEventCRUD;
        }   

	public deleteRow(oSelectedEvent: EventRead): void {
		this._oEventCRUD.removeEvent(oSelectedEvent)
	}

}