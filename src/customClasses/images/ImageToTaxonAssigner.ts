import MessageToast from "sap/m/MessageToast"
import ManagedObject from "sap/ui/base/ManagedObject";
import Icon from "sap/ui/core/Icon";
import JSONModel from "sap/ui/model/json/JSONModel";
import { TaxonRead, TaxonImageUpdate } from "plants/ui/definitions/Taxon";
import { ImageRead } from "plants/ui/definitions/Images";

/**
 * @namespace plants.ui.customClasses.images
 */
export default class ImageToTaxonAssigner extends ManagedObject {

	public assignImageToTaxon(oSource: Icon, oTaxonModel: JSONModel) {
		// triggered by clicking icon next to image in images list; moves the image to the taxon box

		// get image
		const oImage = <ImageRead>oSource.getBindingContext('images')!.getObject();
		var oImageAssignment = <TaxonImageUpdate>{
			id: oImage.id,
			description: oImage.description  // default description is image description, but may be altered later
		};

		// get current plant's taxon
		const oTaxon = <TaxonRead>oSource.getBindingContext('taxon')!.getObject();

		// check if already assigned
		if (!!oTaxon.images && oTaxon.images.length > 0) {
			var found = oTaxon.images.find(function (image) {
				return image.id === oImageAssignment.id;
			});
			if (found) {
				MessageToast.show('Taxon already assigned to image.');
				return;
			}
		}

		// assign
		if (!oTaxon.images) {
			oTaxon.images = [oImageAssignment];
		} else {
			oTaxon.images.push(oImageAssignment);
		}

		MessageToast.show('Assigned to taxon ' + oTaxon.name);
		oTaxonModel.updateBindings(false);
	}

	public unassignImageFromTaxon(oSource: Icon, oTaxonModel: JSONModel) {
		// triggered by clicking delete icon next to image in taxon box
		// unassigns the image from the taxon (without deleting any image)
		const oImageAssignment = <TaxonImageUpdate>oSource.getBindingContext('taxon')!.getObject();
		const sPathImageAssignmentToTaxon = oSource.getBindingContext('taxon')!.getPath();

		// var sPathImageAssignment = evt.getSource().getBindingContext('taxon').getPath();
		var sPathImages = sPathImageAssignmentToTaxon.substr(0, sPathImageAssignmentToTaxon.lastIndexOf('/'));

		var aImageAssignments = <TaxonImageUpdate[]>oTaxonModel.getProperty(sPathImages);
		var iPosition = aImageAssignments.indexOf(oImageAssignment);
		if (iPosition === -1) {
			MessageToast.show("Can't find image.");
			return;
		}

		aImageAssignments.splice(iPosition, 1);
		oTaxonModel.refresh();  //same like updateBindings(false)
	}

}