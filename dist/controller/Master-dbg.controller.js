sap.ui.define(["plants/ui/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/FilterType", "sap/ui/model/Sorter", "plants/ui/model/formatter", "sap/m/MessageToast", "plants/ui/customClasses/Util", "plants/ui/customClasses/Navigation", "sap/ui/core/Fragment"], function (__BaseController, JSONModel, Filter, FilterOperator, FilterType, Sorter, __Formatter, MessageToast, Util, __Navigation, Fragment) {
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  const Formatter = _interopRequireDefault(__Formatter);
  const Navigation = _interopRequireDefault(__Navigation);
  /**
   * @namespace plants.ui.controller
   */
  const Master = BaseController.extend("plants.ui.controller.Master", {
    constructor: function constructor() {
      BaseController.prototype.constructor.apply(this, arguments);
      this.formatter = new Formatter();
      this.navigation = Navigation.getInstance();
      this.mIdToFragment = {
        popoverPopupImage: "plants.ui.view.fragments.master.MasterImagePopover",
        settingsDialogFilter: 'plants.ui.view.fragments.master.MasterFilter',
        dialogNewPlant: 'plants.ui.view.fragments.master.MasterNewPlant',
        dialogSort: "plants.ui.view.fragments.master.MasterSort"
      };
    },
    onInit: function _onInit() {
      BaseController.prototype.onInit.call(this);
    },
    onAfterRendering: function _onAfterRendering() {
      // we need to update the plants display counter in table title 
      // (when data was loaded, the view was not existing, yet)
      var oTable = this.byId('plantsTable');
      oTable.attachUpdateFinished(this.updateTableHeaderPlantsCount.bind(this));
    },
    applyToFragment: function _applyToFragment(sId, fn, fnInit) {
      // to enable vs code to connect fragments with a controller, we may not mention
      // the Dialog/Popover ID in the base controller; therefore we have these names
      // hardcoded in each controller 
      BaseController.prototype.applyToFragment.call(this, sId, fn, fnInit, this.mIdToFragment);
    },
    onListItemPress: function _onListItemPress(oEvent) {
      // get selected plant
      var oPlant = oEvent.getSource().getBindingContext("plants").getObject();
      this.navigation.navToPlantDetails(oPlant.id);
    },
    onSearch: function _onSearch(oEvent) {
      // filter logic: active AND (plant_name OR botanical_name)
      // therefore, we are going to nest the filters:
      // AND( filter_active, OR( filter_plant_name, filter_botanical_name))
      var sQuery = oEvent.getParameter("query");

      //check for  filter on active plants
      const oPlantsTableBinding = this.getView().byId("plantsTable").getBinding('items');
      const aActiveFilters = oPlantsTableBinding.getFilters(FilterType.Application);
      // var aActiveFilters = oBinding.aApplicationFilters;

      //modify filters only on fields plant_name and botanical_name
      //leave active state filter (and possible others) as is
      //therefore collect other filters
      var aNewFilters = [];
      const aRelevantPaths = ['plant_name', 'botanical_name', undefined];
      for (var i = 0; i < aActiveFilters.length; i++) {
        const oActiveFilter = aActiveFilters[i];
        const sPath = oActiveFilter.getPath();
        if (!(aRelevantPaths.indexOf(sPath) > -1)) {
          // if (!aRelevantPaths.includes(sPath)) {
          aNewFilters.push(aActiveFilters[i]); //and	
        }
      }

      // create new filters for plant_name and botanical_name (linked with OR)
      var aNestedFilters = [new Filter("plant_name", FilterOperator.Contains, sQuery), new Filter("botanical_name", FilterOperator.Contains, sQuery)];
      var oFilterOr = new Filter({
        filters: aNestedFilters,
        and: false
      });
      aNewFilters.push(oFilterOr);

      //attach both filters (default: AND)
      //update the aggregation binding's filter
      oPlantsTableBinding.filter(aNewFilters, FilterType.Application);

      // update count in table header
      this.updateTableHeaderPlantsCount();
    },
    _getDistinctTagsFromPlants: function _getDistinctTagsFromPlants(aPlants) {
      // collect distinct tags assigned to any plant
      var aTagsAll = [];
      for (var i = 0; i < aPlants.length; i++) {
        var aTagObjects = aPlants[i].tags;
        if (!!aTagObjects.length) {
          // get tag texts from tag object list
          var aTags = aTagObjects.map(function (tag_obj) {
            return tag_obj.text;
          });
          aTagsAll = aTagsAll.concat(aTags);
        }
      }
      return Array.from(new Set(aTagsAll));
    },
    onShowFilterDialog: function _onShowFilterDialog(oEvent) {
      // triggered by show-filters-dialog button; displays filter settings dialog

      // (re-)fill filter values model with distinct values for tags and soil names
      var oModelFilterValues = this.oComponent.getModel('filterValues');

      // soil names
      var oBinding = this.byId('plantsTable').getBinding('items');
      var aSoilNames = oBinding.getDistinctValues('current_soil/soil_name');
      oModelFilterValues.setProperty('/soilNames', aSoilNames);

      // propagation types
      var aPropagationTypes = oBinding.getDistinctValues('propagation_type');
      oModelFilterValues.setProperty('/propagationTypes', aPropagationTypes);

      // nursery/source
      var aNurseriesSources = oBinding.getDistinctValues('nursery_source');
      oModelFilterValues.setProperty('/nurseriesSources', aNurseriesSources);

      // tags is a list for each plant, so we can't use getDistinctValues on the binding here
      var aPlants = this.oComponent.getModel('plants').getData().PlantsCollection;
      var aTags = this._getDistinctTagsFromPlants(aPlants);
      oModelFilterValues.setProperty('/tags', aTags);

      // update taxon tree values from backend
      var sUrl = Util.getServiceUrl('selection_data');
      if (!this.oModelTaxonTree) {
        this.oModelTaxonTree = new JSONModel(sUrl);
      }
      var oView = this.getView();
      const oDialog = this.byId('settingsDialogFilter');
      if (!oDialog) {
        Fragment.load({
          name: 'plants.ui.view.fragments.master.MasterFilter',
          id: oView.getId(),
          controller: this
        }).then(oControl => {
          const oDialog = oControl;
          oView.addDependent(oDialog);
          oDialog.setModel(this.oModelTaxonTree, 'selection');
          oDialog.open();
        });
      } else {
        oDialog.setModel(this.oModelTaxonTree, 'selection');
        oDialog.open();
      }
    },
    _addSelectedFlag: function _addSelectedFlag(aNodes, bSelected) {
      const that = this;
      aNodes.forEach(function (oNode) {
        let oNodeInFilterDialog = oNode;
        oNodeInFilterDialog.selected = bSelected;
        if (!!oNodeInFilterDialog.nodes && oNodeInFilterDialog.nodes.length > 0) {
          that._addSelectedFlag(oNodeInFilterDialog.nodes, bSelected);
        }
      });
    },
    onSelectionChangeTaxonTree: function _onSelectionChangeTaxonTree(oEvent) {
      var aItems = oEvent.getParameter("listItems");
      let that = this;
      aItems.forEach(function (oItem) {
        var oNode = oItem.getBindingContext('selection').getObject();
        var bSelected = oItem.getSelected();
        if (oNode.nodes) {
          that._addSelectedFlag(oNode.nodes, bSelected);
        }
      });
      this.oModelTaxonTree.refresh();
    },
    _getSelectedItems: function _getSelectedItems(aNodes, iDeepestLevel) {
      // find selected nodes on deepest levels and collect their plant ids
      // recursive!
      let aSelected = [];
      let aPlantIds = [];
      const that = this;
      aNodes.forEach(function (oNode) {
        if (oNode.level === iDeepestLevel && oNode.selected) {
          aSelected.push(oNode);
          if (oNode.plant_ids) aPlantIds = aPlantIds.concat(oNode.plant_ids);
        } else if (oNode.nodes && oNode.nodes.length > 0) {
          var aInner = that._getSelectedItems(oNode.nodes, iDeepestLevel);
          if (aInner[0].length > 0) {
            aSelected = aSelected.concat(aInner[0]);
          }
          if (aInner[1].length > 0) {
            aPlantIds = aPlantIds.concat(aInner[1]);
          }
        }
      }, this);
      return [aSelected, aPlantIds];
    },
    onConfirmFilters: function _onConfirmFilters(oEvent) {
      const oTable = this.byId("plantsTable");
      const aFilterItems = oEvent.getParameter("filterItems");
      const sFilterString = oEvent.getParameter("filterString");
      // const mParams = oEvent.getParameters(),
      const oBinding = oTable.getBinding("items");
      const aFilters = [];

      //get currently active filters on plant/botanical name (set via search function)
      //and add them to the new filter list
      const aRelevantPaths = ['plant_name', 'botanical_name'];
      const aActiveFilters = oBinding.getFilters('Application');
      ;
      for (var i = 0; i < aActiveFilters.length; i++) {
        // if (aRelevantPaths.includes(aActiveFilters[i]['sPath'])
        const oActiveFilter = aActiveFilters[i];
        const sPath = oActiveFilter.getPath();
        if (aRelevantPaths.indexOf(sPath) > -1) {
          aFilters.push(aActiveFilters[i]); //and	
        }
      }

      // filters from the settings dialog filter tab:
      // see fragment for the ___ convention to make this as easy as below
      // we have one exceptional case - tags: a plant has 0..n tags and if
      // at least one of them is selected as filter, the plant should be shown
      // the ordinary filter operators do not cover that scenario, so we will
      // generate a custom filter
      // here, we collect the tags for the tags filter and collect the other
      // filters directly
      let aTagsInFilter = [];
      aFilterItems.forEach(function (oFilterItem) {
        var aSplit = oFilterItem.getKey().split("___"),
          sPath = aSplit[0],
          sOperator = aSplit[1],
          sValue1 = aSplit[2],
          sValue2 = aSplit[3];
        switch (sPath) {
          case 'tags/text':
            aTagsInFilter.push(sValue1);
            break;
          default:
            var oFilter = new Filter(sPath, sOperator, sValue1, sValue2);
            aFilters.push(oFilter);
            // make empty string work for undefined, too
            if (sValue1 == '') {
              oFilter = new Filter(sPath, sOperator, undefined, sValue2);
              aFilters.push(oFilter);
            }
            break;
        }
      });

      // generate the tags custom filter
      if (aTagsInFilter.length > 0) {
        var oTagsFilter = new Filter({
          path: 'tags',
          value1: aTagsInFilter,
          comparator(aTagsPlant, aTagsInFilter_) {
            var bTagInFilter = aTagsPlant.some(function (item) {
              return aTagsInFilter_.includes(item.text);
            });
            // Comparator function returns 0, 1 or -1 as the result, which means 
            // equal, larger than or less than; as we're using EQ, we will 
            // return 0 if filter is matched, otherwise something else
            return bTagInFilter ? 0 : -1;
          },
          operator: FilterOperator.EQ
        });
        aFilters.push(oTagsFilter);
      }

      // taxonTree filters
      var iDeepestLevel = 2;
      const aSelectedTreeItems = this.byId('taxonTree').getSelectedItems();
      if (aSelectedTreeItems.length > 0) {
        // we can't use the selectedItems as they only cover the expanded nodes' leaves; we need to use the model
        // to get the selected species (i.e. leaves, level 2)
        var aTaxaTopLevel = this.oModelTaxonTree.getProperty('/Selection/TaxonTree');
        var aSelected = this._getSelectedItems(aTaxaTopLevel, iDeepestLevel);
        var aSelectedPlantIds = aSelected[1];
        var aSpeciesFilterInner = aSelectedPlantIds.map(ele => new Filter('id', FilterOperator.EQ, ele));
        var oSpeciesFilterOuter = new Filter({
          filters: aSpeciesFilterInner,
          and: false
        });
        aFilters.push(oSpeciesFilterOuter);
      }

      // update filter bar
      this.byId("tableFilterBar").setVisible(aFilters.length > 0);
      this.byId("tableFilterLabel").setText(sFilterString);

      // filter on hidden tag: this is set in the settings dialog's settings tab
      // via segmented button
      // after updating filter bar as this filter is a defaule one
      var oFilterHiddenPlants = this._getHiddenPlantsFilter();
      if (oFilterHiddenPlants) {
        aFilters.push(oFilterHiddenPlants);
      }

      // apply filter settings
      oBinding.filter(aFilters);
      this.updateTableHeaderPlantsCount();

      // switch preview image (favourite or latest)
      var sPreview = this.byId('sbtnPreviewImage').getSelectedKey() || 'favourite_image';
      this.oComponent.getModel('status').setProperty('/preview_image', sPreview);
    },
    _getHiddenPlantsFilter: function _getHiddenPlantsFilter() {
      // triggered by filter/settings dialog confirm handler
      // generates a filter on plant's active property
      var sHiddenPlantSettingsSelectedKey = this.byId('sbtnHiddenPlants').getSelectedKey();
      switch (sHiddenPlantSettingsSelectedKey) {
        case 'both':
          return undefined;
        case 'only_hidden':
          return new Filter("active", FilterOperator.EQ, false);
        default:
          // only_active or undefined (settings tab not initialized, set)
          return new Filter("active", FilterOperator.EQ, true);
      }
    },
    onAdd: function _onAdd(oEvent) {
      var oView = this.getView();
      const oDialog = this.byId('dialogNewPlant');
      if (!oDialog) {
        Fragment.load({
          name: this.mIdToFragment["dialogNewPlant"],
          id: oView.getId(),
          controller: this
        }).then(oControl => {
          oControl.open();
        });
      } else {
        oDialog.open();
      }
    },
    onAddSaveButton: function _onAddSaveButton(oEvent) {
      var sPlantName = this.byId("inputCreateNewPlantName").getValue();
      //check and not empty
      if (sPlantName === '') {
        MessageToast.show('Empty not allowed.');
        return;
      }
      if (sPlantName.includes('/')) {
        MessageToast.show('Forward slash not allowed.');
        return;
      }

      //check if new
      if (this.isPlantNameInPlantsModel(sPlantName)) {
        MessageToast.show('Plant Name already exists.');
        return;
      }
      this.saveNewPlant({
        'plant_name': sPlantName,
        'active': true,
        'descendant_plants_all': [],
        //auto-derived in backend
        'sibling_plants': [],
        //auto-derived in backend
        'same_taxon_plants': [],
        //auto-derived in backend
        'tags': []
      });
      this.applyToFragment('dialogNewPlant', oDialog => oDialog.close());
    },
    onShowSortDialog: function _onShowSortDialog(oEvent) {
      this.applyToFragment('dialogSort', oViewSettingsDialog => oViewSettingsDialog.open());
    },
    handleSortDialogConfirm: function _handleSortDialogConfirm(oEvent) {
      const oTable = this.byId("plantsTable");
      const oSortItem = oEvent.getParameter('sortItem');
      const bDescending = oEvent.getParameter('sortDescending');
      const oBinding = oTable.getBinding("items");
      let sPath;
      const aSorters = [];
      sPath = oSortItem.getKey();
      aSorters.push(new Sorter(sPath, bDescending));

      // apply the selected sort and group settings
      oBinding.sort(aSorters);
    },
    onResetFilters: function _onResetFilters(oEvent) {
      var sUrl = Util.getServiceUrl('selection_data');
      this.oModelTaxonTree.loadData(sUrl);
    },
    onHoverImage: function _onHoverImage(oAvatar, evtDelegate) {
      // apply _onHoverImageShow function to popover
      var oBindingContext = oAvatar.getBindingContext('plants');
      var oView = this.getView();
      const oPopover = this.byId('popoverPopupImage');
      if (!oPopover) {
        Fragment.load({
          name: this.mIdToFragment["popoverPopupImage"],
          id: oView.getId(),
          controller: this
        }).then(oControl => {
          const oPopover = oControl;
          oView.addDependent(oPopover);
          oPopover.setBindingContext(oBindingContext, 'plants');
          oPopover.openBy(oAvatar, true);
        });
      } else {
        oPopover.setBindingContext(oBindingContext, 'plants');
        oPopover.openBy(oAvatar, true);
      }
    },
    onClickImagePopupImage: function _onClickImagePopupImage(oEvent) {
      this.applyToFragment('popoverPopupImage', oPopover => {
        if (oPopover.isOpen()) {
          oPopover.close();
        }
      });
    },
    onHoverAwayFromImage: function _onHoverAwayFromImage(oAvatar, evtDelegate) {
      this.applyToFragment('popoverPopupImage', oPopover => {
        if (oPopover.isOpen()) {
          oPopover.close();
        }
      });
    }
  });
  return Master;
});
//# sourceMappingURL=Master.controller.js.map