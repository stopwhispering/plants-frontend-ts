sap.ui.define(["plants/ui/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/model/Filter", "plants/ui/model/formatter", "sap/m/MessageBox", "sap/m/MessageToast", "plants/ui/customClasses/Util", "plants/ui/customClasses/Navigation", "plants/ui/customClasses/MessageUtil", "plants/ui/customClasses/EventsUtil", "sap/ui/model/Sorter", "sap/ui/model/FilterOperator", "plants/ui/customClasses/ImageToTaxon", "plants/ui/customClasses/PropertiesUtil", "plants/ui/customClasses/ImageEventHandlers", "plants/ui/customClasses/TaxonomyUtil", "plants/ui/model/ModelsHelper", "sap/ui/core/Fragment", "sap/ui/core/library"], function (__BaseController, JSONModel, Filter, __formatter, MessageBox, MessageToast, Util, __Navigation, __MessageUtil, __EventsUtil, Sorter, FilterOperator, __ImageToTaxon, __PropertiesUtil, __ImageEventHandlers, __TaxonomyUtil, __ModelsHelper, Fragment, sap_ui_core_library) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  const formatter = _interopRequireDefault(__formatter);
  const Navigation = _interopRequireDefault(__Navigation);
  const MessageUtil = _interopRequireDefault(__MessageUtil);
  const EventsUtil = _interopRequireDefault(__EventsUtil);
  const ImageToTaxon = _interopRequireDefault(__ImageToTaxon);
  const PropertiesUtil = _interopRequireDefault(__PropertiesUtil);
  const ImageEventHandlers = _interopRequireDefault(__ImageEventHandlers);
  const TaxonomyUtil = _interopRequireDefault(__TaxonomyUtil);
  const ModelsHelper = _interopRequireDefault(__ModelsHelper);
  const MessageType = sap_ui_core_library["MessageType"];
  /**
   * @namespace plants.ui.controller
   */
  const Detail = BaseController.extend("plants.ui.controller.Detail", {
    constructor: function constructor() {
      BaseController.prototype.constructor.apply(this, arguments);
      this.formatter = new formatter();
      this.ImageToTaxon = new ImageToTaxon();
      this.modelsHelper = ModelsHelper.getInstance();
      this.TaxonomyUtil = TaxonomyUtil.getInstance();
      this.mIdToFragment = {
        dialogRenamePlant: "plants.ui.view.fragments.detail.DetailRename",
        dialogCancellation: "plants.ui.view.fragments.detail.DetailCancellation",
        menuDeleteTag: "plants.ui.view.fragments.detail.DetailTagDelete",
        dialogAddTag: "plants.ui.view.fragments.detail.DetailTagAdd",
        dialogCreateDescendant: "plants.ui.view.fragments.detail.DetailCreateDescendant",
        dialogEvent: "plants.ui.view.fragments.events.AddEvent",
        dialogAssignEventToImage: "plants.ui.view.fragments.events.DetailAssignEvent",
        dialogClonePlant: "plants.ui.view.fragments.detail.DetailClone",
        dialogFindSpecies: "plants.ui.view.fragments.detail.DetailFindSpecies",
        dialogLeafletMap: "plants.ui.view.fragments.taxonomy.DetailTaxonomyMap",
        dialogEditPropertyValue: "plants.ui.view.fragments.properties.EditPropertyValue",
        dialogAddProperties: "plants.ui.view.fragments.properties.AvailableProperties",
        dialogNewPropertyName: "plants.ui.view.fragments.properties.NewPropertyName",
        dialogEditSoil: "plants.ui.view.fragments.events.EditSoil"
      };
    },
    onInit: function _onInit() {
      BaseController.prototype.onInit.call(this);
      const oSuggestionsModel = this.getOwnerComponent().getModel('suggestions');
      this.eventsUtil = EventsUtil.getInstance(this.applyToFragment.bind(this), oSuggestionsModel.getData());
      this.propertiesUtil = PropertiesUtil.getInstance(this.applyToFragment.bind(this));
      this.imageEventHandlers = ImageEventHandlers.getInstance(this.applyToFragment.bind(this));
      this.oLayoutModel = this.oComponent.getModel();

      // default: view mode for plants information
      this.oComponent.getModel('status').setProperty('/details_editable', false);
      this.oRouter.getRoute("detail").attachPatternMatched(this._onPatternMatched, this);
      this.oRouter.getRoute("untagged").attachPatternMatched(this._onPatternMatched, this);

      // bind factory function to events list aggregation binding
      var oEventsList = this.byId("eventsList");
      oEventsList.bindAggregation("items", {
        path: "events>",
        templateShareable: false,
        // factory: this.EventsUtil.eventsListFactory.bind(this),
        factory: this.eventsUtil.eventsListFactory.bind(this),
        sorter: new Sorter('date', true) // descending by date
      });

      this.oComponent.getModel('status').setProperty('/images_editable', false);
    },
    _onPatternMatched: function _onPatternMatched(oEvent) {
      // if accessed directly, we might not have loaded the plants model, yet
      // in that case, we have the plant_id, but not the position of that plant
      // in the plants model index. so we must defer binding that plant to the view

      Util.startBusyDialog();

      //bind taxon of current plant and events to view (deferred as we may not know the plant name here, yet)
      this._currentPlantId = parseInt(oEvent.getParameter("arguments").plant_id || this._currentPlantId || "0");
      this._bindModelsForCurrentPlant();
    },
    _bindModelsForCurrentPlant: function _bindModelsForCurrentPlant() {
      //we need to set the taxon deferred as well as we might not have the taxon_id, yet
      //we need to wait for the plants model to be loaded
      //same applies to the events model which requires the plant_id
      var oModelPlants = this.oComponent.getModel('plants');
      var oPromise = oModelPlants.dataLoaded();
      oPromise.then(this._bindPlantsModelDeferred.bind(this), this._bindPlantsModelDeferred.bind(this));

      //loading and binding events requires only the plant id
      this._loadBindEventsModel();

      // if we haven't loaded images for this plant, yet, we do so before generating the images model
      if (!this.oComponent.imagesPlantsLoaded.has(this._currentPlantId)) {
        this._requestImagesForPlant(this._currentPlantId);
      } else {
        this.resetImagesCurrentPlant(this._currentPlantId);
      }
    },
    _loadBindEventsModel: function _loadBindEventsModel() {
      //load and bind events
      //bind current view to that property in events model
      this.getView().bindElement({
        path: "/PlantsEventsDict/" + this._currentPlantId,
        model: "events"
      });

      //load only on first load of that plant, otherwise we would overwrite modifications
      //to the plant's events
      var oEventsModel = this.oComponent.getModel('events');
      if (!oEventsModel.getProperty('/PlantsEventsDict/' + this._currentPlantId + '/')) {
        this._loadEventsForCurrentPlant();
      }
    },
    _bindPlantsModelDeferred: function _bindPlantsModelDeferred() {
      //triggered upon data loading finished of plants model, i.e. we now have the taxon_id, plant_name,
      // position of plant_id in the plants model array, etc.

      // get current plant's position in plants model array
      var aPlants = this.oComponent.getModel('plants').getProperty('/PlantsCollection');
      this._currentPlantIndex = aPlants.findIndex(plant => plant.id === this._currentPlantId);
      if (this._currentPlantIndex === -1) {
        MessageToast.show('Plant ID ' + this._currentPlantId + ' not found. Redirecting.');
        this._currentPlantIndex = 0;
      }

      // get current plant object in plants model array and bind plant to details view
      var sPathCurrentPlant = "/PlantsCollection/" + this._currentPlantIndex;
      this._oCurrentPlant = this.oComponent.getModel('plants').getProperty(sPathCurrentPlant);
      if (!this._oCurrentPlant.parent_plant) {
        this._oCurrentPlant.parent_plant = {
          id: undefined,
          plant_name: undefined,
          active: undefined
        };
      }
      if (!this._oCurrentPlant.parent_plant_pollen) {
        this._oCurrentPlant.parent_plant_pollen = {
          id: undefined,
          plant_name: undefined,
          active: undefined
        };
      }
      this.getView().bindElement({
        path: sPathCurrentPlant,
        model: "plants"
      });

      //bind taxon
      this._bindTaxonOfCurrentPlantDeferred(this._oCurrentPlant);

      // treat properties model in the same way (it requires the taxon to be known so we have
      // to load it here)
      this._loadBindProperties();
    },
    _loadBindProperties: function _loadBindProperties() {
      this.getView().bindElement({
        path: "/propertiesPlants/" + this._oCurrentPlant.id,
        model: "properties"
      });
      var oModelProperties = this.oComponent.getModel('properties');
      if (!oModelProperties.getProperty('/propertiesPlants/' + this._oCurrentPlant.id + '/')) {
        this.propertiesUtil.loadPropertiesForCurrentPlant(this._oCurrentPlant, this.oComponent);
      }
    },
    _loadEventsForCurrentPlant: function _loadEventsForCurrentPlant() {
      // request data from backend
      // data is added to local events model and bound to current view upon receivement
      const uri = 'events/' + this._currentPlantId;
      $.ajax({
        url: Util.getServiceUrl(uri),
        context: this,
        async: true
      }).done(this._onReceivingEventsForPlant.bind(this, this._currentPlantId)).fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Event (GET)'));
    },
    _onReceivingEventsForPlant: function _onReceivingEventsForPlant(plantId, oData) {
      //insert (overwrite!) events data for current plant with data received from backend
      const oEventsModel = this.oComponent.getModel('events');
      const aEvents = oData.events;
      oEventsModel.setProperty('/PlantsEventsDict/' + plantId + '/', aEvents);
      this.oComponent.oEventsDataClone[plantId] = Util.getClonedObject(aEvents);
      MessageUtil.getInstance().addMessageFromBackend(oData.message);
    },
    _bindTaxonOfCurrentPlantDeferred: function _bindTaxonOfCurrentPlantDeferred(oPlant) {
      this.getView().bindElement({
        path: "/TaxaDict/" + oPlant.taxon_id,
        model: "taxon"
      });
    },
    applyToFragment: function _applyToFragment(sId, fn, fnInit) {
      // to enable vs code to connect fragments with a controller, we may not mention
      // the Dialog/Popover ID in the base controller; therefore we have these names
      // hardcoded in each controller 
      BaseController.prototype.applyToFragment.call(this, sId, fn, fnInit, this.mIdToFragment);
    },
    handleFullScreen: function _handleFullScreen() {
      var sNextLayout = this.oLayoutModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");
      this.oRouter.navTo("detail", {
        layout: sNextLayout,
        plant_id: this._oCurrentPlant.id
      });
    },
    handleExitFullScreen: function _handleExitFullScreen() {
      var sNextLayout = this.oLayoutModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
      this.oRouter.navTo("detail", {
        layout: sNextLayout,
        plant_id: this._oCurrentPlant.id
      });
    },
    handleClose: function _handleClose() {
      var sNextLayout = this.oLayoutModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
      this.oRouter.navTo("master", {
        layout: sNextLayout
      });
    },
    onChangeActiveSwitch: function _onChangeActiveSwitch(oEvent) {
      // open dialog to choose reason for plant deactivation
      var oSwitch = oEvent.getSource();
      if (oEvent.getParameter('state')) {
        return;
      }
      var oView = this.getView();
      if (!this.byId('dialogCancellation')) {
        Fragment.load({
          name: "plants.ui.view.fragments.detail.DetailCancellation",
          id: oView.getId(),
          controller: this
        }).then(oControl => {
          const oPopover = oControl;
          oView.byId("cancellationDate").setDateValue(new Date());
          oView.addDependent(oPopover);
          oPopover.openBy(oSwitch, true);
        });
      } else {
        this.byId('dialogCancellation').openBy(oSwitch, true);
      }
    },
    onIconPressSetPreview: function _onIconPressSetPreview(oEvent) {
      // get selected image and current plant in model
      var oSource = oEvent.getSource();
      var sPathCurrentImage = oSource.getBindingContext("images").getPath();
      var oCurrentImage = this.oComponent.getModel('images').getProperty(sPathCurrentImage);
      var sPathCurrentPlant = oSource.getBindingContext("plants").getPath();
      var oCurrentPlant = this.oComponent.getModel('plants').getProperty(sPathCurrentPlant);

      // temporarily set original image as preview image
      // upon reloading plants model, a specific preview image will be generated 
      var sUrlOriginal = oCurrentImage['filename'];
      var s = JSON.stringify(sUrlOriginal); // model stores backslash unescaped, so we need a workaround
      var s2 = s.substring(1, s.length - 1);
      oCurrentPlant['url_preview'] = s2;
      oCurrentPlant['filename_previewimage'] = oCurrentImage['filename'];
      this.oComponent.getModel('plants').updateBindings(false);
    },
    onSetInactive: function _onSetInactive(oEvent) {
      //set plant inactive after choosing a reason (e.g. freezing, drought, etc.)
      //we don't use radiobuttongroup helper, so we must get selected element manually
      var aReasons = this.oComponent.getModel('suggestions').getProperty('/cancellationReasonCollection');
      var oReasonSelected = aReasons.find(ele => ele.selected);

      //set current plant's cancellation reason and date
      var oCurrentPlant = this.getView().getBindingContext('plants').getObject();
      oCurrentPlant.cancellation_reason = oReasonSelected.text;
      var oDatePicker = this.byId("cancellationDate");
      let oDate = oDatePicker.getDateValue();
      var sDateFormatted = Util.formatDate(oDate);
      // this.getView().getBindingContext('plants').getObject().cancellation_date = sDateFormatted;
      oCurrentPlant.cancellation_date = sDateFormatted;
      this.oComponent.getModel('plants').updateBindings(false);
      this.byId('dialogCancellation').close();
    },
    onChangeParent: function _onChangeParent(oEvent) {
      // verify entered parent and set parent plant id
      var aPlants = this.getView().getModel('plants').getProperty('/PlantsCollection');
      var parentPlant = aPlants.find(plant => plant.plant_name === oEvent.getParameter('newValue').trim());
      if (!oEvent.getParameter('newValue').trim() || !parentPlant) {
        // delete parent plant
        var parentalPlant = {
          id: undefined,
          plant_name: undefined,
          active: undefined
        };
      } else {
        // set parent plant
        parentalPlant = {
          id: parentPlant.id,
          plant_name: parentPlant.plant_name,
          active: parentPlant.active
        };
      }

      // fn is fired by changes for parent and parent_ollen
      if (oEvent.getSource().data('parentType') === "parent_pollen") {
        this._oCurrentPlant.parent_plant_pollen = parentalPlant;
      } else {
        this._oCurrentPlant.parent_plant = parentalPlant;
      }
    },
    onPressGoToPlant: function _onPressGoToPlant(parentPlantId) {
      //navigate to supplied plant
      if (!!parentPlantId) {
        Navigation.getInstance().navToPlantDetails(parentPlantId);
      } else {
        this.handleErrorMessageBox("Can't determine Plant Index");
      }
    },
    onSuggestNursery: function _onSuggestNursery(oEvent) {
      // overwrite default suggestions (only beginsWith term) with custom one (contains term))
      var aFilters = [];
      var sTerm = oEvent.getParameter("suggestValue");
      if (sTerm) {
        aFilters.push(new Filter("name", FilterOperator.Contains, sTerm));
      }
      var oInput = oEvent.getSource();
      var oListBinding = oInput.getBinding("suggestionItems");
      oListBinding.filter(aFilters);
      //do <<not>> filter the provided suggestions with default logic before showing them to the user
      oInput.setFilterSuggests(false);
    },
    onPressButtonDeletePlant: function _onPressButtonDeletePlant(oEvent, sPlant, plantId) {
      if (sPlant.length < 1) {
        return;
      }

      //confirm dialog
      var oMenuItem = oEvent.getSource();
      var oPlant = oMenuItem.getBindingContext('plants').getObject();
      var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
      const mOptions = {
        title: "Delete",
        stretch: false,
        onClose: this._confirmDeletePlant.bind(this, sPlant, plantId, oPlant),
        actions: ['Delete', 'Cancel'],
        styleClass: bCompact ? "sapUiSizeCompact" : ""
      };
      MessageBox.confirm("Delete plant " + sPlant + "?", mOptions);
    },
    onPressButtonClonePlant: function _onPressButtonClonePlant(oEvent) {
      // triggered by button in details upper menu
      // opens dialog to clone current plant

      // check if there are any unsaved changes
      var aModifiedPlants = this.getModifiedPlants();
      var aModifiedImages = this.getModifiedImages();
      var aModifiedTaxa = this.getModifiedTaxa();
      if (aModifiedPlants.length !== 0 || aModifiedImages.length !== 0 || aModifiedTaxa.length !== 0) {
        MessageToast.show('There are unsaved changes. Save modified data or reload data first.');
        return;
      }
      this.applyToFragment('dialogClonePlant', o => {
        const clonePlantName = this._generatePlantNameWithRomanizedSuffix(this._oCurrentPlant.plant_name, 2);
        const oInput = this.byId('inputClonedPlantName');
        oInput.setValue(clonePlantName);
        o.open();
      });
    },
    _confirmDeletePlant: function _confirmDeletePlant(sPlant, plantId, oPlant, sAction) {
      if (sAction !== 'Delete') {
        return;
      }
      Util.startBusyDialog('Deleting', 'Deleting ' + sPlant);
      $.ajax({
        url: Util.getServiceUrl('plants/'),
        type: 'DELETE',
        contentType: "application/json",
        data: JSON.stringify({
          'plant_id': plantId
        }),
        context: this
      }).done(this._onPlantDeleted.bind(this, oPlant)).fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Plant (DELETE)'));
    },
    _onPlantDeleted: function _onPlantDeleted(oPlantDeleted, oMsg, sStatus, oReturnData) {
      Util.stopBusyDialog();
      this.onAjaxSimpleSuccess(oMsg, sStatus, oReturnData);

      //remove from plants model and plants model clone
      //find deleted image in model and remove there
      var aPlantsData = this.getView().getModel('plants').getData().PlantsCollection;
      var iPosition = aPlantsData.indexOf(oPlantDeleted);
      aPlantsData.splice(iPosition, 1);
      this.getView().getModel('plants').refresh();

      //delete from model clone (used for tracking changes) as well
      var aPlantsDataClone = this.oComponent.oPlantsDataClone.PlantsCollection;

      //can't find position with object from above
      var oPlantClone = aPlantsDataClone.find(function (element) {
        return element.plant_name === oPlantDeleted.plant_name;
      });
      if (oPlantClone !== undefined) {
        aPlantsDataClone.splice(aPlantsDataClone.indexOf(oPlantClone), 1);
      }

      //return to one-column-layout (plant in details view was deleted)
      this.handleClose();
    },
    onToggleEditMode: function _onToggleEditMode(oEvent) {
      // toggle edit mode for some of the input controls (actually hide the read-only ones and 
      // unhide the others)
      var oSource = oEvent.getSource();
      var sCurrentType = oSource.getType();
      if (sCurrentType === 'Transparent') {
        // set edit mode
        oSource.setType('Emphasized');
        this.getView().getModel('status').setProperty('/details_editable', true);
      } else {
        // set view mode (default)
        oSource.setType('Transparent');
        this.getView().getModel('status').setProperty('/details_editable', false);
      }
    },
    onPressTag: function _onPressTag(oEvent) {
      var oSource = oEvent.getSource();
      // create delete dialog for tags
      var sPathTag = oSource.getBindingContext('plants').getPath();
      this.applyToFragment('menuDeleteTag', oMenu => {
        oMenu.bindElement({
          path: sPathTag,
          model: "plants"
        });
        oMenu.openBy(oSource, true);
      });
    },
    pressDeleteTag: function _pressDeleteTag(oEvent) {
      var oSource = oEvent.getSource();
      var oContext = oSource.getBindingContext('plants');
      // get position in tags array
      var sPathItem = oContext.getPath();
      var iIndex = sPathItem.substr(sPathItem.lastIndexOf('/') + 1);
      // remove item from array
      this.oComponent.getModel('plants').getData().PlantsCollection[this._currentPlantIndex].tags.splice(iIndex, 1);
      this.oComponent.getModel('plants').refresh();
    },
    onOpenAddTagDialog: function _onOpenAddTagDialog(oEvent) {
      // create add tag dialog
      var oButton = oEvent.getSource();
      // var oView = this.getView();
      // if (!this.byId('dialogAddTag')) {
      // 	Fragment.load({
      // 		name: "plants.ui.view.fragments.detail.DetailTagAdd",
      // 		id: oView.getId(),
      // 		controller: this
      // 	}).then((oControl: Control | Control[]) => {
      // 		const oPopover: Popover = oControl as Popover;
      // 		var mObjectStatusSelection = <ObjectStatusCollection>{
      // 			ObjectStatusCollection: [
      // 				{ 'selected': false, 'text': 'None', 'state': 'None' },
      // 				{ 'selected': false, 'text': 'Indication01', 'state': 'Indication01' },
      // 				{ 'selected': false, 'text': 'Success', 'state': 'Success' },
      // 				{ 'selected': true, 'text': 'Information', 'state': 'Information' },
      // 				{ 'selected': false, 'text': 'Error', 'state': 'Error' },
      // 				{ 'selected': false, 'text': 'Warning', 'state': 'Warning' }
      // 			],
      // 			Value: '',
      // 		};
      // 		var oTagTypesModel = new JSONModel(mObjectStatusSelection);
      // 		oPopover.setModel(oTagTypesModel, 'tagTypes');

      // 		(<DatePicker>oView.byId("dialogAddTag")).setDateValue(new Date());
      // 		oView.addDependent(oPopover);
      // 		oPopover.openBy(oButton, true);
      // 	})
      // } else {
      // 	(<Popover>this.byId('dialogAddTag')).openBy(oButton, true);
      // }

      this.applyToFragment('dialogAddTag', p => p.openBy(oButton, true), _initTagDialog.bind(this));
      function _initTagDialog(oPopover) {
        var mObjectStatusSelection = {
          ObjectStatusCollection: [{
            'selected': false,
            'text': 'None',
            'state': 'None'
          }, {
            'selected': false,
            'text': 'Indication01',
            'state': 'Indication01'
          }, {
            'selected': false,
            'text': 'Success',
            'state': 'Success'
          }, {
            'selected': true,
            'text': 'Information',
            'state': 'Information'
          }, {
            'selected': false,
            'text': 'Error',
            'state': 'Error'
          }, {
            'selected': false,
            'text': 'Warning',
            'state': 'Warning'
          }],
          Value: ''
        };
        var oTagTypesModel = new JSONModel(mObjectStatusSelection);
        oPopover.setModel(oTagTypesModel, 'tagTypes');
      }
    },
    onAddTag: function _onAddTag(oEvent) {
      // create a new tag inside the plant's object in the plants model
      // it will be saved in backend when saving the plant
      // new/deleted tags are within scope of the plants model modification tracking
      var oPopover = this.byId('dialogAddTag');
      var oModelTagTypes = oPopover.getModel('tagTypes');
      var dDialogData = oModelTagTypes.getData();
      dDialogData.Value = dDialogData.Value.trim();

      // check if empty 
      if (dDialogData.Value.length === 0) {
        MessageToast.show('Enter text first.');
        return;
      }

      // get selected ObjectStatus template
      var oSelectedElement = dDialogData.ObjectStatusCollection.find(function (element) {
        return element.selected;
      });

      // check if same-text tag already exists for plant
      var oPlant = this.oComponent.getModel('plants').getData().PlantsCollection[this._currentPlantIndex];
      if (oPlant.tags) {
        var bFound = oPlant.tags.find(function (oTag) {
          return oTag.text === dDialogData.Value;
        });
        if (bFound) {
          MessageToast.show('Tag already exists.');
          return;
        }
      }

      // create new token object in plants model
      var dNewTag = {
        // id is determined upon saving to db
        text: dDialogData.Value,
        // icon: oSelectedElement.icon,
        state: oSelectedElement.state,
        // last_update is determined upon saving to db
        // plant_name: oPlant.plant_name,
        plant_id: oPlant.id
      };
      if (oPlant.tags) {
        oPlant.tags.push(dNewTag);
      } else {
        oPlant.tags = [dNewTag];
      }
      this.oComponent.getModel('plants').updateBindings(false);
      this.byId('dialogAddTag').close();
    },
    onPressButtonRenamePlant: function _onPressButtonRenamePlant(oEvent) {
      // triggered by button in details upper menu
      // opens dialog to rename current plant

      // check if there are any unsaved changes
      var aModifiedPlants = this.getModifiedPlants();
      var aModifiedImages = this.getModifiedImages();
      var aModifiedTaxa = this.getModifiedTaxa();
      if (aModifiedPlants.length !== 0 || aModifiedImages.length !== 0 || aModifiedTaxa.length !== 0) {
        MessageToast.show('There are unsaved changes. Save modified data or reload data first.');
        return;
      }
      this.applyToFragment('dialogRenamePlant', oDialog => {
        var oInput = this.byId('inputNewPlantName');
        oInput.setValue(this._oCurrentPlant.plant_name);
        oDialog.open();
      });
    },
    onLiveChangeNewPlantName: function _onLiveChangeNewPlantName(oEvent, type) {
      // called from either rename or clone fragment
      var sText = oEvent.getParameter('value');
      if (type === 'clone') {
        this.byId('btnClonePlantSubmit').setEnabled(sText.length > 0);
      } else if (type === 'rename') {
        this.byId('btnRenamePlantSubmit').setEnabled(sText.length > 0);
      } else if (type === 'descendant') {
        this.byId('btnDescendantDialogCreate').setEnabled(sText.length > 0);
      }
    },
    onPressButtonSubmitClonePlant: function _onPressButtonSubmitClonePlant(oEvent) {
      // use ajax to clone plant in backend
      var sClonedPlantName = this.byId('inputClonedPlantName').getValue().trim();

      // check if duplicate
      if (sClonedPlantName === '') {
        MessageToast.show('Empty not allowed.');
        return;
      }

      //check if new
      if (this.isPlantNameInPlantsModel(sClonedPlantName)) {
        MessageToast.show('Plant Name already exists.');
        return;
      }

      // ajax call
      Util.startBusyDialog("Cloning...", '"' + this._oCurrentPlant.plant_name + '" to "' + sClonedPlantName + '"');
      $.ajax({
        url: Util.getServiceUrl('plants/' + this._oCurrentPlant.id + '/clone?plant_name_clone=' + sClonedPlantName),
        type: 'POST',
        contentType: "application/json",
        context: this
      }).done(this._onReceivingPlantCloned).fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Clone Plant (POST)'));
    },
    _onReceivingPlantCloned: function _onReceivingPlantCloned(oBackendResultPlantCloned) {
      // Cloning plant was successful; add clone to model and open in details view
      this.applyToFragment('dialogClonePlant', oDialog => oDialog.close());
      MessageUtil.getInstance().addMessageFromBackend(oBackendResultPlantCloned.message);
      var oPlantSaved = oBackendResultPlantCloned.plant;
      var aPlants = this.oComponent.getModel('plants').getProperty('/PlantsCollection');
      aPlants.push(oPlantSaved); // append at end to preserve change tracking with clone 
      this.oComponent.getModel('plants').updateBindings(false);

      // ...and add to cloned plants to allow change tracking
      var oPlantClone = Util.getClonedObject(oPlantSaved);
      this.oComponent.oPlantsDataClone.PlantsCollection.push(oPlantClone);
      MessageToast.show(oBackendResultPlantCloned.message.message);

      // finally navigate to the newly created plant in details view
      Navigation.getInstance().navToPlantDetails(oPlantSaved.id);
      Util.stopBusyDialog();
    },
    onPressButtonSubmitRenamePlant: function _onPressButtonSubmitRenamePlant(oEvent) {
      // use ajax to rename plant in backend
      var sNewPlantName = this.byId('inputNewPlantName').getValue().trim();

      // check if duplicate
      if (sNewPlantName === '') {
        MessageToast.show('Empty not allowed.');
        return;
      }

      //check if new
      if (this.isPlantNameInPlantsModel(sNewPlantName)) {
        MessageToast.show('Plant Name already exists.');
        return;
      }

      // ajax call
      Util.startBusyDialog("Renaming...", '"' + this._oCurrentPlant.plant_name + '" to "' + sNewPlantName + '"');
      var dPayload = {
        'OldPlantName': this._oCurrentPlant.plant_name,
        'NewPlantName': sNewPlantName
      };
      $.ajax({
        url: Util.getServiceUrl('plants/'),
        type: 'PUT',
        contentType: "application/json",
        data: JSON.stringify(dPayload),
        context: this
      }).done(this._onReceivingPlantNameRenamed).fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Plant (PUT)'));
    },
    _onReceivingPlantNameRenamed: function _onReceivingPlantNameRenamed(oMsg) {
      //plant was renamed in backend
      Util.stopBusyDialog();
      MessageToast.show(oMsg.message.message);
      MessageUtil.getInstance().addMessageFromBackend(oMsg.message);
      Util.startBusyDialog('Loading...', 'Loading plants and images data');
      this.modelsHelper.reloadPlantsFromBackend();
      // oModelsHelper.reloadImagesFromBackend();
      this.modelsHelper.resetImagesRegistry();
      //todo trigger reinit of this view (updateBindings/refresh of model doesn't update this view's images)

      this._requestImagesForPlant(this._oCurrentPlant.id);
      this.modelsHelper.reloadTaxaFromBackend();
      this.applyToFragment('dialogRenamePlant', o => o.close());
    },
    _requestImagesForPlant: function _requestImagesForPlant(plant_id) {
      // request data from backend
      var sId = encodeURIComponent(plant_id);
      var uri = 'plants/' + sId + '/images/';
      $.ajax({
        url: Util.getServiceUrl(uri),
        // data: ,
        context: this,
        async: true
      }).done(this._onReceivingImagesForPlant.bind(this, plant_id)).fail(this.modelsHelper.onReceiveErrorGeneric.bind(this, 'Plant Images (GET)'));
    },
    _onReceivingImagesForPlant: function _onReceivingImagesForPlant(plant_id, oData) {
      this.addPhotosToRegistry(oData);
      this.oComponent.imagesPlantsLoaded.add(plant_id);
      this.resetImagesCurrentPlant(plant_id);
      this.oComponent.getModel('images').updateBindings(false);
    },
    onPressButtonCreateDescendantPlant: function _onPressButtonCreateDescendantPlant(oEvent) {
      // triggered by button in details upper menu
      // opens dialog to create descendant plant with current plant as mother plant

      // check if there are any unsaved changes
      var aModifiedPlants = this.getModifiedPlants();
      var aModifiedImages = this.getModifiedImages();
      var aModifiedTaxa = this.getModifiedTaxa();
      if (aModifiedPlants.length !== 0 || aModifiedImages.length !== 0 || aModifiedTaxa.length !== 0) {
        MessageToast.show('There are unsaved changes. Save modified data or reload data first.');
        return;
      }
      this.applyToFragment('dialogCreateDescendant', oDialog => {
        // create json model descendant and set it (default settings are when opening)
        var defaultPropagationType = 'seed (collected)';
        var descendantPlantDataInit = {
          "propagationType": defaultPropagationType,
          "parentPlant": this.getPlantById(this._currentPlantId).plant_name,
          "parentPlantPollen": undefined,
          "descendantPlantName": undefined
        };
        var modelDescendant = new JSONModel(descendantPlantDataInit);
        oDialog.setModel(modelDescendant, "descendant");
        this.updatePlantNameSuggestion();
        oDialog.open();
      });
    },
    onDescendantDialogCreate: function _onDescendantDialogCreate(oEvent) {
      // triggered from create-descendant-dialog to create the descendant plant
      //todo validate if existing
      var descendantPlantData = this.byId('dialogCreateDescendant').getModel('descendant').getData();
      if (!descendantPlantData.propagationType || !descendantPlantData.propagationType.length) {
        MessageToast.show('Choose propagation type.');
        return;
      }

      // validate parent plant (obligatory and valid) and parent plant pollen (valid if supplied)
      if (!descendantPlantData.parentPlant || !this.isPlantNameInPlantsModel(descendantPlantData.parentPlant)) {
        MessageToast.show('Check parent plant.');
        return;
      }
      var propagationType = this.getSuggestionItem('propagationTypeCollection', descendantPlantData.propagationType);
      if (propagationType.hasParentPlantPollen === true && !!descendantPlantData.parentPlantPollen && !this.isPlantNameInPlantsModel(descendantPlantData.parentPlantPollen)) {
        MessageToast.show('Check parent plant pollen.');
        return;
      }
      ;

      // validate new plant name
      if (!descendantPlantData.descendantPlantName || !descendantPlantData.descendantPlantName.trim().length) {
        MessageToast.show('Enter new plant name.');
        return;
      }
      ;
      if (this.isPlantNameInPlantsModel(descendantPlantData.descendantPlantName)) {
        MessageToast.show('Plant with that name already exists.');
        return;
      }
      ;

      // assemble new plant and save it
      var parentPlant = this.getPlantByName(descendantPlantData.parentPlant);
      var newPlant = {
        'id': undefined,
        // created in backend
        'plant_name': descendantPlantData.descendantPlantName,
        'field_number': propagationType.hasParentPlantPollen ? '-' : parentPlant.field_number,
        'geographic_origin': propagationType.hasParentPlantPollen ? '-' : parentPlant.geographic_origin,
        'nursery_source': '-',
        'propagation_type': descendantPlantData.propagationType,
        'active': true,
        'taxon_id': propagationType.hasParentPlantPollen ? undefined : parentPlant.taxon_id,
        'parent_plant': {
          id: parentPlant.id,
          plant_name: parentPlant.plant_name,
          active: parentPlant.active
        },
        hide: false,
        'last_update': undefined,
        //auto-derived in backend
        'descendant_plants_all': [],
        //auto-derived in backend
        'sibling_plants': [],
        //auto-derived in backend
        'same_taxon_plants': [],
        //auto-derived in backend
        'tags': []
      };
      if (!!descendantPlantData.parentPlantPollen && descendantPlantData.parentPlantPollen.length) {
        var oParentPlantPollen = this.getPlantByName(descendantPlantData.parentPlantPollen);
        newPlant.parent_plant_pollen = {
          id: oParentPlantPollen.id,
          plant_name: descendantPlantData.parentPlantPollen,
          active: oParentPlantPollen.active
        };
      }
      this.saveNewPlant(newPlant);
      this.applyToFragment('dialogCreateDescendant', oDialog => oDialog.close());
    },
    _generatePlantNameWithRomanizedSuffix: function _generatePlantNameWithRomanizedSuffix(baseName, beginWith) {
      // e.g. Aeonium spec. II -> Aeonium spec. III if the former already exists
      for (var i = beginWith; i < 100; i++) {
        var latinNumber = Util.romanize(i);
        var suggestedName = baseName + ' ' + latinNumber;
        if (!this.isPlantNameInPlantsModel(suggestedName)) {
          return suggestedName;
        }
      }
      throw new Error('Could not generate plant name with romanized suffix.');
    },
    _generateNewPlantNameSuggestion: function _generateNewPlantNameSuggestion(oParentPlant, oParentPlantPollen) {
      // generate new plant name suggestion
      // ... only if parent plant names are set

      // hybrid of two parents
      if (!!oParentPlantPollen) {
        var suggestedName = (oParentPlant.botanical_name || oParentPlant.plant_name) + ' × ' + (oParentPlantPollen.botanical_name || oParentPlantPollen.plant_name);
        if (this.isPlantNameInPlantsModel(suggestedName)) {
          // we need to find a variant using latin numbers, starting with II
          // Consider existing latin number at ending
          suggestedName = this._generatePlantNameWithRomanizedSuffix(suggestedName, 2);
        }

        // Just one parent: add latin number to parent plant name
        // Consider existing latin number at ending
      } else {
        var baseName = oParentPlant.plant_name;
        var reRomanNumber = /\sM{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
        var romanNumberMatch = baseName.match(reRomanNumber);
        if (!!romanNumberMatch) {
          var romanNumber = romanNumberMatch.pop();
          var beginWith = Util.arabize(romanNumber) + 1;
          // remove the roman number at the end
          baseName = baseName.substr(0, oParentPlant.plant_name.lastIndexOf(' '));
        } else {
          var beginWith = 2;
        }

        // find suitable roman number suffix
        var suggestedName = this._generatePlantNameWithRomanizedSuffix(baseName, beginWith);
      }
      return suggestedName;
    },
    updatePlantNameSuggestion: function _updatePlantNameSuggestion() {
      // generate new plant name suggestion
      const oCheckbox = this.byId('autoNameDescendantPlantName');
      if (!oCheckbox.getSelected()) {
        return;
      }
      const oDescendantModel = this.byId('dialogCreateDescendant').getModel('descendant');
      let descendantPlantData = oDescendantModel.getData();
      if (!descendantPlantData.propagationType || !descendantPlantData.propagationType.length) {
        return;
      }
      const propagationType = this.getSuggestionItem('propagationTypeCollection', descendantPlantData.propagationType);
      if (descendantPlantData.parentPlant && descendantPlantData.parentPlant.trim().length) {
        const oParentPlant = this.getPlantByName(descendantPlantData.parentPlant);
        const oParentPlantPollen = descendantPlantData.parentPlantPollen && propagationType.hasParentPlantPollen ? this.getPlantByName(descendantPlantData.parentPlantPollen) : undefined;
        var suggestedName = this._generateNewPlantNameSuggestion(oParentPlant, oParentPlantPollen);
      } else {
        suggestedName = '';
      }
      const oModelDescendant = this.byId('dialogCreateDescendant').getModel('descendant');
      oModelDescendant.setProperty('/descendantPlantName', suggestedName);
    },
    onDescendantDialogChangeParent: function _onDescendantDialogChangeParent(oEvent, parentType) {
      // reset parent plant (/pollen) input if entered plant name is invalid
      var parentPlantName = oEvent.getParameter('newValue').trim();
      if (!parentPlantName || !this.isPlantNameInPlantsModel(parentPlantName)) {
        oEvent.getSource().setValue('');
        return;
      }
      this.updatePlantNameSuggestion();
    },
    onDescendantDialogSwitchParents: function _onDescendantDialogSwitchParents() {
      // triggered by switch button; switch parent plant and parent plant pollen
      var model = this.byId('dialogCreateDescendant').getModel('descendant');
      var parentPlantName = model.getProperty('/parentPlant');
      model.setProperty('/parentPlant', model.getProperty('/parentPlantPollen'));
      model.setProperty('/parentPlantPollen', parentPlantName);
      this.updatePlantNameSuggestion();
    },
    onSwitchImageEditDescription: function _onSwitchImageEditDescription(oEvent) {
      const oModelStatus = this.getView().getModel('status');
      if (oModelStatus.getProperty('/images_editable')) {
        oModelStatus.setProperty('/images_editable', false);
      } else {
        oModelStatus.setProperty('/images_editable', true);
      }
    },
    onOpenFindSpeciesDialog: function _onOpenFindSpeciesDialog() {
      this.applyToFragment('dialogFindSpecies', oDialog => oDialog.open(), oDialog => {
        var oKewResultsModel = new JSONModel();
        this.getView().setModel(oKewResultsModel, 'kewSearchResults');
      });
    },
    onButtonFindSpecies: function _onButtonFindSpecies(oEvent) {
      const sSpecies = this.byId('inputFindSpecies').getValue();
      const bIncludeKew = this.byId('cbFindSpeciesIncludeKew').getSelected();
      const bSearchForGenus = this.byId('cbGenus').getSelected();
      const oModelKewSearchResults = this.getView().getModel('kewSearchResults'); //model attached to view, not component
      this.TaxonomyUtil.findSpecies(sSpecies, bIncludeKew, bSearchForGenus, oModelKewSearchResults);
    },
    onFindSpeciesChoose: function _onFindSpeciesChoose(oEvent) {
      const oSelectedItem = this.byId('tableFindSpeciesResults').getSelectedItem();
      const sCustomName = this.byId('textFindSpeciesAdditionalName').getText().trim();
      const oDialog = this._getFragment('dialogFindSpecies');
      this.TaxonomyUtil.chooseSpecies(oSelectedItem, sCustomName, oDialog, this._oCurrentPlant, this, this.getView());
    },
    onFindSpeciesTableSelectedOrDataUpdated: function _onFindSpeciesTableSelectedOrDataUpdated(oEvent) {
      const oSelectedItem = this.byId('tableFindSpeciesResults').getSelectedItem();
      const oText = this.byId('textFindSpeciesAdditionalName');
      const oInputAdditionalName = this.byId('inputFindSpeciesAdditionalName');
      this.TaxonomyUtil.findSpeciesTableSelectedOrDataUpdated(oText, oInputAdditionalName, oSelectedItem);
    },
    onFindSpeciesAdditionalNameLiveChange: function _onFindSpeciesAdditionalNameLiveChange(oEvent) {
      this.TaxonomyUtil.findSpeciesAdditionalNameLiveChange(this.getView());
    },
    onDialogFindSpeciesBeforeOpen: function _onDialogFindSpeciesBeforeOpen(oEvent) {
      this.TaxonomyUtil.findSpeciesBeforeOpen(this.getView());
    },
    onShowMap: function _onShowMap(oEvent) {
      // var oSource = evt.getSource();
      this.applyToFragment('dialogLeafletMap', oDialog => oDialog.open());
    },
    onRefetchGbifImages: function _onRefetchGbifImages(gbif_id, controller) {
      const oTaxonModel = this.getView().getModel('taxon');
      this.TaxonomyUtil.refetchGbifImages(gbif_id, oTaxonModel, this._oCurrentPlant);
    },
    onCloseLeafletMap: function _onCloseLeafletMap(oEvent) {
      this.applyToFragment('dialogLeafletMap', oDialog => oDialog.close());
    },
    afterCloseLeafletMap: function _afterCloseLeafletMap(oEvent) {
      this.applyToFragment('dialogLeafletMap', oDialog => oDialog.destroy());
    },
    onIconPressUnassignImageFromTaxon: function _onIconPressUnassignImageFromTaxon(oEvent) {
      const oSource = oEvent.getSource();
      const oTaxonModel = this.getOwnerComponent().getModel('taxon');
      this.ImageToTaxon.unassignImageFromTaxon(oSource, oTaxonModel);
    },
    onIconPressAssignImageToTaxon: function _onIconPressAssignImageToTaxon(oEvent) {
      const oSource = oEvent.getSource();
      const oTaxonModel = this.getOwnerComponent().getModel('taxon');
      this.ImageToTaxon.assignImageToTaxon(oSource, oTaxonModel);
    },
    onEditPropertyValueDelete: function _onEditPropertyValueDelete(oEvent) {
      var oPropertiesModel = this.getOwnerComponent().getModel('properties');
      const oPropertiesTaxaModel = this.getOwnerComponent().getModel('propertiesTaxa');
      const oPropertiesBindingContext = oEvent.getSource().getBindingContext('properties');
      this.propertiesUtil.editPropertyValueDelete(oPropertiesModel, oPropertiesTaxaModel, oPropertiesBindingContext, this._oCurrentPlant);
    },
    onCloseDialogEditPropertyValue: function _onCloseDialogEditPropertyValue(evt) {
      this.applyToFragment('dialogEditPropertyValue', oPopover => oPopover.close());
    },
    onCloseAddPropertiesDialog: function _onCloseAddPropertiesDialog(evt) {
      evt.getParameter('openBy').setType('Transparent');
      evt.getSource().destroy();
    },
    onOpenDialogAddProperty: function _onOpenDialogAddProperty(oEvent) {
      const oBtnAddProperty = oEvent.getSource();
      const oModelPropertyNames = oBtnAddProperty.getModel('propertyNames');
      this.propertiesUtil.openDialogAddProperty(this.getView(), this._oCurrentPlant, oBtnAddProperty);
    },
    onCloseNewPropertyNameDialog: function _onCloseNewPropertyNameDialog(evt) {
      this.propertiesUtil.closeNewPropertyNameDialog();
    },
    onAddProperty: function _onAddProperty(oEvent) {
      this.propertiesUtil.addProperty(this.getView(), oEvent.getSource());
    },
    onNewPropertyNameCreate: function _onNewPropertyNameCreate(oEvent) {
      var oSource = oEvent.getSource();
      this.propertiesUtil.createNewPropertyName(oSource, this.getView());
    },
    onOpenDialogNewProperty: function _onOpenDialogNewProperty(oEvent) {
      const oPlant = this.getView().getBindingContext('plants').getObject();
      var oSource = oEvent.getSource();
      this.propertiesUtil.openDialogNewProperty(oPlant, oSource);
    },
    onEditPropertyValueTag: function _onEditPropertyValueTag(oEvent) {
      // show fragment to edit or delete property value
      var oSource = oEvent.getSource();
      var sPathPropertyValue = oSource.getBindingContext('properties').getPath();
      // var oModelSoils = this._getFragment('dialogEvent').getModel('soils');

      this.applyToFragment('dialogEditPropertyValue', oPopover => {
        // oPopover.setModel(oModelSoils, 'soils');
        oPopover.bindElement({
          path: sPathPropertyValue,
          model: "properties"
        });
        oPopover.openBy(oSource, true);
      });
    },
    activateRadioButton: function _activateRadioButton(oEvent) {
      const oSource = oEvent.getSource();
      const sRadioButtonId = oSource.data('radiobuttonId');
      const oRadioButton = this.byId(sRadioButtonId);
      oRadioButton.setSelected(true);
    },
    onSoilMixSelect: function _onSoilMixSelect(oEvent) {
      // transfer selected soil from soils model to new/edit-event model (which has only one entry)
      const oSource = oEvent.getSource();
      const oContexts = oSource.getSelectedContexts();
      if (oContexts.length !== 1) {
        MessageToast.show('No or more than one soil selected');
        throw new Error('No or more than one soil selected');
      }
      var oSelectedSoil = oContexts[0].getObject();
      this.applyToFragment('dialogEvent', oDialog => {
        const oModelNewEvent = oDialog.getModel("editOrNewEvent");
        const oSelectedDataNew = Util.getClonedObject(oSelectedSoil);
        oModelNewEvent.setProperty('/soil', oSelectedDataNew);
      });
    },
    onOpenDialogAddEvent: function _onOpenDialogAddEvent(oEvent) {
      this.applyToFragment('dialogEvent', oDialog => {
        // get soils collection from backend proposals resource
        this.eventsUtil._loadSoils(this.getView());

        // if dialog was used for editing an event before, then destroy it first
        if (!!oDialog.getModel("editOrNewEvent") && oDialog.getModel("editOrNewEvent").getProperty('/mode') !== 'new') {
          oDialog.getModel("editOrNewEvent").destroy();
          oDialog.setModel(null, "editOrNewEvent");

          // set header and button to add instead of edit
          const oI18Model = this.getView().getModel("i18n");
          const oResourceBundle = oI18Model.getResourceBundle();
          oDialog.setTitle(oResourceBundle.getText("header_event"));
          const oBtnSave = this.getView().byId('btnEventUpdateSave');
          oBtnSave.setText('Add');
        }

        // set defaults for new event
        if (!oDialog.getModel("editOrNewEvent")) {
          let mEventEditData = this.eventsUtil._getInitialEvent(this._oCurrentPlant.id);
          mEventEditData.mode = 'new';
          const oEventEditModel = new JSONModel(mEventEditData);
          oDialog.setModel(oEventEditModel, "editOrNewEvent");
        }
        this.getView().addDependent(oDialog);
        oDialog.open();
      });
    },
    onEditEvent: function _onEditEvent(oEvent) {
      // triggered by edit button in a custom list item header in events list
      const oSource = oEvent.getSource();
      const oSelectedEvent = oSource.getBindingContext('events').getObject();
      this.eventsUtil.editEvent(oSelectedEvent, this.getView(), this._oCurrentPlant.id);
    },
    onOpenDialogEditSoil: function _onOpenDialogEditSoil(oEvent) {
      const oSource = oEvent.getSource();
      const oSoil = oSource.getBindingContext('soils').getObject();
      this.eventsUtil.openDialogEditSoil(this.getView(), oSoil);
    },
    onOpenDialogNewSoil: function _onOpenDialogNewSoil(oEvent) {
      this.eventsUtil.openDialogNewSoil(this.getView());
    },
    onAddOrEditEvent: function _onAddOrEditEvent(oEvent) {
      //Triggered by 'Add' / 'Update' Button in Create/Edit Event Dialog
      this.eventsUtil.addOrEditEvent(this.getView(), this._oCurrentPlant);
    },
    onUpdateOrCreateSoil: function _onUpdateOrCreateSoil(oEvent) {
      const oEditedSoil = oEvent.getSource().getBindingContext('editedSoil').getObject();
      const oSoilsModel = this.byId('dialogEvent').getModel('soils');
      this.eventsUtil.updateOrCreateSoil(oEditedSoil, oSoilsModel);
    },
    onCancelEditSoil: function _onCancelEditSoil(oEvent) {
      this.applyToFragment('dialogEditSoil', oDialog => oDialog.close());
    },
    onDeleteEventsTableRow: function _onDeleteEventsTableRow(oEvent) {
      const oSelectedEvent = oEvent.getParameter('listItem').getBindingContext('events').getObject();
      const oEventsModel = this.getOwnerComponent().getModel('events');
      this.eventsUtil.deleteEventsTableRow(oSelectedEvent, oEventsModel, this._oCurrentPlant);
    },
    onIconPressUnassignImageFromEvent: function _onIconPressUnassignImageFromEvent(oEvent) {
      const sEventsBindingPath = oEvent.getParameter('listItem').getBindingContextPath('events');
      const oEventsModel = this.getOwnerComponent().getModel('events');
      this.imageEventHandlers.unassignImageFromEvent(sEventsBindingPath, oEventsModel);
    },
    onAssignEventToImage: function _onAssignEventToImage(oEvent) {
      // triggered upon selection of event in event selection dialog for an image get selected event
      const oSource = oEvent.getSource();
      const oEventsModel = this.getView().getModel('events');
      const oPopoverAssignEventToImage = this.byId('dialogAssignEventToImage');
      this.imageEventHandlers.assignEventToImage(oSource, oEventsModel, oPopoverAssignEventToImage);
    },
    onIconPressAssignImageToEvent: function _onIconPressAssignImageToEvent(oEvent) {
      const oSource = oEvent.getSource();
      this.imageEventHandlers.assignImageToEvent(oSource);
    },
    onAddPlantNameToUntaggedImage: function _onAddPlantNameToUntaggedImage(oEvent) {
      //adds selected plant in input field (via suggestions) to an image in (details view)
      //note: there's a same-named function in untagged controller doing the same thing for untagged images
      const oSource = oEvent.getSource();
      const oImage = oSource.getBindingContext("images").getObject();
      const oSelectedSuggestion = oEvent.getParameter('selectedRow');
      const oSelectedPlant = oSelectedSuggestion.getBindingContext('plants').getObject();
      const oImagesModel = this.oComponent.getModel('images');
      this.imageEventHandlers.assignPlantToImage(oSelectedPlant, oImage, oImagesModel);
      // this.imageEventHandlers.addPlantNameToImage();
      oImagesModel.updateBindings(true);
      oSource.setValue('');
    },
    onPressImagePlantToken: function _onPressImagePlantToken(oEvent) {
      //navigate to chosen plant in plant details view when clicking on plant token in untagged images view
      //note: there's a same-named function in untagged controller doing the same thing for untagged images
      const oSource = oEvent.getSource();
      const oPlantTag = oSource.getBindingContext('images').getObject();
      if (!oPlantTag.plant_id || oPlantTag.plant_id <= 0) throw new Error("Unexpected error: No Plant ID");
      const oComponent = this.getOwnerComponent();

      //navigate to plant in layout's current column (i.e. middle column)
      Navigation.getInstance().navToPlant(this.getPlantById(oPlantTag.plant_id), oComponent);
    },
    onIconPressDeleteImage: function _onIconPressDeleteImage(oEvent) {
      //note: there's a same-named function in untagged controller doing the same thing for untagged images
      const oSource = oEvent.getSource();
      const oImage = oSource.getBindingContext("images").getObject();

      //confirm dialog
      var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
      MessageBox.confirm("Delete this image?", {
        title: "Delete",
        onClose: this.confirmDeleteImage.bind(this, oImage),
        actions: ['Delete', 'Cancel'],
        styleClass: bCompact ? "sapUiSizeCompact" : ""
      });
    },
    onInputImageNewKeywordSubmit: function _onInputImageNewKeywordSubmit(oEvent) {
      //note: there's a same-named function in untagged controller doing the same thing for untagged images
      const oInput = oEvent.getSource();
      oInput.setValue('');

      // check not empty and new
      const sKeyword = oEvent.getParameter('value').trim();
      if (!sKeyword) {
        return;
      }
      const oImage = oInput.getParent().getBindingContext('images').getObject();
      let aKeywords = oImage.keywords;
      if (aKeywords.find(ele => ele.keyword === sKeyword)) {
        MessageToast.show('Keyword already in list');
        return;
      }

      //add to current image keywords in images model
      aKeywords.push({
        keyword: sKeyword
      });
      const oImagesModel = this.oComponent.getModel('images');
      oImagesModel.updateBindings(false);
    },
    onTokenizerTokenDelete: function _onTokenizerTokenDelete(oEvent) {
      // triggered upon changes of image's plant assignments and image's keywords
      // note: the token itself has already been deleted; here, we only delete the 
      // 		 corresponding entry from the model
      //note: there's a same-named function in untagged controller doing the same thing for untagged images
      if (oEvent.getParameter('type') !== 'removed') return;
      const sKey = oEvent.getParameter('token').getProperty('key'); //either plant name or keyword
      const oTokenizer = oEvent.getSource();
      const oImage = oTokenizer.getParent().getBindingContext('images').getObject();
      const oModel = this.oComponent.getModel('images');
      const sType = oTokenizer.data('type'); // plant|keyword

      this.imageEventHandlers.removeTokenFromModel(sKey, oImage, oModel, sType);
    },
    onUploadPlantPhotosToServer: function _onUploadPlantPhotosToServer(oEvent) {
      //upload images and directly assign them to supplied plant; no keywords included
      var oFileUploader = this.byId("idPlantPhotoUpload");
      if (!oFileUploader.getValue()) {
        // 
        return;
      }
      var sPath = 'plants/' + this._oCurrentPlant.id + '/images/';
      Util.startBusyDialog('Uploading...', 'Image File(s)');
      var sUrl = Util.getServiceUrl(sPath);
      oFileUploader.setUploadUrl(sUrl);
      oFileUploader.upload();
    },
    handleUploadPlantImagesComplete: function _handleUploadPlantImagesComplete(oEvent) {
      // handle message, show error if required
      var oResponse = JSON.parse(oEvent.getParameter('responseRaw'));
      if (!oResponse) {
        const sMsg = "Upload complete, but can't determine status.";
        MessageUtil.getInstance().addMessage(MessageType.Warning, sMsg);
      }
      MessageUtil.getInstance().addMessageFromBackend(oResponse.message);

      // add to images registry and refresh current plant's images
      if (oResponse.images.length > 0) {
        this.modelsHelper.addToImagesRegistry(oResponse.images);
        this.resetImagesCurrentPlant(this._oCurrentPlant.id);
        this.oComponent.getModel('images').updateBindings(false);
      }
      Util.stopBusyDialog();
      MessageToast.show(oResponse.message.message);
    },
    onHandleTypeMissmatch: function _onHandleTypeMissmatch(oEvent) {
      // handle file type missmatch for image upload
      // note: there's a same-nemed method in flexible column layout controller handling uploads there
      const oFileUpload = oEvent.getSource();
      const sFiletype = oEvent.getParameter("fileType");
      this.imageEventHandlers.handleTypeMissmatch(oFileUpload, sFiletype);
    }
  });
  return Detail;
});
//# sourceMappingURL=Detail.controller.js.map