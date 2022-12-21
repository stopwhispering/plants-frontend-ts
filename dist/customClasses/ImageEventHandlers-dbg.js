sap.ui.define(["sap/m/MessageToast", "plants/ui/customClasses/Util", "sap/ui/base/ManagedObject"], function (MessageToast, Util, ManagedObject) {
  /**
   * @namespace plants.ui.customClasses
   */
  const ImageEventHandlers = ManagedObject.extend("plants.ui.customClasses.ImageEventHandlers", {
    constructor: function _constructor(applyToFragment) {
      ManagedObject.prototype.constructor.call(this);
      this.applyToFragment = applyToFragment;
    },
    assignPlantToImage: function _assignPlantToImage(oPlant, oImage, oImagesModel) {
      //add a plant to image in images model
      //currently triggered when ...
      // assigning an image in untagged view to the plant in details view
      // assigning an image in untagged view to a plant chosen via  input suggestions
      // assigning an image in detail view to a plant chosen via input suggestions
      var aCurrentlyAssignedPlants = oImage.plants;
      var oNewlyAssignedPlant = {
        plant_id: oPlant.id,
        key: oPlant.plant_name,
        text: oPlant.plant_name
      };

      // check if already in list
      if (Util.isDictKeyInArray(oNewlyAssignedPlant, aCurrentlyAssignedPlants)) {
        MessageToast.show('Plant Name already assigned. ');
        return false;
      } else {
        aCurrentlyAssignedPlants.push(oNewlyAssignedPlant);
        console.log('Assigned plant to image: ' + oPlant.plant_name + ' (' + oPlant.id + ')');
        oImagesModel.updateBindings(false);
        return true;
      }
    },
    assignImageToEvent: function _assignImageToEvent(oSource) {
      // triggered by icon beside image; assign that image to one of the plant's events
      // generate dialog from fragment if not already instantiated
      var sPathCurrentImage = oSource.getBindingContext("images").getPath();
      this.applyToFragment('dialogAssignEventToImage', oPopover => {
        // bind the selected image's path in images model to the popover dialog
        oPopover.bindElement({
          path: sPathCurrentImage,
          model: "images"
        });
        oPopover.openBy(oSource, true);
      });
    },
    assignEventToImage: function _assignEventToImage(oSource, oEventsModel, oPopoverAssignEventToImage) {
      const oImage = oSource.getBindingContext('images').getObject();

      // get image
      var oImageAssignment = {
        filename: oImage.filename
      };

      // check if already assigned
      const oSelectedEvent = oSource.getBindingContext('events').getObject();
      if (!!oSelectedEvent.images && oSelectedEvent.images.length > 0) {
        var found = oSelectedEvent.images.find(function (image) {
          return image.filename === oImageAssignment.filename;
        });
        if (found) {
          MessageToast.show('Event already assigned to image.');
          oPopoverAssignEventToImage.close();
          return;
        }
      }

      // assign
      if (!oSelectedEvent.images) {
        oSelectedEvent.images = [oImageAssignment];
      } else {
        oSelectedEvent.images.push(oImageAssignment);
      }
      MessageToast.show('Assigned.');
      oEventsModel.updateBindings(false);
      oPopoverAssignEventToImage.close();
    },
    unassignImageFromEvent: function _unassignImageFromEvent(sEventsBindingPath, oEventsModel) {
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
      oEventsModel.refresh(); //same like updateBindings(false)			
    },
    handleTypeMissmatch: function _handleTypeMissmatch(oFileUpload, sFileType) {
      var aFileTypes = oFileUpload.getFileType().map(ele => "*." + ele);
      var sSupportedFileTypes = aFileTypes.join(", ");
      MessageToast.show("The file type *." + sFileType + " is not supported. Choose one of the following types: " + sSupportedFileTypes);
    },
    removeTokenFromModel: function _removeTokenFromModel(sKey, oImage, oModel, sType) {
      // triggered upon changes of image's plant assignments and image's keywords
      // either in untagged view or in detail view
      // sKey is either a keyword or a plant name
      // note: the token itself has already been deleted; here, we only delete the 
      // 		 corresponding entry from the model

      // find plant/keyword in the image's corresponding array and delete
      if (sType === 'plant') {
        const aPlantTags = oImage.plants;
        const iIndex = aPlantTags.findIndex(ele => ele.key === sKey);
        aPlantTags.splice(iIndex, 1);
      } else {
        //'keyword'
        const aKeywordTags = oImage.keywords;
        const iIndex = aKeywordTags.findIndex(ele => ele.keyword === sKey);
        aKeywordTags.splice(iIndex, 1);
      }
      oModel.updateBindings(false);
    }
  });
  ImageEventHandlers.getInstance = function getInstance(applyToFragment) {
    if (!ImageEventHandlers._instance && applyToFragment) {
      ImageEventHandlers._instance = new ImageEventHandlers(applyToFragment);
    }
    return ImageEventHandlers._instance;
  };
  return ImageEventHandlers;
});
//# sourceMappingURL=ImageEventHandlers.js.map