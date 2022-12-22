sap.ui.define(["plants/ui/customClasses/Util", "sap/m/MessageToast", "sap/ui/model/json/JSONModel", "sap/ui/layout/Grid", "sap/ui/layout/GridData", "sap/m/CustomListItem", "sap/ui/base/ManagedObject", "../model/ModelsHelper"], function (Util, MessageToast, JSONModel, Grid, GridData, CustomListItem, ManagedObject, __ModelsHelper) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const ModelsHelper = _interopRequireDefault(__ModelsHelper);
  /**
   * @namespace plants.ui.customClasses
   */
  const EventsUtil = ManagedObject.extend("plants.ui.customClasses.EventsUtil", {
    constructor: function _constructor(applyToFragment, oSuggestionsData) {
      ManagedObject.prototype.constructor.call(this);
      this.modelsHelper = ModelsHelper.getInstance();
      this.applyToFragment = applyToFragment;
      this.oSuggestionsData = oSuggestionsData;
    },
    eventsListFactory: function _eventsListFactory(sId, oBindingContext) {
      //executed in Detail Controller Context
      let that = this;
      var sContextPath = oBindingContext.getPath();
      var oEvent = oBindingContext.getObject();
      var oListItem = new CustomListItem({});
      oListItem.addStyleClass('sapUiTinyMarginBottom');
      var oGrid = new Grid({
        defaultSpan: "XL3 L3 M6 S12"
      });
      oListItem.addContent(oGrid);
      var oFragmentHeader = that.byId("eventHeader").clone(sId);
      oGrid.addContent(oFragmentHeader);
      if (!!oEvent.observation) {
        var oContainerObservation = that.byId("eventObservation").clone(sId);
        oGrid.addContent(oContainerObservation);
      }
      if (!!oEvent.pot) {
        var oContainerPot = that.byId("eventPot").clone(sId);
        oGrid.addContent(oContainerPot);
      }
      if (!!oEvent.soil) {
        var oContainerSoil = that.byId("eventSoil").clone(sId);
        oGrid.addContent(oContainerSoil);
      }

      // we want the images item to get the rest of the row or the whole next row if current row is almost full 
      // calculate number of cols in grid layout for images container in screen sizes xl/l
      // todo: switch from grid layout to the new (with 1.60) gridlist, where the following is probably
      // not required
      var iCols = oGrid.getContent().length * 3 - 1;
      if (12 - iCols < 3) {
        var sColsImageContainerL = "XL12 L12";
      } else {
        sColsImageContainerL = "XL" + (12 - iCols) + " L" + (12 - iCols);
      }
      var sColsContainer = sColsImageContainerL + " M6 S12";
      var oContainerOneImage = that.byId("eventImageListItem").clone(sId);

      // add items aggregation binding
      var oContainerImages = that.byId("eventImageContainer").clone(sId);
      oContainerImages.bindAggregation('items', {
        path: "events>" + sContextPath + "/images",
        template: oContainerOneImage,
        templateShareable: false
      });

      // add layoutData aggregation binding to set number of columns in outer grid
      oContainerImages.setLayoutData(new GridData({
        span: sColsContainer
      }));
      oGrid.addContent(oContainerImages);
      return oListItem;
    },
    deleteEventsTableRow: function _deleteEventsTableRow(oSelectedEvent, oEventsModel, oCurrentPlant) {
      // deleting row from events table

      var aEvents = oEventsModel.getProperty('/PlantsEventsDict/' + oCurrentPlant.id);

      // delete the item from array
      var iIndex = aEvents.indexOf(oSelectedEvent);
      if (iIndex < 0) {
        MessageToast.show('An error happended in internal processing of deletion.');
        return;
      }
      aEvents.splice(iIndex, 1);
      oEventsModel.refresh();
    },
    _getObservationData: function _getObservationData(oEventEditData) {
      //returns the cleansed observation data from the event edit data
      if (!oEventEditData.segments.observation) return null;
      const oObservationDataClone = JSON.parse(JSON.stringify(oEventEditData.observation));
      // if height or diameter are 0, reset them to undefined
      if (oObservationDataClone.height === 0.0) {
        oObservationDataClone.height = undefined;
      }
      if (oObservationDataClone.stem_max_diameter === 0.0) {
        oObservationDataClone.stem_max_diameter = undefined;
      }
      if (!oObservationDataClone.diseases || oObservationDataClone.diseases.length === 0) {
        oObservationDataClone.diseases = undefined;
      }
      if (!oObservationDataClone.observation_notes || oObservationDataClone.observation_notes === 0) {
        oObservationDataClone.observation_notes = undefined;
      }
      return oObservationDataClone;
    },
    _getPotData: function _getPotData(oEventEditData, oView) {
      //loads, parses, and cleanses the pot data from the the dialog control
      if (!oEventEditData.segments.pot) return null;
      const oPotDataClone = JSON.parse(JSON.stringify(oEventEditData.pot));
      if (oView.byId('idPotHeight0').getSelected()) {
        oPotDataClone.shape_side = 'very flat';
      } else if (oView.byId('idPotHeight1').getSelected()) {
        oPotDataClone.shape_side = 'flat';
      } else if (oView.byId('idPotHeight2').getSelected()) {
        oPotDataClone.shape_side = 'high';
      } else if (oView.byId('idPotHeight3').getSelected()) {
        oPotDataClone.shape_side = 'very high';
      } else {
        throw new Error('Pot height not selected');
      }
      if (oView.byId('idPotShape0').getSelected()) {
        oPotDataClone.shape_top = 'square';
      } else if (oView.byId('idPotShape1').getSelected()) {
        oPotDataClone.shape_top = 'round';
      } else if (oView.byId('idPotShape2').getSelected()) {
        oPotDataClone.shape_top = 'oval';
      } else if (oView.byId('idPotShape3').getSelected()) {
        oPotDataClone.shape_top = 'hexagonal';
      } else {
        throw new Error('Pot shape not selected');
      }
      return oPotDataClone;
    },
    _getSoilData: function _getSoilData(oEventEditData, oView) {
      //loads, parses, and cleanses the soil data from the the dialog control
      //note: we submit the whole soil object to the backend, but the backend does only care about the id
      //      for modifying or creating a soil, there's a separate service
      //      however, we parse the whole object here to make sure we have the correct data
      if (!oEventEditData.segments.soil) return null;
      const oSoilDataClone = JSON.parse(JSON.stringify(oEventEditData.soil));
      if (!oSoilDataClone.description || oSoilDataClone.description.length == 0) {
        oSoilDataClone.description = undefined;
      }
      return oSoilDataClone;
    },
    _loadSoils: function _loadSoils(oView) {
      // triggered when opening dialog to add/edit event
      // get soils collection from backend proposals resource
      var sUrl = Util.getServiceUrl('events/soils');
      let oSoilsModel = oView.getModel('soils');
      if (!oSoilsModel) {
        oSoilsModel = new JSONModel(sUrl);
        oView.setModel(oSoilsModel, 'soils');
      } else {
        oSoilsModel.loadData(sUrl);
      }
    },
    _addEvent: function _addEvent(oView, oEventsModel, aEventsCurrentPlant) {
      //triggered by add button in add/edit event dialog
      //validates and filters data to be saved

      // get new event data
      const oDialog = oView.byId('dialogEvent');
      const oNewEventModel = oDialog.getModel("editOrNewEvent");
      const oNewEventData = oNewEventModel.getData();

      // assert date matches pattern "YYYY-MM-DD"
      Util.assertCorrectDate(oNewEventData.date);
      this._assertNoDuplicateOnDate(aEventsCurrentPlant, oNewEventData.date);

      // clone the data so we won't change the original new model
      const oNewEventSave = Util.getClonedObject(oNewEventData);
      if (oNewEventSave.segments.soil && (!oNewEventSave.soil || !oNewEventSave.soil.id)) {
        MessageToast.show('Please choose soil first.');
        return;
      }

      // get the data in the dialog's segments
      const oNewObservation = this._getObservationData(oNewEventSave);
      const oNewPot = this._getPotData(oNewEventSave, oView);
      const oNewSoil = this._getSoilData(oNewEventSave, oView);
      const oNewEvent = {
        // id: number; no id, yet
        date: oNewEventSave.date,
        event_notes: oNewEventSave.event_notes,
        observation: oNewObservation,
        pot: oNewPot,
        soil: oNewSoil,
        plant_id: oNewEventSave.plant_id,
        images: []
      };

      // actual saving is done upon hitting save button
      // here, we only update the events model
      aEventsCurrentPlant.push(oNewEvent);
      oEventsModel.updateBindings(false);
      oDialog.close();
    },
    _assertNoDuplicateOnDate: function _assertNoDuplicateOnDate(aEventsCurrentPlant, sDate, oEvent) {
      // make sure there's only one event per day and plant (otherwise backend problems would occur)
      // if new event data is supplied, we're editing an event and need to make sure we're not comparing the event to itself
      const found = aEventsCurrentPlant.find(function (element) {
        return element.date === sDate && element !== oEvent;
      });
      if (!!found) {
        MessageToast.show('Duplicate event on that date.');
        throw new Error('Duplicate event on that date.');
      }
    },
    _editEvent: function _editEvent(oView, oEventsModel, aEventsCurrentPlant) {
      //triggered by addOrEditEvent
      //triggered by button in add/edit event dialog
      //validates and filters data to be saved and triggers saving

      // get new event data
      const oDialog = oView.byId('dialogEvent');
      const oEditEventModel = oDialog.getModel("editOrNewEvent");
      const oEventEditData = oEditEventModel.getData();

      // old record (which we are updating as it is a pointer to the events model itself) is hidden as a property in the new model
      if (!oEventEditData.oldEvent) {
        MessageToast.show("Can't determine old record. Aborting.");
        return;
      }
      const oOldEvent = oEventEditData.oldEvent;

      // assert date matches pattern "YYYY-MM-DD"
      Util.assertCorrectDate(oEventEditData.date);
      this._assertNoDuplicateOnDate(aEventsCurrentPlant, oEventEditData.date, oOldEvent);
      if (oOldEvent.plant_id !== oEventEditData.plant_id) {
        MessageToast.show('Plant ID cannot be changed.');
        throw new Error('Plant ID cannot be changed.');
      }
      if (oEventEditData.segments.soil && (!oEventEditData.soil || !oEventEditData.soil.id)) {
        MessageToast.show('Please choose soil first.');
        return;
      }

      // get the data in the dialog's segments
      const oEditedObservation = this._getObservationData(oEventEditData);
      const oEditedPot = this._getPotData(oEventEditData, oView);
      const oEditedSoil = this._getSoilData(oEventEditData, oView);

      // update each attribute from the new model into the old event
      oOldEvent.date = oEventEditData.date;
      oOldEvent.event_notes = oEventEditData.event_notes && oEventEditData.event_notes.length > 0 ? oEventEditData.event_notes : undefined;
      const iOldObservationId = oEditedObservation ? oEditedObservation.id : undefined;
      oOldEvent.observation = oEditedObservation;
      if (oOldEvent.observation) oOldEvent.observation.id = iOldObservationId;
      oOldEvent.pot = oEditedPot;
      oOldEvent.soil = oEditedSoil;

      // have events factory function in details controller regenerate the events list
      oEventsModel.updateBindings(false); // we updated a proprety of that model
      oEventsModel.refresh(true);
      oDialog.close();
    },
    addOrEditEvent: function _addOrEditEvent(oView, oCurrentPlant) {
      var oDialog = oView.byId('dialogEvent');
      var oNewEventModel = oDialog.getModel("editOrNewEvent");
      var dDataNew = oNewEventModel.getData();
      var sMode = dDataNew.mode; //edit or new

      var oEventsModel = oView.getModel('events');
      var sPathEventsModel = '/PlantsEventsDict/' + oCurrentPlant.id + '/';
      var aEventsCurrentPlant = oEventsModel.getProperty(sPathEventsModel);
      if (sMode === 'edit') {
        this._editEvent(oView, oEventsModel, aEventsCurrentPlant);
      } else {
        //'new'
        this._addEvent(oView, oEventsModel, aEventsCurrentPlant);
      }
    },
    editEvent: function _editEvent2(oSelectedEvent, oView, iCurrentPlantId) {
      this.applyToFragment('dialogEvent', this._initEditSelectedEvent.bind(this, oSelectedEvent, oView, iCurrentPlantId));
    },
    _initEditSelectedEvent: function _initEditSelectedEvent(oSelectedEvent, oView, iCurrentPlantId, oDialog) {
      // get soils collection from backend proposals resource
      this._loadSoils(oView);

      // update dialog title and save/update button
      oDialog.setTitle('Edit Event (' + oSelectedEvent.date + ')');
      oView.byId('btnEventUpdateSave').setText('Update');

      // there is some logic involved in mapping the dialog controls and the events model, additionally
      // we don't want to update the events model entity immediately from the dialog but only upon
      // hitting update button, therefore we generate a edit model, fill it with our event's data,
      // and, upon hitting update button, do it the other way around
      var dEventEdit = this._getInitialEvent(iCurrentPlantId);
      dEventEdit.mode = 'edit';
      dEventEdit.date = oSelectedEvent.date;
      dEventEdit.event_notes = oSelectedEvent.event_notes;

      // we need to remember the old record
      dEventEdit.oldEvent = oSelectedEvent;
      if (oSelectedEvent.pot && oSelectedEvent.pot.id) {
        dEventEdit.pot.id = oSelectedEvent.pot.id;
      }
      if (oSelectedEvent.observation && oSelectedEvent.observation.id) {
        dEventEdit.observation.id = oSelectedEvent.observation.id;
      }

      // observation segment
      if (!!oSelectedEvent.observation) {
        // activate observation tab if there is an observation
        dEventEdit.segments.observation = true;
        dEventEdit.observation.diseases = oSelectedEvent.observation.diseases;
        dEventEdit.observation.height = oSelectedEvent.observation.height;
        dEventEdit.observation.observation_notes = oSelectedEvent.observation.observation_notes;
        dEventEdit.observation.stem_max_diameter = oSelectedEvent.observation.stem_max_diameter;
      } else {
        dEventEdit.segments.observation = false;
      }

      // pot segment
      if (!!oSelectedEvent.pot) {
        dEventEdit.segments.pot = true;
        dEventEdit.pot.diameter_width = oSelectedEvent.pot.diameter_width;
        dEventEdit.pot.material = oSelectedEvent.pot.material;
        // the shape attributes are not set via model
        switch (oSelectedEvent.pot.shape_side) {
          case 'very flat':
            oView.byId('idPotHeight0').setSelected(true);
            break;
          case 'flat':
            oView.byId('idPotHeight1').setSelected(true);
            break;
          case 'high':
            oView.byId('idPotHeight2').setSelected(true);
            break;
          case 'very high':
            oView.byId('idPotHeight3').setSelected(true);
            break;
        }
        switch (oSelectedEvent.pot.shape_top) {
          case 'square':
            oView.byId('idPotShape0').setSelected(true);
            break;
          case 'round':
            oView.byId('idPotShape1').setSelected(true);
            break;
          case 'oval':
            oView.byId('idPotShape2').setSelected(true);
            break;
          case 'hexagonal':
            oView.byId('idPotShape3').setSelected(true);
            break;
        }
      } else {
        dEventEdit.segments.pot = false;
      }

      // soil segment
      if (!!oSelectedEvent.soil) {
        dEventEdit.segments.soil = true;
        dEventEdit.soil = Util.getClonedObject(oSelectedEvent.soil);
      } else {
        dEventEdit.segments.soil = false;
      }

      // set model and open dialog
      if (oDialog.getModel("editOrNewEvent")) {
        oDialog.getModel("editOrNewEvent").destroy();
      }
      var oModel = new JSONModel(dEventEdit);
      oDialog.setModel(oModel, "editOrNewEvent");
      oDialog.open();
    },
    _getInitialEvent: function _getInitialEvent(iCurrentPlantId) {
      // create initial data for the Create/Edit Event Dialog (we don't use the 
      // actual data there in case of editing an event)
      // called by both function to add and to edit event
      const oPot = {
        'diameter_width': 4,
        'material': this.oSuggestionsData['potMaterialCollection'][0].name
      };
      const oObservation = {
        'height': 0,
        'stem_max_diameter': 0,
        'diseases': '',
        'observation_notes': ''
      };
      const oSoil = {
        id: undefined,
        soil_name: '',
        mix: '',
        description: ''
      };
      const oEventEditDataSegments = {
        // defaults to inactive segments
        observation: false,
        pot: false,
        soil: false
      };
      const oEventEditData = {
        plant_id: iCurrentPlantId,
        date: Util.getToday(),
        event_notes: '',
        pot: oPot,
        observation: oObservation,
        soil: oSoil,
        segments: oEventEditDataSegments,
        mode: "new" // will be overwritten in case of editing
      };

      return oEventEditData;
    },
    openDialogEditSoil: function _openDialogEditSoil(oView, oSoil) {
      var dEditedSoil = {
        dialog_title: 'Edit Soil (ID ' + oSoil.id + ')',
        btn_text: 'Update',
        new: false,
        id: oSoil.id,
        soil_name: oSoil.soil_name,
        description: oSoil.description,
        mix: oSoil.mix
      };
      var oEditedSoilModel = new JSONModel(dEditedSoil);
      this.applyToFragment('dialogEditSoil', oDialog => {
        oDialog.setModel(oEditedSoilModel, 'editedSoil');
        oDialog.bindElement({
          path: '/',
          model: "editedSoil"
        });
        oView.addDependent(oDialog);
        oDialog.open();
      });
    },
    openDialogNewSoil: function _openDialogNewSoil(oView) {
      var dNewSoil = {
        dialog_title: 'New Soil',
        btn_text: 'Create',
        new: true,
        id: undefined,
        soil_name: '',
        description: '',
        mix: ''
      };
      var oNewSoilModel = new JSONModel(dNewSoil);
      this.applyToFragment('dialogEditSoil', oDialog => {
        oDialog.setModel(oNewSoilModel, 'editedSoil');
        oDialog.bindElement({
          path: '/',
          model: "editedSoil"
        });
        oView.addDependent(oDialog);
        oDialog.open();
      });
    },
    _saveNewSoil: function _saveNewSoil(oNewSoil, oSoilsModel) {
      // check if there's already a same-named soil
      var aSoils = oSoilsModel.getData().SoilsCollection;
      var existing_soil_found = aSoils.find(function (element) {
        return element.soil_name === oNewSoil.soil_name;
      });
      if (existing_soil_found) {
        MessageToast.show("Soil name already exists.");
        return;
      }
      var newSoil = {
        id: undefined,
        soil_name: oNewSoil.soil_name,
        description: oNewSoil.description,
        mix: oNewSoil.mix
      };
      Util.startBusyDialog('Saving new soil...');
      $.ajax({
        url: Util.getServiceUrl('events/soils'),
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify(newSoil),
        context: this
      }).done(this._cbSavedNewSoil.bind(this, oSoilsModel)).fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Save New Soil'));
    },
    _updateExistingSoil: function _updateExistingSoil(oSoilData, oSoilsModel) {
      var updatedSoil = {
        id: oSoilData.id,
        soil_name: oSoilData.soil_name,
        description: oSoilData.description,
        mix: oSoilData.mix
      };
      Util.startBusyDialog('Saving updated soil...');
      $.ajax({
        url: Util.getServiceUrl('events/soils'),
        type: 'PUT',
        contentType: "application/json",
        data: JSON.stringify(updatedSoil),
        context: this
      }).done(this._cbUpdatedExistingSoil.bind(this, oSoilsModel)).fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Save New Soil'));
    },
    updateOrCreateSoil: function _updateOrCreateSoil(oEditedSoil, oSoilsModel) {
      //make sure soil has a name and a mix
      if (oEditedSoil.soil_name === "" || oEditedSoil.mix === "") {
        MessageToast.show('Enter soil mix name and mix ingredients.');
        return;
      }

      // new soil
      if (oEditedSoil.new) {
        if (oEditedSoil.id) {
          MessageToast.show("Unexpected ID found.");
          return;
        }
        // _cbSavedNewSoil will be called asynchronously, closing dialogue
        this._saveNewSoil(oEditedSoil, oSoilsModel);

        // update existing soil
      } else {
        // _cbUpdatedExistingSoil will be called asynchronously, closing dialogue
        this._updateExistingSoil(oEditedSoil, oSoilsModel);
      }
    },
    _cbUpdatedExistingSoil: function _cbUpdatedExistingSoil(oSoilsModel, data) {
      // callback for request updating existing soil 
      if (!data.soil.id) {
        MessageToast.show("Unexpected backend error - No Soil ID");
        return;
      }
      var aSoils = oSoilsModel.getData().SoilsCollection;
      var oSOil = aSoils.find(function (element) {
        return element.id === data.soil.id;
      });
      if (!oSOil) {
        MessageToast.show("Updated soil not found in Model");
        return;
      }
      oSOil.soil_name = data.soil.soil_name;
      oSOil.description = data.soil.description;
      oSOil.mix = data.soil.mix;
      oSoilsModel.updateBindings(false);

      // busy dialog was started before ajax call
      Util.stopBusyDialog();
      this.applyToFragment('dialogEditSoil', oDialog => oDialog.close());

      // todo also update in current plant events list (currently requires a reload)
    },
    _cbSavedNewSoil: function _cbSavedNewSoil(oSoilsModel, data) {
      // callback for request saving new soil 
      if (!data.soil.id) {
        MessageToast.show("Unexpected backend error - No Soil ID");
        return;
      }
      var aSoils = oSoilsModel.getData().SoilsCollection;
      var oNewSoil = {
        id: data.soil.id,
        soil_name: data.soil.soil_name,
        description: data.soil.description,
        mix: data.soil.mix
      };
      aSoils.push(oNewSoil);
      oSoilsModel.updateBindings(false);

      // busy dialog was started before ajax call
      Util.stopBusyDialog();
      this.applyToFragment('dialogEditSoil', oDialog => oDialog.close());
    }
  });
  EventsUtil.getInstance = function getInstance(applyToFragment, oSuggestionsData) {
    if (!EventsUtil._instance && applyToFragment && oSuggestionsData) {
      EventsUtil._instance = new EventsUtil(applyToFragment, oSuggestionsData);
    }
    return EventsUtil._instance;
  };
  return EventsUtil;
});
//# sourceMappingURL=EventsUtil.js.map