sap.ui.define(["sap/m/MessageToast", "plants/ui/customClasses/Util", "plants/ui/customClasses/Navigation", "sap/ui/base/ManagedObject"], function (MessageToast, Util, __Navigation, ManagedObject) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const Navigation = _interopRequireDefault(__Navigation);
  /**
   * @namespace plants.ui.customClasses
   */
  const ImageUtil = ManagedObject.extend("plants.ui.customClasses.ImageUtil", {
    constructor: function constructor() {
      ManagedObject.prototype.constructor.apply(this, arguments);
      this.navigation = Navigation.getInstance();
    },
    onInputImageNewPlantNameSubmit: function _onInputImageNewPlantNameSubmit(evt) {
      // on enter add new plant to image in model
      // called by either submitting input or selecting from suggestion table (both with different model)
      var sModel = evt.getSource().data('sModel');
      if (evt.getId() === 'suggestionItemSelected') {
        // var sPlantName = evt.getParameter('selectedRow').getCells()[0].getText();
        var sPlantName = evt.getParameter('selectedRow').getBindingContext('plants').getObject().plant_name;
      } else {
        sPlantName = evt.getParameter('value').trim(); //submit disabled
      }

      //check if plant exists and is not empty
      if (!this.isPlantNameInPlantsModel(sPlantName) || !sPlantName) {
        MessageToast.show('Plant Name does not exist.');
        return;
      }

      //add to model
      var oBindingContextImage = evt.getSource().getParent().getBindingContext(sModel);
      var sPlantId = this.getPlantId(sPlantName);
      this.ImageUtil._addPlantNameToImage(sPlantName, sPlantId, oBindingContextImage);
      evt.getSource().setValue('');
    },
    onIconPressTagDetailsPlant: function _onIconPressTagDetailsPlant(evt) {
      //adds current plant in details view to the image in untagged view
      var oPlant = this.getPlantById(this._currentPlantId);
      var oBindingContextImage = evt.getSource().getParent().getBindingContext("untaggedImages");
      this.ImageUtil._addPlantNameToImage(oPlant.plant_name, oPlant.id, oBindingContextImage);
      // have details view images updated
      this.resetImagesCurrentPlant(this._currentPlantId);
    },
    _addPlantNameToImage: function _addPlantNameToImage(sPlantName, sPlantId, oBindingContextImage) {
      //add a plant (by name) to image in images model
      var aCurrentPlantNames = oBindingContextImage.getObject().plants;
      var dictPlant = {
        key: sPlantName,
        text: sPlantName,
        plant_id: sPlantId
      };

      // check if already in list
      if (Util.isDictKeyInArray(dictPlant, aCurrentPlantNames)) {
        MessageToast.show('Plant Name already assigned. ');
        return false;
      } else {
        aCurrentPlantNames.push(dictPlant);
        console.log('Assigned plant to image: ' + sPlantName + ' (' + oBindingContextImage.getPath() + ')');
        oBindingContextImage.getModel().updateBindings();
        return true;
      }
    },
    onPressImagePlantToken: function _onPressImagePlantToken(modelName, evt) {
      //model is either images or untaggedImages
      var iIndexPlant = evt.getSource().getBindingContext(modelName).getObject().plant_id;
      if (iIndexPlant >= 0) {
        //navigate to plant in layout's current column (i.e. middle column)
        this.navigation.navToPlantDetails.call(this, iIndexPlant);
      } else {
        this.handleErrorMessageBox("Can't find selected Plant");
      }
    },
    onIconPressAssignImageToEvent: function _onIconPressAssignImageToEvent(evt) {
      // triggered by icon beside image; assign that image to one of the plant's events
      // generate dialog from fragment if not already instantiated
      var oSource = evt.getSource();
      var sPathCurrentImage = evt.getSource().getBindingContext("images").getPath();
      this.applyToFragment('dialogAssignEventToImage', o => {
        // bind the selected image's path in images model to the popover dialog
        o.bindElement({
          path: sPathCurrentImage,
          model: "images"
        });
        o.openBy(oSource);
      });
    },
    onAssignEventToImage: function _onAssignEventToImage(evt) {
      // triggered upon selection of event in event selection dialog for an image
      // get selected event
      var sPathSelectedEvent = evt.getSource().getBindingContextPath('events');

      // get image
      var oImage = evt.getSource().getBindingContext('images').getObject();
      var oImageAssignment = {
        filename: oImage.filename
      };

      // check if already assigned
      var oEvent = this.getView().getModel('events').getProperty(sPathSelectedEvent);
      if (!!oEvent.images && oEvent.images.length > 0) {
        var found = oEvent.images.find(function (image) {
          return image.filename === oImageAssignment.filename;
        });
        if (found) {
          MessageToast.show('Event already assigned to image.');
          this._getFragment('dialogAssignEventToImage').close();
          return;
        }
      }

      // assign
      if (!oEvent.images) {
        oEvent.images = [oImageAssignment];
      } else {
        oEvent.images.push(oImageAssignment);
      }
      MessageToast.show('Assigned.');
      this.getView().getModel('events').updateBindings();
      this._getFragment('dialogAssignEventToImage').close();
    },
    onIconPressUnassignImageFromEvent: function _onIconPressUnassignImageFromEvent(evt) {
      // triggered by unassign control next to an image in the events list
      var sPath = evt.getParameter('listItem').getBindingContextPath('events');
      var oImage = evt.getSource().getModel('events').getProperty(sPath);
      var sEventImages = sPath.substring(0, sPath.lastIndexOf('/'));
      var aEventImages = this.getOwnerComponent().getModel('events').getProperty(sEventImages);
      var iPosition = aEventImages.indexOf(oImage);
      if (iPosition === -1) {
        MessageToast.show("Can't find image.");
        return;
      }
      aEventImages.splice(iPosition, 1);
      this.getOwnerComponent().getModel('events').refresh(); //same like updateBindings()			
    }
  });
  ImageUtil.getInstance = function getInstance() {
    if (!ImageUtil._instance) {
      ImageUtil._instance = new ImageUtil();
    }
    return ImageUtil._instance;
  };
  return ImageUtil;
});
//# sourceMappingURL=ImageUtil.js.map