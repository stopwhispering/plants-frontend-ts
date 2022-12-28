import MessageToast from "sap/m/MessageToast"
import ManagedObject from "sap/ui/base/ManagedObject";
import JSONModel from "sap/ui/model/json/JSONModel";
import { FBImage } from "plants/ui/definitions/Images";
import { FBEvent, FBImageAssignedToEvent } from "plants/ui/definitions/Events";

/**
 * @namespace plants.ui.customClasses.images
 */
export default class ImageToEventAssigner extends ManagedObject {

	public constructor() {
		super();
	}

	assignImageToEvent(oImage: FBImage, oSelectedEvent: FBEvent, oEventsModel: JSONModel) {
		// check if already assigned
		const aSelectedEventImages = <FBImageAssignedToEvent[]>oSelectedEvent.images;
		if (!!aSelectedEventImages && aSelectedEventImages.length > 0) {
			var oImageAssignmentFound = aSelectedEventImages.find(function (oCurrentImageAssignment) {
				return oCurrentImageAssignment.id === oImage.id;
			});
			if (oImageAssignmentFound) {
				// already assigned --> move to end of list
				var iIndex = aSelectedEventImages.indexOf(oImageAssignmentFound)
				aSelectedEventImages.splice(iIndex, 1);
				aSelectedEventImages.push(oImageAssignmentFound);
				MessageToast.show('Event already assigned to image. Moved to end of list.');
				oEventsModel.updateBindings(false);  // true not required here
				return;
			}
		}

		// assign and add assignment to end of list
		const oNewImageAssignedToEvent: FBImageAssignedToEvent = {
			id: oImage.id,
			filename: oImage.filename
		};
		if (!oSelectedEvent.images) {
			oSelectedEvent.images = <FBImageAssignedToEvent[]>[oNewImageAssignedToEvent];
		} else {
			oSelectedEvent.images.push(oNewImageAssignedToEvent);
		}
		MessageToast.show('Assigned.');
		oEventsModel.updateBindings(true);  // true required here
	}

	public unassignImageFromEvent(sEventsBindingPath: string, oEventsModel: JSONModel) {
		// triggered by unassign control next to an image in the events list
		var oEventsImage = oEventsModel.getProperty(sEventsBindingPath);

		var sEventImages = sEventsBindingPath.substring(0, sEventsBindingPath.lastIndexOf('/'));
		var aEventImages = oEventsModel.getProperty(sEventImages);

		var iPosition = aEventImages.indexOf(oEventsImage);
		if (iPosition === -1) {
			MessageToast.show("Can't find image.");
			return;
		}

		aEventImages.splice(iPosition, 1);
		oEventsModel.refresh();  //same like updateBindings(false)			
	}
}