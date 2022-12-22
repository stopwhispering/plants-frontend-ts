sap.ui.define(["sap/ui/model/json/JSONModel", "plants/ui/customClasses/MessageUtil", "plants/ui/customClasses/Util", "sap/m/MessageToast", "sap/ui/base/ManagedObject", "plants/ui/model/formatter", "sap/ui/core/library"], function (JSONModel, __MessageUtil, Util, MessageToast, ManagedObject, __formatter, sap_ui_core_library) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const MessageUtil = _interopRequireDefault(__MessageUtil);
  const formatter = _interopRequireDefault(__formatter);
  const MessageType = sap_ui_core_library["MessageType"];
  /**
   * @namespace plants.ui.model
   */
  const ModelsHelper = ManagedObject.extend("plants.ui.model.ModelsHelper", {
    constructor: function _constructor(component) {
      ManagedObject.prototype.constructor.call(this);
      this.formatter = new formatter();
      this._component = component;
      //we need to add the event handlers to the jsonmodel here as this is executed only
      //once; if we attach them before calling, they're adding up to one more each time
      this._component.getModel('plants').attachRequestCompleted(this._onReceivingPlantsFromBackend.bind(this));
      this._component.getModel('plants').attachRequestFailed(this.onReceiveErrorGeneric.bind(this, 'Plants Model'));
      this._component.getModel('taxon').attachRequestCompleted(this._onReceivingTaxaFromBackend.bind(this));
      this._component.getModel('taxon').attachRequestFailed(this.onReceiveErrorGeneric.bind(this, 'Taxon Model'));
    },
    onReceiveErrorGeneric: function _onReceiveErrorGeneric(sCaller, error, result, statusText) {
      //trying to catch all kinds of error callback returns
      //always declare similar to: .fail(this.ModelsHelper.getInstance()._onReceiveErrorGeneric.bind(thisOrOtherContext,'EventsResource'));
      Util.stopBusyDialog();

      //fastapi manually thrown exceptions (default)
      if (!!error && !!error.responseJSON && !!error.responseJSON.detail && !!error.responseJSON.detail.type) {
        MessageUtil.getInstance().addMessageFromBackend(error.responseJSON.detail);
        MessageToast.show(error.responseJSON.detail.type + ': ' + error.responseJSON.detail.message);
        return;
      }
      ;

      //server not reachable
      const oErrorEvent = error;
      if (!!oErrorEvent.getParameter && oErrorEvent.getParameter('message')) {
        const sMsg = 'Error at ' + sCaller + ' - Could not reach Server (Error: ' + error.status + ' ' + error.statusText + ')';
        MessageUtil.getInstance().addMessage(MessageType.Error, sMsg);
        MessageToast.show(sMsg);
        return;
      }
      ;

      //fastapi unexpected error (e.g. pydantic validation error)
      if (!!error && !error.responseJSON) {
        const sMsg = 'Error at ' + sCaller + ' - Unexpected Backend Error (Error: ' + error.status + ' ' + error.statusText + ')';
        MessageUtil.getInstance().addMessage(MessageType.Error, sMsg);
        MessageToast.show(sMsg);
        return;
      }
      MessageToast.show('Unknown Error. See onReceiveErrorGeneric and handle.');

      // // general http error handler			
      // //tested for ..
      // if (error && error.hasOwnProperty('responseJSON') && typeof (error.responseJSON) === 'string') {
      // 	var sMsg = 'Error: ' + error.status + ' ' + error.responseJSON;
      // }

      // //     - reloadImagesFromBackend (ajax; manually raised)
      // else if (error && error.hasOwnProperty('responseJSON') && error.responseJSON && 'error' in error.responseJSON) {
      // 	sMsg = 'Error: ' + error.status + ' ' + error.responseJSON['error'];

      // 	//     - reloadPlantsFromBackend(jsonmodel; manually raised)
      // } else if (error && error.getParameter && (!!error.getParameter('responseText')) && typeof (JSON.parse(error.getParameter('responseText'))) === 'object') {
      // 	var oParams = error.getParameters();
      // 	sMsg = 'Error: ' + oParams.statusCode + ' ' + JSON.parse(oParams.responseText).error;

      // 	// fallback solution for ajax calls (e.g. server stopped working) 
      // } else if (!!error.status && !!error.statusText) {
      // 	sMsg = 'Error at: ' + sCaller + ' - Status: ' + error.status + ' ' + error.statusText;

      // 	// fallback solution for jsonmodel calls (e.g. server stopped working) 
      // } else {
      // 	sMsg = 'Error at: ' + sCaller;
      // }

      // MessageToast.show(sMsg);
      // MessageUtil.getInstance().addMessage(MessageType.Error, sMsg, undefined, undefined);
    },
    _onReceivingPlantsFromBackend: function _onReceivingPlantsFromBackend(oRequestInfo) {
      // create new clone objects to track changes
      const oPlantsModel = oRequestInfo.getSource();
      this._component.oPlantsDataClone = Util.getClonedObject(oPlantsModel.getData());

      //create message
      var sresource = Util.parse_resource_from_url(oRequestInfo.getParameter('url'));
      MessageUtil.getInstance().addMessage(MessageType.Information, 'Loaded Plants from backend', undefined, 'Resource: ' + sresource);
    },
    _onReceivingTaxaFromBackend: function _onReceivingTaxaFromBackend(oRequestInfo) {
      // create new clone objects to track changes
      const oTaxonModel = oRequestInfo.getSource();
      this._component.oTaxonDataClone = Util.getClonedObject(oTaxonModel.getData());

      //create message
      var sresource = Util.parse_resource_from_url(oRequestInfo.getParameter('url'));
      MessageUtil.getInstance().addMessage(MessageType.Information, 'Loaded Taxa from backend', undefined, 'Resource: ' + sresource);
    },
    reloadPlantsFromBackend: function _reloadPlantsFromBackend() {
      var sUrl = Util.getServiceUrl('plants/');
      this._component.getModel('plants').loadData(sUrl);
      Util.stopBusyDialog(); // todo: should be stopped only when everything has been reloaded, not only plants
    },
    resetImagesRegistry: function _resetImagesRegistry() {
      this._component.imagesRegistry = {};
      this._component.imagesRegistryClone = {};
      this._component.imagesPlantsLoaded = new Set();
      this._component.getModel('images').updateBindings(false);
      this._component.getModel('untaggedImages').updateBindings(false);
    },
    addToImagesRegistry: function _addToImagesRegistry(aImages) {
      // after uploading new images, add them to the  registry
      aImages.forEach(oImage => {
        var sKey = oImage['filename'];
        if (!(sKey in this._component.imagesRegistry)) {
          this._component.imagesRegistry[sKey] = oImage;
        }
        this._component.imagesRegistryClone[sKey] = Util.getClonedObject(oImage);
      });
    },
    reloadTaxaFromBackend: function _reloadTaxaFromBackend() {
      //reload taxon data
      var sUrl = Util.getServiceUrl('taxa/');
      this._component.getModel('taxon').loadData(sUrl);
    },
    reloadKeywordProposalsFromBackend: function _reloadKeywordProposalsFromBackend() {
      // get keywords collection from backend proposals resource
      var sUrl = Util.getServiceUrl('proposals/KeywordProposals');
      if (!this._component.getModel('keywords')) {
        this._component.setModel(new JSONModel(sUrl), 'keywords');
      } else {
        this._component.getModel('keywords').loadData(sUrl);
      }
    },
    reloadNurserySourceProposalsFromBackend: function _reloadNurserySourceProposalsFromBackend() {
      var sUrl = Util.getServiceUrl('proposals/NurserySourceProposals');
      if (!this._component.getModel('nurseries_sources')) {
        var oModel = new JSONModel(sUrl);
        oModel.setSizeLimit(50);
        this._component.setModel(oModel, 'nurseries_sources');
      } else {
        this._component.getModel('nurseries_sources').loadData(sUrl);
      }
    },
    reloadPropertyNamesFromBackend: function _reloadPropertyNamesFromBackend() {
      // get property names with their categories from backend
      var sUrl = Util.getServiceUrl('property_names/');
      if (!this._component.getModel('propertyNames')) {
        var oModel = new JSONModel(sUrl);
        oModel.setSizeLimit(300);
        this._component.setModel(oModel, 'propertyNames');
      } else {
        this._component.getModel('propertyNames').loadData(sUrl);
      }
    }
  });
  ModelsHelper.getInstance = function getInstance(component) {
    if (!ModelsHelper._instance && !!component) {
      ModelsHelper._instance = new ModelsHelper(component);
    }
    return ModelsHelper._instance;
  };
  return ModelsHelper;
});
//# sourceMappingURL=ModelsHelper.js.map