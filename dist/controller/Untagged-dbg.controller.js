sap.ui.define(["plants/ui/controller/BaseController", "sap/m/MessageBox", "plants/ui/model/formatter", "plants/ui/model/ModelsHelper", "plants/ui/customClasses/Util", "sap/m/MessageToast", "plants/ui/customClasses/ImageEventHandlers", "../customClasses/Navigation"], function (__BaseController, MessageBox, __formatter, __ModelsHelper, Util, MessageToast, __ImageEventHandlers, __Navigation) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  const formatter = _interopRequireDefault(__formatter);
  const ModelsHelper = _interopRequireDefault(__ModelsHelper);
  const ImageEventHandlers = _interopRequireDefault(__ImageEventHandlers);
  const Navigation = _interopRequireDefault(__Navigation);
  /**
   * @namespace plants.ui.controller
   */
  const Untagged = BaseController.extend("plants.ui.controller.Untagged", {
    constructor: function constructor() {
      BaseController.prototype.constructor.apply(this, arguments);
      this.formatter = new formatter();
    },
    onInit: function _onInit() {
      BaseController.prototype.onInit.call(this);
      this.oRouter.getRoute("untagged").attachPatternMatched(this._onPatternMatched, this);
      this.imageEventHandlers = ImageEventHandlers.getInstance(this.applyToFragment.bind(this));
      this.oComponent.getModel('status').setProperty('/untagged_selectable', false);
    },
    _onPatternMatched: function _onPatternMatched(oEvent) {
      // get current plant id
      this._currentPlantId = parseInt(oEvent.getParameter("arguments").plant_id || this._currentPlantId || "0");

      // this is called when closing untagged view as well
      if (oEvent.getParameter('name') !== 'untagged') {
        return;
      }
    },
    handleClose: function _handleClose() {
      var sNextLayout = this.oComponent.getModel().getProperty("/actionButtonsInfo/endColumn/closeColumn");
      this.oRouter.navTo("detail", {
        layout: sNextLayout,
        plant_id: this._currentPlantId
      });
    },
    onPressReApplyUntaggedFilter: function _onPressReApplyUntaggedFilter() {
      //triggered by text button to manually filter for untagged images
      // this.resetUntaggedPhotos();
      this.oComponent.resetUntaggedPhotos();
    },
    onToggleSelectManyListMode: function _onToggleSelectManyListMode(oEvent) {
      const oSource = oEvent.getSource();
      const sCurrentType = oSource.getType(); // 'Transparent' or 'Emphasized'
      const oUntaggedList = this.byId('listImagesUntagged');
      const oStatusModel = this.getView().getModel('status');
      if (sCurrentType === 'Transparent') {
        // set multi-select mode
        oSource.setType('Emphasized');
        oUntaggedList.setMode('MultiSelect');
        // we need to save current mode to a model to allow access via expression binding
        oStatusModel.setProperty('/untagged_selectable', true);
      } else {
        // set default mode
        oSource.setType('Transparent');
        oUntaggedList.setMode('None');
        oStatusModel.setProperty('/untagged_selectable', false);
      }
    },
    onSelectNone: function _onSelectNone(oEvent) {
      this._resetSelection(this.byId('listImagesUntagged'));
    },
    _resetSelection: function _resetSelection(oList) {
      oList.getItems().forEach(function (item) {
        item.setSelected(false);
      });
    },
    onSelectAll: function _onSelectAll(oEvent) {
      this.byId('listImagesUntagged').getItems().forEach(function (item) {
        item.setSelected(true);
      });
    },
    onDeleteSelected: function _onDeleteSelected(oEvent) {
      //delete 1..n selected images
      const oList = this.byId('listImagesUntagged');
      const aSelectedItems = oList.getSelectedItems();
      const aSelectedImages = aSelectedItems.map(item => item.getBindingContext('untaggedImages').getObject());
      if (aSelectedItems.length == 0) {
        MessageToast.show("Nothing selected.");
        return;
      }
      var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
      MessageBox.confirm("Delete " + aSelectedItems.length + " images?", {
        title: "Delete",
        onClose: this._confirmDeleteSelectedImages.bind(this, aSelectedImages),
        actions: ['Delete', 'Cancel'],
        styleClass: bCompact ? "sapUiSizeCompact" : ""
      });
    },
    _confirmDeleteSelectedImages: function _confirmDeleteSelectedImages(aSelectedImages, sAction) {
      if (sAction !== 'Delete') {
        return;
      }
      $.ajax({
        url: Util.getServiceUrl('images/'),
        type: 'DELETE',
        contentType: "application/json",
        data: JSON.stringify({
          'images': aSelectedImages
        }),
        context: this
      }).done(this.onAjaxDeletedImagesSuccess.bind(this, aSelectedImages, this.onSelectNone.bind(this))).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Images (DELETE)'));
    },
    onAddDetailsPlantToUntaggedImage: function _onAddDetailsPlantToUntaggedImage(oEvent) {
      //adds current plant in details view to the image in untagged view; triggered from "<-"" Button
      const oPlant = this.getPlantById(this._currentPlantId);
      const oBindingContextImage = oEvent.getSource().getParent().getBindingContext("untaggedImages");
      const oImage = oBindingContextImage.getObject();
      const oImagesModel = this.oComponent.getModel('images');
      this.imageEventHandlers.assignPlantToImage(oPlant, oImage, oImagesModel);
      this.getView().getModel('untaggedImages').updateBindings(true);
      this.resetImagesCurrentPlant(this._currentPlantId);
    },
    onAddPlantNameToUntaggedImage: function _onAddPlantNameToUntaggedImage(oEvent) {
      //adds selected plant in input field (via suggestions) to an image (untagged view)
      //note: there's a same-named function in detail controller doing the same thing for non-untagged images
      const oSource = oEvent.getSource();
      const oImage = oSource.getBindingContext("untaggedImages").getObject();
      const oSelectedSuggestion = oEvent.getParameter('selectedRow');
      const oSelectedPlant = oSelectedSuggestion.getBindingContext('plants').getObject();
      const oImagesModel = this.oComponent.getModel('images');
      this.imageEventHandlers.assignPlantToImage(oSelectedPlant, oImage, oImagesModel);
      this.getView().getModel('untaggedImages').updateBindings(true);
      oSource.setValue('');
    },
    onPressImagePlantToken: function _onPressImagePlantToken(oEvent) {
      //navigate to chosen plant in plant details view when clicking on plant token in untagged images view
      //note: there's a same-named function in detail controller doing the same thing for non-untagged images
      const oSource = oEvent.getSource();
      const oPlantTag = oSource.getBindingContext('untaggedImages').getObject();
      if (!oPlantTag.plant_id || oPlantTag.plant_id <= 0) throw new Error("Unexpected error: No Plant ID");

      //navigate to plant in layout's current column (i.e. middle column)
      Navigation.getInstance().navToPlant(this.getPlantById(oPlantTag.plant_id), this.oComponent);
    },
    onIconPressDeleteImage: function _onIconPressDeleteImage(oEvent) {
      //note: there's a same-named function in detail controller doing the same thing for non-untagged images
      const oSource = oEvent.getSource();
      const oImage = oSource.getBindingContext("untaggedImages").getObject();

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
      //note: there's a same-named function in detail controller doing the same thing for non-untagged images
      const oInput = oEvent.getSource();
      oInput.setValue('');

      // check not empty and new
      const sKeyword = oEvent.getParameter('value').trim();
      if (!sKeyword) {
        return;
      }
      const oImage = oInput.getParent().getBindingContext('untaggedImages').getObject();
      let aKeywords = oImage.keywords;
      if (aKeywords.find(ele => ele.keyword === sKeyword)) {
        MessageToast.show('Keyword already in list');
        return;
      }

      //add to current image keywords in untaggedImages model
      aKeywords.push({
        keyword: sKeyword
      });
      const oImagesModel = this.oComponent.getModel('untaggedImages');
      oImagesModel.updateBindings(false);
    },
    onTokenizerTokenDelete: function _onTokenizerTokenDelete(oEvent) {
      // triggered upon changes of image's plant assignments and image's keywords
      // note: the token itself has already been deleted; here, we only delete the 
      // 		 corresponding entry from the model
      //note: there's a same-named function in detail controller doing the same thing for non-untagged images
      if (oEvent.getParameter('type') !== 'removed') return;
      const sKey = oEvent.getParameter('token').getProperty('key'); //either plant name or keyword
      const oTokenizer = oEvent.getSource();
      const oImage = oTokenizer.getParent().getBindingContext('untaggedImages').getObject();
      const oModel = this.oComponent.getModel('untaggedImages');
      const sType = oTokenizer.data('type'); // plant|keyword

      this.imageEventHandlers.removeTokenFromModel(sKey, oImage, oModel, sType);
    }
  });
  return Untagged;
});
//# sourceMappingURL=Untagged.controller.js.map