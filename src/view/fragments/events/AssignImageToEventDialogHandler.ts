import ManagedObject from "sap/ui/base/ManagedObject";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import Event from "sap/ui/base/Event";
import Control from "sap/ui/core/Control";
import GridListItem from "sap/f/GridListItem";
import JSONModel from "sap/ui/model/json/JSONModel";
import { FBImage } from "plants/ui/definitions/Images";
import { FBEvent } from "plants/ui/definitions/Events";
import ImageToEventAssigner from "plants/ui/customClasses/images/ImageToEventAssigner";
import Popover from "sap/m/Popover";

/**
 * @namespace plants.ui.view.fragments.events
 */
export default class AssignImageToEventDialogHandler extends ManagedObject {
    private _oEventsModel: JSONModel;  // "events"

    private _oAssignImageToEventDialog: Popover;  // "dialogAssignEventToImage"

    public constructor(oEventsModel: JSONModel) {
        super();
        this._oEventsModel = oEventsModel;
    }

    openAssignImageToEventDialog(oAttachToView: View, oOpenBy: Control, sPathCurrentImage: string) {
        // open dialog to attach an image to an event
        // opened from the images list
        // sPathCurrentImage is the path to the image in the images model
        if (!this._oAssignImageToEventDialog) {
            Fragment.load({
                name: "plants.ui.view.fragments.events.DetailAssignEvent",
                id: oAttachToView.getId(),
                controller: this
            }).then((oControl: Control | Control[]) => {
                this._oAssignImageToEventDialog = <Popover>oControl;
                oAttachToView.addDependent(this._oAssignImageToEventDialog);
                this._oAssignImageToEventDialog.bindElement({
                    path: sPathCurrentImage,
                    model: "images"
                });
                this._oAssignImageToEventDialog.openBy(oOpenBy, true);
            });
        } else {
            this._oAssignImageToEventDialog.bindElement({
                path: sPathCurrentImage,
                model: "images"
            });
            this._oAssignImageToEventDialog.openBy(oOpenBy, true);
        }
    }

    onSelectEventForImage(oEvent: Event) {
        // triggered upon selection of event in event selection dialog for an image get selected event
        const oSource = <GridListItem>oEvent.getSource();
        const oImage = <FBImage>oSource.getBindingContext('images')!.getObject();
        const oSelectedEvent = <FBEvent>oSource.getBindingContext('events')!.getObject();
        new ImageToEventAssigner().assignImageToEvent(oImage, oSelectedEvent, this._oEventsModel);
        this._oAssignImageToEventDialog.close();
    }



}