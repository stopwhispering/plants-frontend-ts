sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageBox", "plants/ui/customClasses/MessageUtil", "plants/ui/customClasses/Util", "sap/m/MessageToast", "plants/ui/model/ModelsHelper", "sap/ui/core/Fragment", "plants/ui/customClasses/Navigation", "sap/m/Dialog", "sap/m/Popover", "sap/m/ViewSettingsDialog"], function (Controller, MessageBox, __MessageUtil, Util, MessageToast, __ModelsHelper, Fragment, __Navigation, Dialog, Popover, ViewSettingsDialog) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const MessageUtil = _interopRequireDefault(__MessageUtil);
  const ModelsHelper = _interopRequireDefault(__ModelsHelper);
  const Navigation = _interopRequireDefault(__Navigation);
  /**
   * @namespace plants.ui.controller
   */
  const BaseController = Controller.extend("plants.ui.controller.BaseController", {
    constructor: function constructor() {
      Controller.prototype.constructor.apply(this, arguments);
      this.savingPlants = false;
      this.savingImages = false;
      this.savingTaxa = false;
      this.savingEvents = false;
      this.savingProperties = false;
      this.savingPropertiesTaxa = false;
    },
    onInit: function _onInit() {
      this.oComponent = this.getOwnerComponent();
      this.oRouter = this.oComponent.getRouter();
    },
    _getFragment: function _getFragment(sId) {
      //returns already-instantiated fragment by sId
      //if not sure wether instantiated, use applyToFragment
      return this.getView().byId(sId);
    },
    applyToFragment: function _applyToFragment(sId, fn, fnInit, mIdToFragment) {
      //create fragment singleton and apply supplied function to it (e.g. open, close)
      // if stuff needs to be done only once, supply fnInit wher^^e first usage happens

      //example usages:
      // this.applyToFragment('dialogDoSomething', _onOpenAddTagDialog.bind(this));
      // this.applyToFragment('dialogDoSomething', (o)=>o.close());
      // this.applyToFragment('dialogDoSomething', (o)=>{doA; doB; doC;}, fnMyInit);

      //fragment id to fragment file path
      if (!mIdToFragment) {
        mIdToFragment = {};
      }
      var oView = this.getView();
      if (oView.byId(sId)) {
        fn(oView.byId(sId));
      } else {
        Fragment.load({
          name: mIdToFragment[sId],
          id: oView.getId(),
          controller: this
        }).then(function (oFragment) {
          oView.addDependent(oFragment);
          if (fnInit) {
            fnInit(oFragment);
          }
          fn(oFragment);
        });
      }
    },
    getModifiedPlants: function _getModifiedPlants() {
      // get plants model and identify modified items
      var oModelPlants = this.oComponent.getModel('plants');
      var dDataPlants = oModelPlants.getData();
      var aModifiedPlants = [];
      var aOriginalPlants = this.oComponent.oPlantsDataClone['PlantsCollection'];
      for (var i = 0; i < dDataPlants['PlantsCollection'].length; i++) {
        if (!Util.dictsAreEqual(dDataPlants['PlantsCollection'][i], aOriginalPlants[i])) {
          // we need to check if our modified object differs only in structure of parent plant but still
          // has same parent pland id or none
          var oModified = Util.getClonedObject(dDataPlants['PlantsCollection'][i]);
          if (!!oModified.parent_plant && !oModified.parent_plant.id) {
            oModified.parent_plant = null;
          }
          if (!!oModified.parent_plant_pollen && !oModified.parent_plant_pollen.id) {
            oModified.parent_plant_pollen = null;
          }
          if (!Util.dictsAreEqual(oModified, aOriginalPlants[i])) {
            aModifiedPlants.push(dDataPlants['PlantsCollection'][i]);
          }
        }
      }
      return aModifiedPlants;
    },
    getModifiedTaxa: function _getModifiedTaxa() {
      // get taxon model and identify modified items
      // difference to plants and images: data is stored with key in a dictionary, not in an array
      // we identify the modified sub-dictionaries and return a list of these
      // note: we don't check whether there's a new taxon as after adding a taxon, it is added
      //	     to the clone as well
      // we don't check for deleted taxa as there's no function for doing this in frontend
      var oModelTaxon = this.oComponent.getModel('taxon');
      var dDataTaxon = oModelTaxon.getData().TaxaDict;
      var dDataTaxonOriginal = this.oComponent.oTaxonDataClone['TaxaDict'];

      //get taxon id's, i.e. keys of the taxa dict
      var keys_s = Object.keys(dDataTaxonOriginal);
      var keys = keys_s.map(k => parseInt(k));

      //for each key, check if it's value is different from the clone
      var aModifiedTaxonList = [];
      keys.forEach(function (key) {
        if (!Util.dictsAreEqual(dDataTaxonOriginal[key], dDataTaxon[key])) {
          aModifiedTaxonList.push(dDataTaxon[key]);
        }
      }, this);
      return aModifiedTaxonList;
    },
    _getModifiedEvents: function _getModifiedEvents() {
      // returns a dict with events for those plants where at least one event has been modified, added, or deleted
      const oModelEvents = this.oComponent.getModel('events');
      const oDataEvents = oModelEvents.getData().PlantsEventsDict;
      const oDataEventsClone = this.oComponent.oEventsDataClone;

      //get plants for which we have events in the original dataset
      //then, for each of them, check whether events have been changed
      let oModifiedEventsDict = {};
      const keys_clones = Object.keys(oDataEventsClone);
      const keys_clone = keys_clones.map(k => parseInt(k));
      keys_clone.forEach(function (key) {
        // if(!Util.arraysAreEqual(dDataEventsClone[key],
        if (!Util.objectsEqualManually(oDataEventsClone[key], oDataEvents[key])) {
          oModifiedEventsDict[key] = oDataEvents[key];
        }
      }, this);

      //added plants
      const keys_s = Object.keys(oDataEvents);
      const keys = keys_s.map(k => parseInt(k));
      keys.forEach(function (key) {
        if (!oDataEventsClone[key]) {
          oModifiedEventsDict[key] = oDataEvents[key];
        }
      }, this);
      return oModifiedEventsDict;
    },
    _getPropertiesSansTaxa: function _getPropertiesSansTaxa(dProperties_) {
      var dProperties = Util.getClonedObject(dProperties_);
      for (var i = 0; i < Object.keys(dProperties).length; i++) {
        const iPlantId = parseInt(Object.keys(dProperties)[i]);
        var oTaxonPropertiesInCategories = dProperties[iPlantId];
        for (var j = 0; j < oTaxonPropertiesInCategories.categories.length; j++) {
          var oCategory = oTaxonPropertiesInCategories.categories[j];

          // reverse-loop as we might need to delete a property (name) node within the loop
          for (var k = oCategory.properties.length - 1; k >= 0; k--) {
            var oProperty = oCategory.properties[k];

            // remove taxon property value
            var foundTaxonProperty = oProperty.property_values.find(element => element["type"] === "taxon");
            if (foundTaxonProperty) {
              var iIndex = oProperty.property_values.indexOf(foundTaxonProperty);
              oProperty.property_values.splice(iIndex, 1);
            }

            // if there's no plant property value, just remove the whole property name noe
            var foundPlantProperty = oProperty.property_values.find(element => element["type"] === "plant");
            if (!foundPlantProperty) oCategory.properties.splice(k, 1);
          }
        }
      }
      return dProperties;
    },
    _getModifiedPropertiesPlants: function _getModifiedPropertiesPlants() {
      // returns a dict with properties for those plants where at least one property has been modified, added, or deleted
      // for these plants, properties are supplied completely; modifications are then identified in backend
      const oModelProperties = this.oComponent.getModel('properties');
      const dDataProperties = oModelProperties.getData().propertiesPlants;
      // clean up the properties model data (returns a clone, not the original object!)
      const dDataPropertiesCleaned = this._getPropertiesSansTaxa(dDataProperties);
      const dDataPropertiesOriginal = this.oComponent.oPropertiesDataClone;

      // get plants for which we have properties in the original dataset
      // then, for each of them, check whether properties have been changed
      let dModifiedPropertiesDict = {};
      const keys_clone_s = Object.keys(dDataPropertiesOriginal);
      const keys_clone = keys_clone_s.map(k => parseInt(k));
      keys_clone.forEach(function (key) {
        // loop at plants
        if (!Util.objectsEqualManually(dDataPropertiesOriginal[key], dDataPropertiesCleaned[key])) {
          dModifiedPropertiesDict[key] = dDataPropertiesCleaned[key];
        }
      }, this);
      return dModifiedPropertiesDict;
    },
    _getModifiedPropertiesTaxa: function _getModifiedPropertiesTaxa() {
      const oModelProperties = this.oComponent.getModel('propertiesTaxa');
      const oDataPropertiesTaxon = oModelProperties.getData();
      const oPropertiesTaxon = oDataPropertiesTaxon.propertiesTaxon;
      const oPropertiesTaxonOriginal = this.oComponent.oPropertiesTaxonDataClone;
      if (!oPropertiesTaxonOriginal) {
        return {};
      }

      // get taxa for which we have properties in the original dataset
      // then, for each of them, check whether properties have been changed
      var oModifiedPropertiesDict = {};
      const keys_clone_s = Object.keys(oPropertiesTaxonOriginal);
      const keys_clone = keys_clone_s.map(key => parseInt(key));
      keys_clone.forEach(function (key) {
        // loop at plants
        if (!Util.objectsEqualManually(oPropertiesTaxonOriginal[key], oPropertiesTaxon[key])) {
          oModifiedPropertiesDict[key] = oPropertiesTaxon[key];
        }
      }, this);
      return oModifiedPropertiesDict;
    },
    getModifiedImages: function _getModifiedImages() {
      // identify modified images by comparing images with their clones (created after loading)
      var oImages = this.oComponent.imagesRegistry;
      var oImagesClone = this.oComponent.imagesRegistryClone;
      var aModifiedImages = [];
      Object.keys(oImages).forEach(path => {
        if (!(path in oImagesClone) || !Util.dictsAreEqual(oImages[path], oImagesClone[path])) {
          aModifiedImages.push(oImages[path]);
        }
      });
      return aModifiedImages;
    },
    savePlantsAndImages: function _savePlantsAndImages() {
      // saving images, plants, taxa, and events model
      Util.startBusyDialog('Saving...', 'Plants and Images');
      this.savingPlants = false;
      this.savingImages = false;
      this.savingTaxa = false;
      this.savingEvents = false;
      this.savingProperties = false;
      var aModifiedPlants = this.getModifiedPlants();
      var aModifiedImages = this.getModifiedImages();
      var aModifiedTaxa = this.getModifiedTaxa();
      var dModifiedEvents = this._getModifiedEvents();
      var dModifiedPropertiesPlants = this._getModifiedPropertiesPlants();
      var dModifiedPropertiesTaxa = this._getModifiedPropertiesTaxa();

      // cancel busydialog if nothing was modified (callbacks not triggered)
      if (aModifiedPlants.length === 0 && aModifiedImages.length === 0 && aModifiedTaxa.length === 0 && Object.keys(dModifiedEvents).length === 0 && Object.keys(dModifiedPropertiesPlants).length === 0 && Object.keys(dModifiedPropertiesTaxa).length === 0) {
        MessageToast.show('Nothing to save.');
        Util.stopBusyDialog();
        return;
      }

      // save plants
      if (aModifiedPlants.length > 0) {
        this.savingPlants = true; // required in callback function  to find out if both savings are finished
        var dPayloadPlants = {
          'PlantsCollection': aModifiedPlants
        };
        $.ajax({
          url: Util.getServiceUrl('plants/'),
          type: 'POST',
          contentType: "application/json",
          data: JSON.stringify(dPayloadPlants),
          context: this
        }).done(this._onAjaxSuccessSave).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Plant (POST)'));
      }

      // save images
      if (aModifiedImages.length > 0) {
        this.savingImages = true;
        var dPayloadImages = {
          'ImagesCollection': aModifiedImages
        };
        $.ajax({
          url: Util.getServiceUrl('images/'),
          type: 'PUT',
          contentType: "application/json",
          data: JSON.stringify(dPayloadImages),
          context: this
        }).done(this._onAjaxSuccessSave).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Image (PUT)'));
      }

      // save taxa
      if (aModifiedTaxa.length > 0) {
        this.savingTaxa = true;

        // cutting occurrence images (read-only)
        var aModifiedTaxaSave = Util.getClonedObject(aModifiedTaxa);
        aModifiedTaxaSave = aModifiedTaxaSave.map(m => {
          delete m.occurrenceImages;
          return m;
        });
        var dPayloadTaxa = {
          'ModifiedTaxaCollection': aModifiedTaxaSave
        };
        $.ajax({
          url: Util.getServiceUrl('taxa/'),
          type: 'PUT',
          contentType: "application/json",
          data: JSON.stringify(dPayloadTaxa),
          context: this
        }).done(this._onAjaxSuccessSave).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Taxon (POST)'));
      }

      // save events
      if (Object.keys(dModifiedEvents).length > 0) {
        this.savingEvents = true;
        var dPayloadEvents = {
          'plants_to_events': dModifiedEvents
        };
        $.ajax({
          url: Util.getServiceUrl('events/'),
          type: 'POST',
          contentType: "application/json",
          data: JSON.stringify(dPayloadEvents),
          context: this
        }).done(this._onAjaxSuccessSave).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Event (POST)'));
      }

      // save properties
      if (Object.keys(dModifiedPropertiesPlants).length > 0) {
        this.savingProperties = true;
        var dPayloadProperties = {
          'modifiedPropertiesPlants': dModifiedPropertiesPlants
        };
        $.ajax({
          url: Util.getServiceUrl('plant_properties/'),
          type: 'POST',
          contentType: "application/json",
          data: JSON.stringify(dPayloadProperties),
          context: this
        }).done(this._onAjaxSuccessSave).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'plant_properties (POST)'));
      }

      // save properties taxa
      if (Object.keys(dModifiedPropertiesTaxa).length > 0 || Object.keys(dModifiedPropertiesTaxa).length > 0) {
        this.savingPropertiesTaxa = true;
        var dPayloadPropertiesTaxa = {
          'modifiedPropertiesTaxa': dModifiedPropertiesTaxa
        };
        $.ajax({
          url: Util.getServiceUrl('taxon_properties/'),
          type: 'POST',
          contentType: "application/json",
          data: JSON.stringify(dPayloadPropertiesTaxa),
          context: this
        }).done(this._onAjaxSuccessSave).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'taxon_properties (POST)'));
      }
    },
    saveNewPlant: function _saveNewPlant(oPlant) {
      // save a new plant (only plant_name) to backend to receive plant id
      var dPayloadPlants = {
        'PlantsCollection': [oPlant]
      };
      Util.startBusyDialog('Creating...', 'new plant ' + oPlant.plant_name);
      var that = this;
      $.ajax({
        url: Util.getServiceUrl('plants/'),
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify(dPayloadPlants),
        context: this
      }).done(function (oData, sStatus, oReturnData) {
        // add new plant to model
        var oPlantSaved = oData.plants[0];
        var aPlants = that.oComponent.getModel('plants').getProperty('/PlantsCollection');
        var iPlantsCount = aPlants.push(oPlantSaved); // append at end to preserve change tracking with clone 
        that.oComponent.getModel('plants').updateBindings(false);

        // ...and add to cloned plants to allow change tracking
        var oPlantClone = Util.getClonedObject(oPlantSaved);
        that.oComponent.oPlantsDataClone.PlantsCollection.push(oPlantClone);
        MessageToast.show('Created plant ID ' + oPlantSaved.id + ' (' + oPlantSaved.plant_name + ')');

        // finally navigate to the newly created plant in details view
        // Navigation.navToPlantDetails.call(this, iPlantsCount-1);
        Navigation.getInstance().navToPlantDetails(oPlantSaved.id);
      }).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Plant (POST)')).always(function () {
        Util.stopBusyDialog();
      });
    },
    isPlantNameInPlantsModel: function _isPlantNameInPlantsModel(sPlantName) {
      var aPlants = this.oComponent.getModel('plants').getProperty('/PlantsCollection');
      return aPlants.find(ele => ele.plant_name === sPlantName) !== undefined;
    },
    getPlantById: function _getPlantById(plantId) {
      // todo replace other implementation of function with this here
      var aPlants = this.oComponent.getModel('plants').getProperty('/PlantsCollection');
      var oPlant = aPlants.find(ele => ele.id === plantId);
      if (oPlant === undefined) {
        throw "Plant not found";
      } else {
        return oPlant;
      }
    },
    getPlantByName: function _getPlantByName(plantName) {
      // todo replace other implementation of function with this here
      var plants = this.oComponent.getModel('plants').getProperty('/PlantsCollection');
      var plant = plants.find(ele => ele.plant_name === plantName);
      if (plant === undefined) {
        throw "Plant not found: " + plantName;
      } else {
        return plant;
      }
    },
    onAjaxSimpleSuccess: function _onAjaxSimpleSuccess(oConfirmation, sStatus, oReturnData) {
      //toast and create message
      //requires pre-defined message from backend
      MessageToast.show(oConfirmation.message.message);
      MessageUtil.getInstance().addMessageFromBackend(oConfirmation.message);
    },
    _onAjaxSuccessSave: function _onAjaxSuccessSave(oMsg, sStatus, oReturnData) {
      // cancel busydialog only if neither saving plants nor images or taxa is still running
      if (oMsg.resource === 'PlantResource') {
        this.savingPlants = false;
        var oModelPlants = this.oComponent.getModel('plants');
        var dDataPlants = oModelPlants.getData();
        this.oComponent.oPlantsDataClone = Util.getClonedObject(dDataPlants);
      } else if (oMsg.resource === 'ImageResource') {
        this.savingImages = false;
        var oImages = this.oComponent.imagesRegistry;
        this.oComponent.imagesRegistryClone = Util.getClonedObject(oImages);
        // var oModelImages = this.oComponent.getModel('images');
        // var dDataImages = oModelImages.getData();
        // this.oComponent.oImagesDataClone = Util.getClonedObject(dDataImages);
      } else if (oMsg.resource === 'TaxonResource') {
        this.savingTaxa = false;
        var oModelTaxon = this.oComponent.getModel('taxon');
        var dDataTaxon = oModelTaxon.getData();
        this.oComponent.oTaxonDataClone = Util.getClonedObject(dDataTaxon);
      } else if (oMsg.resource === 'EventResource') {
        this.savingEvents = false;
        var oModelEvents = this.oComponent.getModel('events');
        var dDataEvents = oModelEvents.getData();
        this.oComponent.oEventsDataClone = Util.getClonedObject(dDataEvents.PlantsEventsDict);
        MessageUtil.getInstance().addMessageFromBackend(oMsg.message);
      } else if (oMsg.resource === 'PropertyResource') {
        this.savingProperties = false;
        var oModelProperties = this.oComponent.getModel('properties');
        var dDataProperties = oModelProperties.getData();
        var propertiesPlantsWithoutTaxa = this._getPropertiesSansTaxa(dDataProperties.propertiesPlants);
        this.oComponent.oPropertiesDataClone = Util.getClonedObject(propertiesPlantsWithoutTaxa);
        MessageUtil.getInstance().addMessageFromBackend(oMsg.message);
      } else if (oMsg.resource === 'PropertyTaxaResource') {
        this.savingPropertiesTaxa = false;
        var oModelPropertiesTaxa = this.oComponent.getModel('propertiesTaxa');
        var dDataPropertiesTaxa = oModelPropertiesTaxa.getData();
        this.oComponent.oPropertiesTaxonDataClone = Util.getClonedObject(dDataPropertiesTaxa.propertiesTaxon);
        MessageUtil.getInstance().addMessageFromBackend(oMsg.message);
      }
      if (!this.savingPlants && !this.savingImages && !this.savingTaxa && !this.savingEvents && !this.savingProperties && !this.savingPropertiesTaxa) {
        Util.stopBusyDialog();
      }
    },
    updateTableHeaderPlantsCount: function _updateTableHeaderPlantsCount() {
      // update count in table header
      var iPlants = this.getView().byId("plantsTable").getBinding("items").getLength();
      var sTitle = "Plants (" + iPlants + ")";
      this.getView().byId("pageHeadingTitle").setText(sTitle);
    },
    handleErrorMessageBox: function _handleErrorMessageBox(sText) {
      var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
      MessageBox.error(sText, {
        styleClass: bCompact ? "sapUiSizeCompact" : ""
      });
    },
    onCancelDialog: function _onCancelDialog(oEvent) {
      // generic handler for fragments to be closed
      let oControl = oEvent.getSource();

      // navigate through the control tree until we have a sap.m.Dialog or a sap.m.Popover
      do {
        oControl = oControl.getParent();
      } while (oControl.getParent() !== undefined && !(oControl instanceof Dialog) && !(oControl instanceof Popover) && !(oControl instanceof ViewSettingsDialog));
      if (!oControl) {
        MessageToast.show("Error: Could not find Dialog or Popover to close");
        return;
      }
      oControl.close();

      // this.applyToFragment(dialogId, (oDialog: Dialog) => oDialog.close());
    },
    confirmDeleteImage: function _confirmDeleteImage(oImage, sAction) {
      // triggered by onIconPressDeleteImage's confirmation dialogue from both Untagged and Detail View
      if (sAction !== 'Delete') {
        return;
      }

      //send delete request
      var oPayload = {
        'images': [{
          'filename': oImage.filename
        }]
      };
      $.ajax({
        url: Util.getServiceUrl('images/'),
        type: 'DELETE',
        contentType: "application/json",
        data: JSON.stringify(oPayload),
        context: this
      }).done(this.onAjaxDeletedImagesSuccess.bind(this, [oImage], undefined)).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Image (DELETE)'));
    },
    onAjaxDeletedImagesSuccess: function _onAjaxDeletedImagesSuccess(aDeletedImages, cbCallback, data, textStats, jqXHR) {
      //show default success message after successfully deleting image in backend (either from untagged or detail view)
      this.onAjaxSimpleSuccess(data, textStats, jqXHR);

      // delete image in models...
      const oImagesModel = this.oComponent.getModel('images');
      const oUntaggedImagesModel = this.oComponent.getModel('untaggedImages');
      var aDataImages = oImagesModel.getData().ImagesCollection;
      var aDataUntagged = oUntaggedImagesModel.getData().ImagesCollection;
      var context = this; // for the closure
      aDeletedImages.forEach(function (image) {
        var iPosImages = aDataImages.indexOf(image);
        if (iPosImages >= 0) {
          aDataImages.splice(iPosImages, 1);
        }
        var iPosImages = aDataUntagged.indexOf(image);
        if (iPosImages >= 0) {
          aDataUntagged.splice(iPosImages, 1);
        }

        //... and deleted image in images registry
        delete context.oComponent.imagesRegistry[image.filename];
        delete context.oComponent.imagesRegistry[image.filename];
        delete context.oComponent.imagesRegistryClone[image.filename];
      });
      this.oComponent.getModel('images').refresh();
      this.oComponent.getModel('untaggedImages').refresh();
      if (!!cbCallback) {
        cbCallback();
      }
    },
    onReceiveSuccessGeneric: function _onReceiveSuccessGeneric(oMsg) {
      Util.stopBusyDialog();
      MessageToast.show(oMsg.message);
      MessageUtil.getInstance().addMessageFromBackend(oMsg);
    },
    addPhotosToRegistry: function _addPhotosToRegistry(aPhotos) {
      ///////////////TODOOOOOOOOo why is there a method with same name in the component????///////////7
      // add photos loaded for a plant to the registry if not already loaded with other plant
      // plus add a copy of the photo to a clone registry for getting changed photos when saving 
      aPhotos.forEach(photo => {
        if (!(photo.filename in this.oComponent.imagesRegistry)) {
          this.oComponent.imagesRegistry[photo.filename] = photo;
          this.oComponent.imagesRegistryClone[photo.filename] = Util.getClonedObject(photo);
        }
      });
    },
    resetImagesCurrentPlant: function _resetImagesCurrentPlant(plant_id) {
      // @ts-ignore // typescript doesn't like Object.entries
      const aPhotosArr = Object.entries(this.oComponent.imagesRegistry).filter(t => t[1].plants.filter(p => p.plant_id === plant_id).length == 1);
      var aPhotos = aPhotosArr.map(p => p[1]);
      this.oComponent.getModel('images').setProperty('/ImagesCollection', aPhotos);
      Util.stopBusyDialog(); // had been started in details onPatternMatched
    },
    getSuggestionItem: function _getSuggestionItem(rootKey, key) {
      // retrieve an item from suggestions model via root key and key
      // example usage: var selected = getSuggestionItem('propagationTypeCollection', 'bulbil');
      let suggestions;
      switch (rootKey) {
        case 'propagationTypeCollection':
          suggestions = this.oComponent.getModel('suggestions').getProperty('/' + rootKey);
          break;
        default:
          throw "Root Key not found: " + rootKey;
      }
      const suggestion = suggestions.find(s => s['key'] === key);
      if (!suggestion) {
        throw "Suggestion Key not found: " + key;
      }
      return suggestion;
    }
  });
  return BaseController;
});
//# sourceMappingURL=BaseController.js.map