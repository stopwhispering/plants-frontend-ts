sap.ui.define(["plants/ui/customClasses/Util", "sap/m/MessageToast", "plants/ui/model/ModelsHelper", "plants/ui/customClasses/MessageUtil", "sap/ui/model/json/JSONModel", "sap/ui/base/ManagedObject"], function (Util, MessageToast, __ModelsHelper, __MessageUtil, JSONModel, ManagedObject) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const ModelsHelper = _interopRequireDefault(__ModelsHelper);
  const MessageUtil = _interopRequireDefault(__MessageUtil);
  /**
   * @namespace plants.ui.customClasses
   */
  const PropertiesUtil = ManagedObject.extend("plants.ui.customClasses.PropertiesUtil", {
    constructor: function _constructor(applyToFragment) {
      ManagedObject.prototype.constructor.call(this);
      this.applyToFragment = applyToFragment;
    },
    editPropertyValueDelete: function _editPropertyValueDelete(oPropertiesModel, oPropertiesTaxaModel, oPropertiesBindingContext, oCurrentPlant) {
      // delete a property value, either for current plant or it's taxon
      var sPathPropertyValue = oPropertiesBindingContext.getPath();
      var oPropertyValue = oPropertiesBindingContext.getObject();

      // if it's a taxon's property value, we need to remove it from the original taxon properties model as well
      if (oPropertyValue.type === 'taxon') {
        // get property name id
        var sPathPropertyValues = sPathPropertyValue.substr(0, sPathPropertyValue.lastIndexOf('/'));
        var sPathPropertyName = sPathPropertyValues.substr(0, sPathPropertyValues.lastIndexOf('/'));
        var iPropertyNameId = oPropertiesModel.getProperty(sPathPropertyName).property_name_id;

        // get category id
        var sPath_1 = sPathPropertyName.substr(0, sPathPropertyName.lastIndexOf('/'));
        var sPathCategory = sPath_1.substr(0, sPath_1.lastIndexOf('/'));
        var iCategoryId = oPropertiesModel.getProperty(sPathCategory).category_id;

        // var iTaxonId = evt.getSource().getBindingContext('plants').getObject().taxon_id;
        var iTaxonId = oCurrentPlant.taxon_id;

        // now we can find the respective node in the taxon properties model
        // find path in taxon properties model
        var sPath = '/propertiesTaxon/' + iTaxonId + '/' + iCategoryId + '/properties';
        var aPropertyNames = oPropertiesTaxaModel.getProperty(sPath);
        var foundPropertyName = aPropertyNames.find(ele => ele['property_name_id'] == iPropertyNameId);
        var foundPropertyValue = foundPropertyName.property_values.find(ele => ele['type'] == 'taxon');

        // delete
        var iIndexTaxonPropertyValue = foundPropertyName.property_values.indexOf(foundPropertyValue);
        foundPropertyName.property_values.splice(iIndexTaxonPropertyValue, 1);

        // finally delete the property name node if there's no property value left (currently always the case)
        if (foundPropertyName.property_values.length === 0) {
          var iIndexPropertyName = aPropertyNames.indexOf(foundPropertyName);
          aPropertyNames.splice(iIndexPropertyName, 1);
        }
      }

      //delete from (plants) properties model
      sPathPropertyValues = sPathPropertyValue.substr(0, sPathPropertyValue.lastIndexOf('/'));
      var aPathPropertyValues = oPropertiesModel.getProperty(sPathPropertyValues);
      var iIndex = aPathPropertyValues.indexOf(oPropertyValue);
      aPathPropertyValues.splice(iIndex, 1);
      oPropertiesModel.refresh();
    },
    _getTemporaryAvailablePropertiesModel: function _getTemporaryAvailablePropertiesModel(oCategory, oModelPropertyNames) {
      var sPathPropertiesAvailable = '/propertiesAvailablePerCategory/' + oCategory.category_name;
      var aPropertiesAvailable = oModelPropertyNames.getProperty(sPathPropertiesAvailable);

      // check which properties are already used for this plant
      var aCompared = this._comparePropertiesLists(aPropertiesAvailable, oCategory.properties);
      return new JSONModel(aCompared);
    },
    _comparePropertiesLists: function _comparePropertiesLists(aPropertiesAvailable, aPropertiesUsed) {
      var aList = [];
      if (aPropertiesAvailable === undefined) {
        aPropertiesAvailable = [];
      }
      aPropertiesAvailable.forEach(function (entry) {
        var sName = entry.property_name;
        var found = aPropertiesUsed.find(element => element.property_name === sName);

        // set whether plant and/or taxon property value is already used (thus blocked)
        let selected_plant, selected_taxon, blocked_plant, blocked_taxon;
        if (found && found.property_values.find(ele => ele.type === 'plant')) {
          selected_plant = true;
          blocked_plant = true;
        } else {
          selected_plant = false;
          blocked_plant = false;
        }
        if (found && found.property_values.find(ele => ele.type === 'taxon')) {
          selected_taxon = true;
          blocked_taxon = true;
        } else {
          selected_taxon = false;
          blocked_taxon = false;
        }
        var oItem = {
          property_name: sName,
          property_name_id: entry.property_name_id,
          selected_plant: selected_plant,
          selected_taxon: selected_taxon,
          blocked_plant: blocked_plant,
          blocked_taxon: blocked_taxon
        };
        aList.push(oItem);
      });
      return aList;
    },
    openDialogNewProperty: function _openDialogNewProperty(oPlant, oSource) {
      if (!oPlant.taxon_id) {
        MessageToast.show('Function available after setting botanical name.');
        return;
      }

      // bind current category in properties model to fragment
      var sBindingPathProperties = oSource.getBindingContext('properties').getPath();
      this.applyToFragment('dialogNewPropertyName', oPopover => {
        oPopover.bindElement({
          path: sBindingPathProperties,
          model: "properties"
        });
        oPopover.openBy(oSource, true);
      });
      this._btnNew = oSource;
      this._btnNew.setType('Emphasized');
    },
    createNewPropertyName: function _createNewPropertyName(oSource, oView) {
      var sPropertyName = oView.byId('inpPropertyName').getValue();
      if (!sPropertyName) {
        MessageToast.show('Enter Property Name.');
        return;
      }
      //check if already exists in property names model
      const oCategory = oSource.getBindingContext('properties').getObject();
      var sCategoryName = oCategory.category_name;
      var oModelPropertyNames = oSource.getModel('propertyNames');
      var aPropertyNames = oModelPropertyNames.getProperty('/propertiesAvailablePerCategory/' + sCategoryName);
      var foundPropertyName = aPropertyNames.find(ele => ele['property_name'] == sPropertyName);
      if (foundPropertyName) {
        MessageToast.show('Property Name already exists.');
        return;
      }

      // add to property names model
      aPropertyNames.push({
        // property_name_id: undefined
        countPlants: 0,
        property_name: sPropertyName
      });
      var bAddToPlant = oView.byId("chkNewPropertyNameAddToPlant").getSelected();
      var bAddToTaxon = oView.byId("chkNewPropertyNameAddToTaxon").getSelected();

      // add empty property value item for plant if selected
      if (bAddToPlant) {
        const oPropertyValue = {
          type: 'plant',
          // property_value_id: undefined,
          property_value: ''
        };
        const oProperty = {
          // property_name_id: undefined,
          property_name: sPropertyName,
          property_values: [oPropertyValue]
          // property_value: undefined
          // property_value_id: undefined
        };

        oCategory.properties.push(oProperty);
      }

      // add empty property value item for taxon if selected
      if (bAddToTaxon) {
        // will be inserted into both models to keep the same/updated!
        const oPropertyValue = {
          type: 'taxon',
          // property_value_id: undefined,
          property_value: ''
        };
        var oProperty = {
          // property_name_id: undefined,
          property_name: sPropertyName,
          property_values: [oPropertyValue]
          // property_value: undefined
          // property_value_id: undefined
        };

        oCategory.properties.push(oProperty);

        //properties taxon model
        var oEntry = {
          property_name: sPropertyName,
          property_name_id: undefined
        };
        var oPlant = oSource.getBindingContext('plants').getObject();
        const oPropertiesTaxaModel = oView.getModel('propertiesTaxa');
        const oEmptyPropertyValue = {
          type: 'taxon',
          property_value: ''
        };
        this._insertPropertyIntoPropertiesTaxaModel(oEmptyPropertyValue, oCategory.category_id, oPlant.taxon_id, oEntry, oPropertiesTaxaModel);
      }
      oView.getModel('properties').refresh();
      oView.byId('dialogNewPropertyName').close();
      // this._oNewPropertyNameFragment.close();
      this._btnNew.setType('Transparent');
    },
    closeNewPropertyNameDialog: function _closeNewPropertyNameDialog() {
      this._btnNew.setType('Transparent');
    },
    openDialogAddProperty: function _openDialogAddProperty(oView, oCurrentPlant, oBtnAddProperty) {
      // if (!oView.getBindingContext('plants')!.getObject().taxon_id) {
      if (!oCurrentPlant.taxon_id) {
        MessageToast.show('Function available after setting botanical name.');
        return;
      }

      // var oCategoryControl = evt.getSource();  // for closure
      var oCategory = oBtnAddProperty.getBindingContext('properties').getObject();
      // var oModelProperties = evt.getSource().getModel('properties');
      // var oModelPropertyNames = evt.getSource().getModel('propertyNames');
      var sBindingPathProperties = oBtnAddProperty.getBindingContext('properties').getPath();
      if (oView.byId('dialogAddProperties')) {
        oView.byId('dialogAddProperties').destroy();
      }
      const oModelPropertyNames = oBtnAddProperty.getModel('propertyNames');
      this.applyToFragment('dialogAddProperties', oPopover => {
        var oModelTemp = this._getTemporaryAvailablePropertiesModel(oCategory, oModelPropertyNames);
        oPopover.setModel(oModelTemp, 'propertiesCompare');
        oPopover.bindElement({
          path: sBindingPathProperties,
          model: "properties"
        });
        oPopover.openBy(oBtnAddProperty, true);
      });
      oBtnAddProperty.setType('Emphasized');

      //remember category's button to later retype it
      this._btnAdd = oBtnAddProperty;
    },
    addProperty: function _addProperty(oView, oSource) {
      // add selected properties to the plant's properties
      // var aModelProperties = this.getView().getModel('properties');
      var aPropertiesFromDialog = oSource.getModel('propertiesCompare').getData();
      // var iCountBefore = evt.getSource().getBindingContext('properties').getObject().properties.length;
      const oPropertiesInCategory = oSource.getBindingContext('properties').getObject();
      var aProperties = oPropertiesInCategory.properties;
      var iCategoryId = oPropertiesInCategory.category_id;
      var iTaxonId = oSource.getBindingContext('plants').getObject().taxon_id;
      // aPropertiesFromDialog.forEach(function(entry) {
      for (var i = 0; i < aPropertiesFromDialog.length; i++) {
        var entry = aPropertiesFromDialog[i];
        if (entry.selected_plant && !entry.blocked_plant || entry.selected_taxon && !entry.blocked_taxon) {
          // find out if we already have that proprety name node for taxon or if we need to create it
          var found = aProperties.find(ele => ele.property_name_id == entry.property_name_id);
          if (found) {
            // insert plant value for plant and/or taxon into existing propery values list of the property name node
            if (entry.selected_plant && !entry.blocked_plant) {
              found.property_values.push({
                'type': 'plant',
                'property_value': ''
              }); // property_value_id: undefined
            }

            if (entry.selected_taxon && !entry.blocked_taxon) {
              var oItem = {
                type: 'taxon',
                property_value: ''
              }; // property_value_id: undefined
              found.property_values.push(oItem);
              const oPropertiesTaxaModel = oView.getModel('propertiesTaxa');
              this._insertPropertyIntoPropertiesTaxaModel(oItem, iCategoryId, iTaxonId, entry, oPropertiesTaxaModel);
            }
          } else {
            // creat property name node and insert property value for plant and/or taxon
            var aPropertyValues = [];
            if (entry.selected_plant && !entry.blocked_plant) {
              aPropertyValues.push({
                type: 'plant',
                property_value: ''
              }); //, 'property_value_id': undefined 
            }

            if (entry.selected_taxon && !entry.blocked_taxon) {
              var oItem_ = {
                type: 'taxon',
                property_value: ''
              }; //, 'property_value_id': undefined 
              aPropertyValues.push(oItem_);
              const oPropertiesTaxaModel = oView.getModel('propertiesTaxa');
              this._insertPropertyIntoPropertiesTaxaModel(oItem_, iCategoryId, iTaxonId, entry, oPropertiesTaxaModel);
            }
            oPropertiesInCategory.properties.push({
              'property_name': entry.property_name,
              'property_name_id': entry.property_name_id,
              'property_values': aPropertyValues
            });
          }
        }
      }
      // if (evt.getSource().getBindingContext('properties').getObject().properties.length !== iCountBefore){
      oView.getModel('properties').refresh();
      this._btnAdd.setType('Transparent');
      const oPopover = oView.byId('dialogAddProperties');
      oPopover.close();
      oPopover.destroy();
    },
    _insertPropertyIntoPropertiesTaxaModel: function _insertPropertyIntoPropertiesTaxaModel(oPropertyValue, iCategoryId, iTaxonId, entry, oPropertiesTaxaModel) {
      // add a property value to taxon properties model
      var aCurrentPropertyNames = oPropertiesTaxaModel.getData().propertiesTaxon[iTaxonId][iCategoryId].properties;

      // create property name node if not exists (if we have two new property names, we need to go by name not (undefined) id)
      if (entry.property_name_id) {
        var found = aCurrentPropertyNames.find(ele => ele.property_name_id == entry.property_name_id);
      } else {
        found = aCurrentPropertyNames.find(ele => ele.property_name == entry.property_name);
      }
      if (!found) {
        aCurrentPropertyNames.push({
          'property_name': entry.property_name,
          'property_name_id': entry.property_name_id,
          'property_values': [oPropertyValue]
        });
      } else {
        // otherwise just insert the property value
        found.property_values.push(oPropertyValue);
      }
    },
    _taxon_properties_already_loaded: function _taxon_properties_already_loaded(oOwnerComponent, taxon_id) {
      if (oOwnerComponent.getModel('propertiesTaxa').getProperty('/propertiesTaxon/' + taxon_id)) return true;else return false;
    },
    loadPropertiesForCurrentPlant: function _loadPropertiesForCurrentPlant(oPlant, oOwnerComponent) {
      // request data from backend
      // data is added to local properties model and bound to current view upon receivement
      var sPlantId = encodeURIComponent(oPlant.id);
      var uri = 'plant_properties/' + sPlantId;

      // if plant's taxon's properties have not been already loaded, load them as well
      if (oPlant.taxon_id && !this._taxon_properties_already_loaded(oOwnerComponent, oPlant.taxon_id)) var oPayload = {
        taxon_id: oPlant.taxon_id
      };else oPayload = {};
      $.ajax({
        url: Util.getServiceUrl(uri),
        data: oPayload,
        context: this,
        async: true
      }).done(this._onReceivingPropertiesForPlant.bind(this, oPlant, oOwnerComponent)).fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Property (GET)'));
    },
    _onReceivingPropertiesForPlant: function _onReceivingPropertiesForPlant(oPlant, oOwnerComponent, oData, sStatus, oResponse) {
      //insert (overwrite!) properties data for current plant with data received from backend
      var oPropertiesModel = oOwnerComponent.getModel('properties');
      oPropertiesModel.setProperty('/propertiesPlants/' + oPlant.id + '/', oData.propertyCollections);

      //for tracking changes, save a clone
      if (!oOwnerComponent.oPropertiesDataClone) {
        oOwnerComponent.oPropertiesDataClone = {};
      }
      oOwnerComponent.oPropertiesDataClone[oPlant.id] = Util.getClonedObject(oData.propertyCollections);

      // update taxon properties model
      if (Object.keys(oData.propertyCollectionsTaxon.categories).length > 0) {
        oOwnerComponent.getModel('propertiesTaxa').setProperty('/propertiesTaxon/' + oPlant.taxon_id + '/', oData.propertyCollectionsTaxon.categories);
        if (!oOwnerComponent.oPropertiesTaxonDataClone) {
          oOwnerComponent.oPropertiesTaxonDataClone = {};
        }
        oOwnerComponent.oPropertiesTaxonDataClone[oPlant.taxon_id] = Util.getClonedObject(oData.propertyCollectionsTaxon.categories);
      }

      // ... and redundantly insert the taxon data into the plant's properties array (only for display)
      this._appendTaxonPropertiesToPlantProperties(oOwnerComponent, oPlant);
      MessageUtil.getInstance().addMessageFromBackend(oData.message);

      // somehow UI5 requires a forced refresh here in case of no plant properties data but appended taxon properties to the plant properties; maybe a bug
      oPropertiesModel.refresh(true);
    },
    _appendTaxonPropertiesToPlantProperties: function _appendTaxonPropertiesToPlantProperties(oOwnerComponent, oPlant) {
      // called after loading plant properties or instead of loading plant properties if these have been loaded already
      if (!oPlant.taxon_id) {
        return;
      }
      var oModelPropertiesTaxon = oOwnerComponent.getModel('propertiesTaxa');
      var oModelPropertiesPlant = oOwnerComponent.getModel('properties');
      var oCategoriesTaxon = oModelPropertiesTaxon.getProperty('/propertiesTaxon/' + oPlant.taxon_id + '/');
      var aCategoriesPlant = oModelPropertiesPlant.getProperty('/propertiesPlants/' + oPlant.id + '/categories/');
      const aCategoryIds = Object.keys(oCategoriesTaxon).map(sCategoryId => parseInt(sCategoryId));
      for (var i = 0; i < Object.keys(oCategoriesTaxon).length; i++) {
        var oCategory = oCategoriesTaxon[aCategoryIds[i]];
        var category_id = oCategory.category_id;
        var plant_category = aCategoriesPlant.find(ele => ele.category_id == category_id);
        for (var j = 0; j < oCategory.properties.length; j++) {
          var property_name = oCategory.properties[j];
          var plant_property_name = plant_category.properties.find(ele => ele.property_name_id == property_name.property_name_id);
          if (plant_property_name) {
            plant_property_name.property_values.push(...property_name.property_values);
          } else {
            plant_category.properties.push(property_name);
          }
        }
      }
    }
  });
  PropertiesUtil.getInstance = function getInstance(applyToFragment) {
    if (!PropertiesUtil._instance && applyToFragment) {
      PropertiesUtil._instance = new PropertiesUtil(applyToFragment);
    }
    return PropertiesUtil._instance;
  };
  return PropertiesUtil;
});
//# sourceMappingURL=PropertiesUtil.js.map