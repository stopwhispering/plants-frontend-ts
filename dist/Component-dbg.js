sap.ui.define(["sap/ui/core/UIComponent", "plants/ui/model/models", "sap/ui/model/json/JSONModel", "sap/f/FlexibleColumnLayoutSemanticHelper", "plants/ui/model/ModelsHelper", "plants/ui/customClasses/MessageUtil", "plants/ui/customClasses/Util", "./customClasses/Navigation", "sap/base/util/UriParameters", "sap/f/library"], function (UIComponent, models, JSONModel, FlexibleColumnLayoutSemanticHelper, __ModelsHelper, __MessageUtil, Util, __Navigation, UriParameters, sap_f_library) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const ModelsHelper = _interopRequireDefault(__ModelsHelper);
  const MessageUtil = _interopRequireDefault(__MessageUtil);
  const Navigation = _interopRequireDefault(__Navigation);
  const LayoutType = sap_f_library["LayoutType"];
  /**
   * @namespace plants.ui
   */
  const Component = UIComponent.extend("plants.ui.Component", {
    constructor: function constructor() {
      UIComponent.prototype.constructor.apply(this, arguments);
      this.imagesRegistry = {};
      this.imagesRegistryClone = {};
      this.imagesPlantsLoaded = new Set();
      this.oEventsDataClone = {};
      this.oPropertiesDataClone = {};
      this.oPlantsDataClone = {};
      this.oTaxonDataClone = {};
      this.oPropertiesTaxonDataClone = {};
    },
    metadata: {
      manifest: "json"
    },
    init: function _init() {
      // call the base component's init function
      UIComponent.prototype.init.call(this);
      // set the device model
      this.setModel(models.createDeviceModel(), "device");

      // instantiate message utility class and supply this component as context
      MessageUtil.getInstance(this);

      // instantiate navigation class and supply this component as context
      Navigation.getInstance(this);

      // instantiate empty models and name them
      //they are filled in the helper class
      var oPlantsModel = new JSONModel();
      oPlantsModel.setSizeLimit(2000);
      this.setModel(oPlantsModel, 'plants');
      var oImagesModel = new JSONModel();
      oImagesModel.setSizeLimit(50000);
      this.setModel(oImagesModel, 'images');
      var oUntaggedImagesModel = new JSONModel();
      oUntaggedImagesModel.setSizeLimit(250);
      this.setModel(oUntaggedImagesModel, 'untaggedImages');
      var oTaxonModel = new JSONModel();
      oTaxonModel.setSizeLimit(2000);
      this.setModel(oTaxonModel, 'taxon');
      var oProposalKeywordsModel = new JSONModel();
      oTaxonModel.setSizeLimit(2000);
      this.setModel(oProposalKeywordsModel, 'keywords');

      // empty model for filter values (filled upon opening filter dialog)
      this.setModel(new JSONModel(), 'filterValues');

      // the events model is a special one insofar as we don't load
      // it initially but only in part as we enter a plant's details site
      var oEventsModel = new JSONModel();
      oEventsModel.setProperty('/PlantsEventsDict', {}); // plant ids will be keys of that dict
      this.setModel(oEventsModel, 'events');
      var oPropertiesModel = new JSONModel();
      oPropertiesModel.setProperty('/propertiesPlants', {}); // plant ids will be keys of that dict
      this.setModel(oPropertiesModel, 'properties');
      const oPropertiesTaxonModel = new JSONModel();
      oPropertiesTaxonModel.setProperty('/propertiesTaxon', {}); // taxon_id will be keys of that dict
      this.setModel(oPropertiesTaxonModel, 'propertiesTaxa');

      //use helper class to load data into json models
      //(helper class is used to reload data via button as well)
      var oModelsHelper = ModelsHelper.getInstance(this);
      oModelsHelper.reloadPlantsFromBackend();
      // oModelsHelper.reloadImagesFromBackend();
      oModelsHelper.reloadTaxaFromBackend();
      oModelsHelper.reloadKeywordProposalsFromBackend();
      oModelsHelper.reloadTraitCategoryProposalsFromBackend();
      oModelsHelper.reloadNurserySourceProposalsFromBackend();
      oModelsHelper.reloadPropertyNamesFromBackend();
      // this.oEventsDataClone = {};  // avoid exceptions when saving before any event has been loaded
      // this.oPropertiesDataClone = {};

      // settings model
      var oSettingsModel = new JSONModel({
        preview_image: 'favourite_image'
      });
      this.setModel(oSettingsModel, 'status');

      //initialize router
      this.setModel(new JSONModel()); //contains the layout	
      this.getRouter().initialize();
      this._requestUntaggedImages();
    },
    _requestUntaggedImages: function _requestUntaggedImages() {
      // request data from backend
      $.ajax({
        url: Util.getServiceUrl('images/untagged/'),
        // data: {untagged: true},
        context: this,
        async: true
      })
      // .done(this._onReceivingUntaggedImages.bind(this))
      .done(this._onReceivingUntaggedImages).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Plant Untagged Images (GET)'));
    },
    _onReceivingUntaggedImages: function _onReceivingUntaggedImages(oData, sStatus, oReturnData) {
      this._addPhotosToRegistry(oData.ImagesCollection);
      this.resetUntaggedPhotos();
    },
    _addPhotosToRegistry: function _addPhotosToRegistry(aImages) {
      // add photos loaded for a plant to the registry if not already loaded with other plant
      // plus add a copy of the photo to a clone registry for getting changed photos when saving 
      aImages.forEach(image => {
        if (!(image.filename in this.imagesRegistry)) {
          this.imagesRegistry[image.filename] = image;
          this.imagesRegistryClone[image.filename] = Util.getClonedObject(image);
        }
      });
    },
    resetUntaggedPhotos: function _resetUntaggedPhotos() {
      //(re-)set untagged photos in untagged model
      // @ts-ignore // works, but typescript doesn't like it
      const aPhotoValues = Object.entries(this.imagesRegistry).filter(t => !t[1].plants.length);
      var aPhotos = aPhotoValues.map(p => p[1]);
      this.getModel('untaggedImages').setProperty('/ImagesCollection', aPhotos);
    },
    getHelper: function _getHelper() {
      const oRootControl = this.getRootControl();
      const oFlexibleColumnLayout = oRootControl.byId("idFlexibleColumnLayout");
      const oParams = UriParameters.fromQuery();
      // const oParams = jQuery.sap.getUriParameters();
      const oSettings = {
        defaultTwoColumnLayoutType: LayoutType.TwoColumnsMidExpanded,
        // defaultTwoColumnLayoutType: sap.f.LayoutType.TwoColumnsMidExpanded,
        defaultThreeColumnLayoutType: LayoutType.ThreeColumnsMidExpanded,
        // defaultThreeColumnLayoutType: sap.f.LayoutType.ThreeColumnsMidExpanded,
        mode: oParams.get("mode"),
        initialColumnsCount: oParams.get("initial"),
        maxColumnsCount: oParams.get("max")
      };
      return FlexibleColumnLayoutSemanticHelper.getInstanceFor(oFlexibleColumnLayout, oSettings);
    },
    getModel: function _getModel(sModelName) {
      // override Component's getModel for type hint JSONModel instead of abstract model
      return UIComponent.prototype.getModel.call(this, sModelName);
    }
  });
  return Component;
});
//# sourceMappingURL=Component.js.map