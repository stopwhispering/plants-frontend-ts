sap.ui.define(["sap/m/MessageToast", "sap/ui/base/ManagedObject"], function (MessageToast, ManagedObject) {
  /**
   * @namespace plants.ui.customClasses
   */
  const ImageToTaxon = ManagedObject.extend("plants.ui.customClasses.ImageToTaxon", {
    assignImageToTaxon: function _assignImageToTaxon(oSource, oTaxonModel) {
      // triggered by clicking icon next to image in images list; moves the image to the taxon box

      // get image
      const oImage = oSource.getBindingContext('images').getObject();
      var oImageAssignment = {
        filename: oImage.filename,
        description: oImage.description // default description is image description, but may be altered later
      };

      // get current plant's taxon
      const oTaxon = oSource.getBindingContext('taxon').getObject();

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
    },
    unassignImageFromTaxon: function _unassignImageFromTaxon(oSource, oTaxonModel) {
      // triggered by clicking delete icon next to image in taxon box
      // unassigns the image from the taxon (without deleting any image)
      const oImageAssignment = oSource.getBindingContext('taxon').getObject();
      const sPathImageAssignmentToTaxon = oSource.getBindingContext('taxon').getPath();

      // var sPathImageAssignment = evt.getSource().getBindingContext('taxon').getPath();
      var sPathImages = sPathImageAssignmentToTaxon.substr(0, sPathImageAssignmentToTaxon.lastIndexOf('/'));
      var aImageAssignments = oTaxonModel.getProperty(sPathImages);
      var iPosition = aImageAssignments.indexOf(oImageAssignment);
      if (iPosition === -1) {
        MessageToast.show("Can't find image.");
        return;
      }
      aImageAssignments.splice(iPosition, 1);
      oTaxonModel.refresh(); //same like updateBindings(false)
    }
  });
  return ImageToTaxon;
});
//# sourceMappingURL=ImageToTaxon.js.map