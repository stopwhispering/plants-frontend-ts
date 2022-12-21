sap.ui.define(["plants/ui/controller/BaseController", "plants/ui/model/ModelsHelper", "plants/ui/customClasses/MessageUtil", "plants/ui/model/formatter", "sap/m/MessageToast", "sap/m/MessageBox", "plants/ui/customClasses/Util", "sap/m/Token", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "plants/ui/customClasses/Navigation", "sap/ui/core/library", "../customClasses/ImageEventHandlers"], function (__BaseController, __ModelsHelper, __MessageUtil, __formatter, MessageToast, MessageBox, Util, Token, Filter, FilterOperator, __Navigation, sap_ui_core_library, __ImageEventHandlers) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  const ModelsHelper = _interopRequireDefault(__ModelsHelper);
  const MessageUtil = _interopRequireDefault(__MessageUtil);
  const formatter = _interopRequireDefault(__formatter);
  const Action = MessageBox["Action"];
  const Navigation = _interopRequireDefault(__Navigation);
  const MessageType = sap_ui_core_library["MessageType"];
  const ImageEventHandlers = _interopRequireDefault(__ImageEventHandlers);
  /**
   * @namespace plants.ui.controller
   */
  const FlexibleColumnLayout = BaseController.extend("plants.ui.controller.FlexibleColumnLayout", {
    constructor: function constructor() {
      BaseController.prototype.constructor.apply(this, arguments);
      this.formatter = new formatter();
      this.mIdToFragment = {
        MessagePopover: "plants.ui.view.fragments.menu.MessagePopover",
        dialogUploadPhotos: "plants.ui.view.fragments.menu.UploadPhotos",
        menuShellBarMenu: "plants.ui.view.fragments.menu.ShellBarMenu"
      };
    },
    onInit: function _onInit() {
      BaseController.prototype.onInit.call(this);
      this._oRouter = this.oComponent.getRouter();
      this._oRouter.attachBeforeRouteMatched(this._onBeforeRouteMatched, this);
      this._oRouter.attachRouteMatched(this._onRouteMatched, this);
      this.imageEventHandlers = ImageEventHandlers.getInstance(this.applyToFragment.bind(this));
    },
    _onBeforeRouteMatched: function _onBeforeRouteMatched(oEvent) {
      // called each time any route is triggered, i.e. each time one of the views change
      // updates the layout model: inserts the new layout into it
      var oLayoutModel = this.oComponent.getModel();
      var sLayout = oEvent.getParameter('arguments').layout; // e.g. "TwoColumnsMidExpanded"

      // If there is no layout parameter, query for the default level 0 layout (normally OneColumn)
      if (!sLayout) {
        var oNextUIState = this.oComponent.getHelper().getNextUIState(0);
        sLayout = oNextUIState.layout;
      }

      // Update the layout of the FlexibleColumnLayout
      if (sLayout) {
        oLayoutModel.setProperty("/layout", sLayout);
      }
    },
    _onRouteMatched: function _onRouteMatched(oEvent) {
      var sRouteName = oEvent.getParameter("name"),
        oArguments = oEvent.getParameter("arguments");
      this._updateUIElements();

      // Save the current route name
      this._currentRouteName = sRouteName; // e.g. "detail"
      // this.currentPlant = oArguments.product;
      this._currentPlantId = oArguments.plant_id;
    },
    applyToFragment: function _applyToFragment(sId, fn, fnInit) {
      // to enable vs code to connect fragments with a controller, we may not mention
      // the Dialog/Popover ID in the base controller; therefore we have these names
      // hardcoded in each controller 
      BaseController.prototype.applyToFragment.call(this, sId, fn, fnInit, this.mIdToFragment);
    },
    onStateChanged: function _onStateChanged(oEvent) {
      this._updateUIElements();

      // Replace the URL with the new layout if a navigation arrow was used
      const bIsNavigationArrow = oEvent.getParameter("isNavigationArrow");
      if (bIsNavigationArrow) {
        const sLayout = oEvent.getParameter("layout"); // e.g. "OneColumn"
        this._oRouter.navTo(this._currentRouteName, {
          layout: sLayout,
          plant_id: this._currentPlantId
          // }, true);
        });
      }
    },
    _updateUIElements: function _updateUIElements() {
      // Update the close/fullscreen buttons visibility
      var oUIState = this.oComponent.getHelper().getCurrentUIState();

      // somehow with the migration to TS, starting the page with a TwoColumnLayout as URL does
      // not work. Therefore, we need an ugly hack here. Todo: Make it better.
      if (window.location.hash.includes('TwoColumnsMidExpanded')) {
        oUIState.layout = "TwoColumnsMidExpanded";
        oUIState.columnsVisibility.midColumn = true;
      } else if (window.location.hash.includes('ThreeColumnsMidExpanded')) {
        oUIState.layout = "ThreeColumnsMidExpanded";
        oUIState.columnsVisibility.midColumn = true;
        oUIState.columnsVisibility.endColumn = true;
      }
      var oModel = this.oComponent.getModel();
      if (oModel) oModel.setData(oUIState);
    },
    onExit: function _onExit() {
      this._oRouter.detachRouteMatched(this._onRouteMatched, this);
      this._oRouter.detachBeforeRouteMatched(this._onBeforeRouteMatched, this);
    },
    onShellBarMenuButtonPressed: function _onShellBarMenuButtonPressed(oEvent) {
      var oSource = oEvent.getSource();
      this.applyToFragment('menuShellBarMenu', oMenu => {
        oMenu.openBy(oSource, true);
      });
    },
    generateMissingThumbnails: function _generateMissingThumbnails() {
      $.ajax({
        url: Util.getServiceUrl('generate_missing_thumbnails'),
        type: 'POST',
        contentType: "application/json",
        context: this
      }).done(this.onReceiveSuccessGeneric).fail(ModelsHelper.getInstance(undefined).onReceiveErrorGeneric.bind(this, 'Generate Missing Thumbnails (POST)'));
    },
    onPressButtonSave: function _onPressButtonSave() {
      this.savePlantsAndImages(); // implemented in BaseController
    },
    onPressButtonRefreshData: function _onPressButtonRefreshData() {
      //refresh data from backend

      // check if there are any unsaved changes
      var aModifiedPlants = this.getModifiedPlants();
      var aModifiedImages = this.getModifiedImages();
      var aModifiedTaxa = this.getModifiedTaxa();

      // if modified data exists, ask for confirmation if all changes should be undone
      if (aModifiedPlants.length !== 0 || aModifiedImages.length !== 0 || aModifiedTaxa.length !== 0) {
        var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
        MessageBox.confirm("Revert all changes?", {
          onClose: this._onCloseRefreshConfirmationMessageBox.bind(this),
          styleClass: bCompact ? "sapUiSizeCompact" : ""
        });
      } else {
        //no modified data, therefore call handler directly with 'OK'
        this._onCloseRefreshConfirmationMessageBox(Action.OK);
      }
    },
    _onCloseRefreshConfirmationMessageBox: function _onCloseRefreshConfirmationMessageBox(eAction) {
      //callback for onPressButtonUndo's confirmation dialog
      //revert all changes and return to data since last save or loading of site
      if (eAction === Action.OK) {
        Util.startBusyDialog('Loading...', 'Loading plants, taxa, and images');
        var oModelsHelper = ModelsHelper.getInstance();
        oModelsHelper.reloadPlantsFromBackend();
        // oModelsHelper.reloadImagesFromBackend();
        oModelsHelper.resetImagesRegistry();
        // todo: reload current plant's images
        oModelsHelper.reloadTaxaFromBackend();
      }
    },
    onOpenFragmentUploadPhotos: function _onOpenFragmentUploadPhotos(oEvent) {
      this.applyToFragment('dialogUploadPhotos', oDialog => oDialog.open(), oDialog => {
        // executed only once
        var oMultiInputKeywords = this.byId('multiInputUploadImageKeywords');
        oMultiInputKeywords.addValidator(this._keywordValidator);
        // oMultiInputKeywords.addValidator(function (args) {
        // 	var text = args.text;
        // 	return new Token({ key: text, text: text });
        // });
      });
    },
    _keywordValidator: function _keywordValidator(args) {
      // validator function for Keywords MultiInput
      var text = args.text;
      return new Token({
        key: text,
        text: text
      });
    },
    uploadPhotosToServer: function _uploadPhotosToServer(oEvent) {
      //triggered by upload-button in fragment after selecting files
      var oFileUploader = this.byId("idPhotoUpload");
      if (!oFileUploader.getValue()) {
        MessageToast.show("Choose a file first");
        return;
      }
      Util.startBusyDialog('Uploading...', 'Image File(s)');
      var sUrl = Util.getServiceUrl('images/');
      oFileUploader.setUploadUrl(sUrl);

      // the images may be tagged with plants already upon uploading
      var aSelectedTokens = this.byId('multiInputUploadImagePlants').getTokens();
      var aSelectedPlantIds = [];
      if (aSelectedTokens.length > 0) {
        for (var i = 0; i < aSelectedTokens.length; i++) {
          aSelectedPlantIds.push(aSelectedTokens[i].getProperty('key'));
        }
      }

      // same applies to tagging with keywords
      var aSelectedKeywordTokens = this.byId('multiInputUploadImageKeywords').getTokens();
      var aSelectedKeywords = [];
      if (aSelectedKeywordTokens.length > 0) {
        for (i = 0; i < aSelectedKeywordTokens.length; i++) {
          aSelectedKeywords.push(aSelectedKeywordTokens[i].getProperty('key'));
        }
      } else {
        // oFileUploader.setAdditionalData(); //from earlier uploads
      }
      var oAdditionalData = {
        'plants': aSelectedPlantIds,
        'keywords': aSelectedKeywords
      };
      // set even if empty (may be filled from earlier run)
      //the file uploader control can only send strings
      oFileUploader.setAdditionalData(JSON.stringify(oAdditionalData));
      oFileUploader.upload();
    },
    handleUploadComplete: function _handleUploadComplete(oEvent) {
      // handle message, show error if required
      var sResponse = oEvent.getParameter('responseRaw');
      if (!sResponse) {
        var sMsg = "Upload complete, but can't determine status. No response received.";
        MessageUtil.getInstance().addMessage(MessageType.Warning, sMsg, undefined, undefined);
        Util.stopBusyDialog();
        return;
      }
      var oResponse = JSON.parse(sResponse);
      if (!oResponse) {
        sMsg = "Upload complete, but can't determine status. Can't parse Response.";
        MessageUtil.getInstance().addMessage(MessageType.Warning, sMsg, undefined, undefined);
        Util.stopBusyDialog();
        return;
      }
      MessageUtil.getInstance().addMessageFromBackend(oResponse.message);
      // add to images registry and refresh current plant's images
      if (oResponse.images.length > 0) {
        ModelsHelper.getInstance().addToImagesRegistry(oResponse.images);

        // plant's images model and untagged images model might need to be refreshed
        this.resetImagesCurrentPlant(this._currentPlantId);
        this.oComponent.getModel('images').updateBindings(false);

        // this.resetUntaggedPhotos();
        this.oComponent.resetUntaggedPhotos();
        this.oComponent.getModel('untaggedImages').updateBindings(false);
      }
      Util.stopBusyDialog();
      MessageToast.show(oResponse.message.message);
      this.applyToFragment('dialogUploadPhotos', oDialog => oDialog.close());
    },
    onIconPressAssignDetailsPlant: function _onIconPressAssignDetailsPlant(oEvent) {
      // triggered by assign-to-current-plant button in image upload dialog
      // add current plant to plants multicombobox
      var plant = this.getPlantById(this._currentPlantId);
      if (!plant) {
        return;
      }

      // add to multicombobox if not a duplicate
      var oControl = this.byId('multiInputUploadImagePlants');
      if (!oControl.getTokens().find(ele => ele.getProperty('key') == plant.plant_name)) {
        var oPlantToken = new Token({
          key: plant.id.toString(),
          text: plant.plant_name
        });
        oControl.addToken(oPlantToken);
      }
    },
    onShowUntagged: function _onShowUntagged(oEvent) {
      //we need the currently selected plant as untagged requires a middle column
      //(button triggering this is only visible if middle column is visible)
      //ex. detail/146/TwoColumnsMidExpanded" --> 146
      //ex. detail/160 --> 160
      // var sCurrentHash = this.oComponent.getRouter().oHashChanger.getHash();
      // var aHashItems = sCurrentHash.split('/');
      // if(!([2,3].includes(aHashItems.length)) || aHashItems[0] !== 'detail' ){
      // 	MessageToast.show('Technical issue with browser hash. Refresh website.');
      // 	return;
      // }
      // var iPlantIndex = aHashItems[1];

      var oNextUIState = this.oComponent.getHelper().getNextUIState(2);
      // this._oRouter.navTo("untagged", {layout: oNextUIState.layout, 
      // 								product: iPlantIndex});

      this._oRouter.navTo("untagged", {
        layout: oNextUIState.layout,
        plant_id: this._currentPlantId
      });
    },
    onShellBarSearch: function _onShellBarSearch(oEvent) {
      // navigate to selected plant
      var plantId = oEvent.getParameter('suggestionItem').getBindingContext('plants').getObject().id;
      Navigation.getInstance().navToPlantDetails(plantId);
    },
    onShellBarSuggest: function _onShellBarSuggest(oEvent) {
      var sValue = oEvent.getParameter("suggestValue"),
        aFilters = [];

      // we always filter on only active plants for search field
      var oFilter = new Filter("active", FilterOperator.EQ, true);

      // create or-connected filter for multiple fields based on query value
      if (sValue) {
        aFilters = [new Filter([new Filter("plant_name", function (sText) {
          return (sText || "").toUpperCase().indexOf(sValue.toUpperCase()) > -1;
        }), new Filter("botanical_name", function (sText) {
          return (sText || "").toUpperCase().indexOf(sValue.toUpperCase()) > -1;
        }), new Filter("id", FilterOperator.EQ, sValue)])];
        var oOrFilter = new Filter({
          filters: aFilters,
          and: false
        });
        // connect via <<and>>
        oFilter = new Filter({
          filters: [oFilter, oOrFilter],
          and: true
        });
      }
      const oSearchField = this.byId("searchField");
      const oSuggestionItemsBinding = oSearchField.getBinding("suggestionItems");
      oSuggestionItemsBinding.filter(oFilter);
      //@ts-ignore  somehow missing in definitions
      oSearchField.suggest();
    },
    onShellBarNotificationsPressed: function _onShellBarNotificationsPressed(oEvent) {
      // open messages popover fragment, called by shellbar button in footer
      var oSource = oEvent.getSource();
      this.applyToFragment('MessagePopover', oPopover => {
        oPopover.isOpen() ? oPopover.close() : oPopover.openBy(oSource, true);
      });
    },
    onClearMessages: function _onClearMessages(oEvent) {
      //clear messages in message popover fragment
      MessageUtil.getInstance().removeAllMessages();
    },
    onHomeIconPressed: function _onHomeIconPressed(oEvent) {
      // go to home site, i.e. master view in single column layout
      var oHelper = this.oComponent.getHelper();
      //@ts-ignore
      var sNextLayoutType = oHelper.getDefaultLayouts().defaultLayoutType;
      this._oRouter.navTo("master", {
        layout: sNextLayoutType
      });
    },
    onHandleTypeMissmatch: function _onHandleTypeMissmatch(oEvent) {
      // handle file type missmatch for image upload
      // note: there's a same-nemed method in detail controller handling uploads there
      const oFileUpload = oEvent.getSource();
      const sFiletype = oEvent.getParameter("fileType");
      this.imageEventHandlers.handleTypeMissmatch(oFileUpload, sFiletype);
    }
  });
  return FlexibleColumnLayout;
});
//# sourceMappingURL=FlexibleColumnLayout.controller.js.map