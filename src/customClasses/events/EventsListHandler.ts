import ManagedObject from "sap/ui/base/ManagedObject";
import EventCRUD from "./EventCRUD";
import { FBEvent } from "../../definitions/Events";

/**
 * @namespace plants.ui.customClasses.events
 */
export default class EventsListHandler extends ManagedObject {

    private _oEventCRUD: EventCRUD;

    constructor(oEventCRUD: EventCRUD) {
        super();

        this._oEventCRUD = oEventCRUD;
        }   

	public deleteRow(oSelectedEvent: FBEvent): void {
		this._oEventCRUD.removeEvent(oSelectedEvent)
	}

}