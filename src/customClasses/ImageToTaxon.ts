import MessageToast from "sap/m/MessageToast"
import ManagedObject from "sap/ui/base/ManagedObject";
import Icon from "sap/ui/core/Icon";
import JSONModel from "sap/ui/model/json/JSONModel";
import { FBImage } from "../definitions/Images";
import { FBTaxon, FBTaxonImage } from "../definitions/Taxon";

/**
 * @namespace plants.ui.customClasses
 */
export default class ImageToTaxon extends ManagedObject {

	public assignImageToTaxon(oSource: Icon, oTaxonModel: JSONModel) {
		// triggered by clicking icon next to image in images list; moves the image to the taxon box

		// get image
		const oImage = <FBImage>oSource.getBindingContext('images')!.getObject();
		var oImageAssignment = <FBTaxonImage>{
			filename: oImage.filename,
			description: oImage.description  // default description is image description, but may be altered later
		};

		// get current plant's taxon
		const oTaxon = <FBTaxon>oSource.getBindingContext('taxon')!.getObject();

		// check if already assigned
		if (!!oTaxon.images && oTaxon.images.length > 0) {
			var found = oTaxon.images.find(function (image) {
				return image.filename === oImageAssignment.filename;
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
		const oImageAssignment = <FBTaxonImage>oSource.getBindingContext('taxon')!.getObject();
		const sPathImageAssignmentToTaxon = oSource.getBindingContext('taxon')!.getPath();

		// var sPathImageAssignment = evt.getSource().getBindingContext('taxon').getPath();
		var sPathImages = sPathImageAssignmentToTaxon.substr(0, sPathImageAssignmentToTaxon.lastIndexOf('/'));

		var aImageAssignments = <FBTaxonImage[]>oTaxonModel.getProperty(sPathImages);
		var iPosition = aImageAssignments.indexOf(oImageAssignment);
		if (iPosition === -1) {
			MessageToast.show("Can't find image.");
			return;
		}

		aImageAssignments.splice(iPosition, 1);
		oTaxonModel.refresh();  //same like updateBindings(false)
	}

}