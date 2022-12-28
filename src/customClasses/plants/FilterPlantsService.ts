
import JSONModel from "sap/ui/model/json/JSONModel"
import Filter from "sap/ui/model/Filter"
import FilterOperator from "sap/ui/model/FilterOperator"
import StandardTreeItem from "sap/m/StandardTreeItem"
import ManagedObject from "sap/ui/base/ManagedObject"
import { LTaxonTreeNodeInFilterDialog } from "plants/ui/definitions/SelectionLocal"
import { LFilterHiddenChoice } from "plants/ui/definitions/PlantsLocal"

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class FilterPlantsService extends ManagedObject {
	private _oTaxonTreeModel: JSONModel;

	public constructor(oTaxonTreeModel: JSONModel) {
		super();
		this._oTaxonTreeModel = oTaxonTreeModel;
	}

	public createFilter(aFilterItems: any[], 
		sFilterString: string, 
		aSelectedTreeItems: StandardTreeItem[], 
		aActiveFilters: Filter[],
		eFilterHiddenChoice: LFilterHiddenChoice): Filter[] {

		//get currently active filters on plant/botanical name (set via search function)
		//and add them to the new filter list
		const aRelevantPaths: (string | undefined)[] = ['plant_name', 'botanical_name']
		const aFilters = [];
		for (var i = 0; i < aActiveFilters.length; i++) {
			const oActiveFilter = <Filter>aActiveFilters[i];
			const sPath: string | undefined = oActiveFilter.getPath();
			if (aRelevantPaths.indexOf(sPath) > -1) {
				aFilters.push(aActiveFilters[i]);  //and	
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
		let aTagsInFilter = <string[]>[];
		aFilterItems.forEach(function (oFilterItem: any) {
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
					var bTagInFilter = aTagsPlant.some(function (item: any) {
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
		if (aSelectedTreeItems.length > 0) {
			// we can't use the selectedItems as they only cover the expanded nodes' leaves; we need to use the model
			// to get the selected species (i.e. leaves, level 2)
			var aTaxaTopLevel = this._oTaxonTreeModel.getProperty('/Selection/TaxonTree');
			var aSelected = this._getSelectedItems(aTaxaTopLevel, iDeepestLevel);
			var aSelectedPlantIds = aSelected[1];
			var aSpeciesFilterInner = aSelectedPlantIds.map(ele => new Filter('id', FilterOperator.EQ, ele));
			var oSpeciesFilterOuter = new Filter({
				filters: aSpeciesFilterInner,
				and: false
			});
			aFilters.push(oSpeciesFilterOuter);

		}

		// filter on hidden tag: this is set in the settings dialog's settings tab
		// via segmented button
		// after updating filter bar as this filter is a defaule one
		if (eFilterHiddenChoice !== 'both'){
			const oFilterHiddenPlants = this._getHiddenPlantsFilter(eFilterHiddenChoice);
			aFilters.push(oFilterHiddenPlants);
		}

		return aFilters;
	}

	private _getHiddenPlantsFilter(eFilterHiddenChoice: LFilterHiddenChoice): Filter {
		// triggered by filter/settings dialog confirm handler
		// generates a filter on plant's active property
		switch (eFilterHiddenChoice) {
			case 'only_hidden':
				return new Filter("active", FilterOperator.EQ, false);
			case 'only_active':
				return new Filter("active", FilterOperator.EQ, true);
			default:
				throw new Error('unknown setting for hidden plants filter');
		}
	}	

	private _getSelectedItems(aNodes: LTaxonTreeNodeInFilterDialog[], iDeepestLevel: int): [LTaxonTreeNodeInFilterDialog[], int[]] {
		// find selected nodes on deepest levels and collect their plant ids
		// recursive!
		let aSelected: LTaxonTreeNodeInFilterDialog[] = [];
		let aPlantIds: int[] = [];
		const that = this;
		aNodes.forEach(function (oNode: LTaxonTreeNodeInFilterDialog) {
			if (oNode.level === iDeepestLevel && oNode.selected) {
				aSelected.push(oNode);
				if (oNode.plant_ids)
					aPlantIds = aPlantIds.concat(oNode.plant_ids);
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
	}	

}