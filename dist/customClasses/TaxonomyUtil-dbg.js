sap.ui.define(["sap/m/MessageToast", "plants/ui/customClasses/Util", "plants/ui/customClasses/MessageUtil", "plants/ui/model/ModelsHelper", "sap/ui/base/ManagedObject"], function (MessageToast, Util, __MessageUtil, __ModelsHelper, ManagedObject) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const MessageUtil = _interopRequireDefault(__MessageUtil);
  const ModelsHelper = _interopRequireDefault(__ModelsHelper);
  /**
   * @namespace plants.ui.customClasses
   */
  const TaxonomyUtil = ManagedObject.extend("plants.ui.customClasses.TaxonomyUtil", {
    findSpecies: function _findSpecies(sSpecies, bIncludeKew, bSearchForGenus, oModelKewSearchResults) {
      if (sSpecies.length === 0) {
        MessageToast.show('Enter species first.');
        return;
      }
      Util.startBusyDialog('Retrieving results from species search...');
      var dPayload = {
        // 'args': {
        'species': sSpecies,
        'includeKew': bIncludeKew,
        'searchForGenus': bSearchForGenus
        // }
      };

      $.ajax({
        url: Util.getServiceUrl('search_external_biodiversity'),
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify(dPayload),
        context: this
        // async: true
      }).done(this._onReceivingSpeciesDatabase.bind(this, oModelKewSearchResults)).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'search_external_biodiversity (POST)'));
    },
    _onReceivingSpeciesDatabase: function _onReceivingSpeciesDatabase(oModelKewSearchResults, data, sStatus, oResponse) {
      Util.stopBusyDialog();
      oModelKewSearchResults.setData(data);
      MessageUtil.getInstance().addMessageFromBackend(data.message);
    },
    chooseSpecies: function _chooseSpecies(oSelectedItem, sCustomName, oDialog, oPlant, oDetailController, oView) {
      if (!oSelectedItem) {
        MessageToast.show('Select item from results list first.');
        return;
      }
      const oSelectedRowData = oSelectedItem.getBindingContext('kewSearchResults').getObject();
      const fqId = oSelectedRowData.fqId;

      // optionally, use has set a custom additional name. send full name then.
      if (sCustomName.startsWith('Error')) {
        var nameInclAddition = '';
      } else if (sCustomName === oSelectedRowData.name.trim()) {
        nameInclAddition = '';
      } else {
        nameInclAddition = sCustomName;
      }
      var dPayload = {
        'fqId': fqId,
        'hasCustomName': nameInclAddition.length === 0 ? false : true,
        'nameInclAddition': nameInclAddition,
        'source': oSelectedRowData.source,
        // in py interface, null is resolved to empty str in py, undefined is resolved to None
        'id': oSelectedRowData.id ? oSelectedRowData.id : undefined,
        'plant_id': oPlant.id
      };
      Util.startBusyDialog('Retrieving additional species information and saving them to Plants database...');
      const sServiceUrl = Util.getServiceUrl('download_taxon_details');
      $.ajax({
        url: sServiceUrl,
        context: this,
        contentType: "application/json",
        type: 'POST',
        data: JSON.stringify(dPayload)
      }).done(this._onReceivingAdditionalSpeciesInformationSaved.bind(this, oDialog, oPlant, oDetailController, oView)).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'download_taxon_details (POST)'));
    },
    _onReceivingAdditionalSpeciesInformationSaved: function _onReceivingAdditionalSpeciesInformationSaved(oDialog, oPlant, oDetailController, oView, data, sStatus, oResponse) {
      //taxon was saved in database and the taxon id is returned here
      //we assign that taxon id to the plant; this is persisted only upon saving
      //the whole new taxon dictionary is added to the taxon model and it's clone
      Util.stopBusyDialog();
      MessageToast.show(data.message.message);
      MessageUtil.getInstance().addMessageFromBackend(data.message);
      oDialog.close();
      const oPlantsModel = oView.getModel('plants');
      const oModelTaxon = oView.getModel('taxon');
      oPlant.botanical_name = data.botanical_name;
      oPlant.taxon_id = data.taxon_data.id;
      oPlantsModel.updateBindings(false);

      // add taxon to model if new 
      var sPathTaxon = '/TaxaDict/' + data.taxon_data.id;
      if (oModelTaxon.getProperty(sPathTaxon) === undefined) {
        oModelTaxon.setProperty(sPathTaxon, data.taxon_data);
      }

      //add taxon to model's clone if new
      var oTaxonDataClone = oDetailController.getOwnerComponent().oTaxonDataClone;
      if (oTaxonDataClone.TaxaDict[data.taxon_data.id] === undefined) {
        oTaxonDataClone.TaxaDict[data.taxon_data.id] = Util.getClonedObject(data.taxon_data);
      }

      // bind received taxon to view (otherwise applied upon switching plant in detail view)
      oView.bindElement({
        path: "/TaxaDict/" + data.taxon_data.id,
        model: "taxon"
      });
    },
    findSpeciesTableSelectedOrDataUpdated: function _findSpeciesTableSelectedOrDataUpdated(oText, oInputAdditionalName, oSelectedItem) {
      if (oSelectedItem === undefined || oSelectedItem === null) {
        oText.setText('');
        oInputAdditionalName.setEditable(false);
        oInputAdditionalName.setValue('');
        return;
      }
      var oSelectedRowData = oSelectedItem.getBindingContext('kewSearchResults').getObject();

      //reset additional name
      var sNewValueAdditionalName;
      if (oSelectedRowData.is_custom) {
        // if selected botanical name is a custom one, adding a(nother) suffix is forbidden
        oInputAdditionalName.setValue('');
        oInputAdditionalName.setEditable(false);
        sNewValueAdditionalName = '';
      } else if (oSelectedRowData.species === null || oSelectedRowData.species === undefined) {
        // if a genus is selected, not a (sub)species, we add a 'spec.' as a default
        oInputAdditionalName.setValue('spec.');
        sNewValueAdditionalName = 'spec.';
        oInputAdditionalName.setEditable(true);
      } else {
        //default case: selected a species with an official taxon name
        if (sNewValueAdditionalName === 'spec.') {
          oInputAdditionalName.setValue('');
          sNewValueAdditionalName = '';
        } else {
          sNewValueAdditionalName = oInputAdditionalName.getValue();
        }
        oInputAdditionalName.setEditable(true);
      }
      oText.setText(oSelectedRowData.name + ' ' + sNewValueAdditionalName);
    },
    findSpeciesAdditionalNameLiveChange: function _findSpeciesAdditionalNameLiveChange(oView) {
      const oSelectedItem = oView.byId('tableFindSpeciesResults').getSelectedItem();
      const oSelectedRowData = oSelectedItem.getBindingContext('kewSearchResults').getObject();
      const oText = oView.byId('textFindSpeciesAdditionalName');
      const sNewValueAdditionalName = oView.byId('inputFindSpeciesAdditionalName').getValue();
      if (!oSelectedItem) {
        oText.setText('Error: Select item from table first.');
        return;
      }
      oText.setText(oSelectedRowData.name + ' ' + sNewValueAdditionalName);
    },
    findSpeciesBeforeOpen: function _findSpeciesBeforeOpen(oView) {
      //default plant search name is the current one (if available)
      if (oView.getBindingContext('taxon') === undefined || oView.getBindingContext('taxon').getObject() === undefined) {
        var sCurrentBotanicalName = '';
      } else {
        sCurrentBotanicalName = oView.getBindingContext('taxon').getObject().name;
      }
      oView.byId('inputFindSpecies').setValue(sCurrentBotanicalName);

      // clear additional name
      oView.byId('inputFindSpeciesAdditionalName').setValue('');
    },
    refetchGbifImages: function _refetchGbifImages(gbif_id, oTaxonModel, oCurrentPlant) {
      Util.startBusyDialog('Refetching Taxon Images from GBIF for GBIF ID ...' + gbif_id);
      var dPayload = {
        'gbif_id': gbif_id
      };
      $.ajax({
        url: Util.getServiceUrl('fetch_taxon_images'),
        type: 'POST',
        contentType: "application/json",
        data: JSON.stringify(dPayload),
        context: this
        // async: true
      }).done(this._onReceivingRefetchdeGbifImages.bind(this, oTaxonModel, oCurrentPlant)).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'search_external_bifetch_taxon_imagesodiversity (POST)'));
    },
    _onReceivingRefetchdeGbifImages: function _onReceivingRefetchdeGbifImages(oTaxonModel, oCurrentPlant, data, sStatus, oResponse) {
      // display newly fetched taxon images from gbif occurrences
      // (no need for caring about the serialized clone model as occurrences are read-only)
      Util.stopBusyDialog();
      var current_taxon = oTaxonModel.getProperty("/TaxaDict/" + oCurrentPlant.taxon_id);
      current_taxon.occurrenceImages = data.occurrenceImages;
      oTaxonModel.updateBindings(false);
      MessageUtil.getInstance().addMessageFromBackend(data.message);
    }
  });
  TaxonomyUtil.getInstance = function getInstance() {
    if (!TaxonomyUtil._instance) {
      TaxonomyUtil._instance = new TaxonomyUtil();
    }
    return TaxonomyUtil._instance;
  };
  return TaxonomyUtil;
});
//# sourceMappingURL=TaxonomyUtil.js.map