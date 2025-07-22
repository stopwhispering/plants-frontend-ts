import ManagedObject from "sap/ui/base/ManagedObject"
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import FilterType from "sap/ui/model/FilterType";
import ListBinding from "sap/ui/model/ListBinding";

/**
 * @namespace plants.ui.customClasses.filter
 */
export default class PlantSearcher extends ManagedObject {
	private _oPlantsTableBinding: ListBinding;

	public constructor(oPlantsTableBinding: ListBinding) {
		super();
		this._oPlantsTableBinding = oPlantsTableBinding;
	}

	search(sQuery: string) {
		// filter logic: active AND (plant_name OR botanical_name)
		// therefore, we are going to nest the filters:
		// AND( filter_active, OR( filter_plant_name, filter_botanical_name))

		//check for  filter on active plants
		const aActiveFilters = <Filter[]>this._oPlantsTableBinding.getFilters(FilterType.Application);

		//modify filters only on fields plant_name and botanical_name
		//leave active state filter (and possible others) as is
		//therefore collect other filters
		var aNewFilters = [];
		const aRelevantPaths: (string | undefined)[] = ['plant_name', 'botanical_name', 'alternative_botanical_name', undefined]
		for (var i = 0; i < aActiveFilters.length; i++) {
			const oActiveFilter = <Filter>aActiveFilters[i];
			const sPath: string | undefined = oActiveFilter.getPath();
			if (!(aRelevantPaths.indexOf(sPath) > -1)) {
				aNewFilters.push(aActiveFilters[i]);  //and	
			}
		}

		// create new filters for plant_name and botanical_name (linked with OR)
		var aNestedFilters = [
			new Filter("plant_name", FilterOperator.Contains, sQuery),
			new Filter("botanical_name", FilterOperator.Contains, sQuery),
			new Filter("alternative_botanical_name", FilterOperator.Contains, sQuery)
		];
		var oFilterOr = new Filter({
			filters: aNestedFilters,
			and: false
		});
		aNewFilters.push(oFilterOr);

		//attach both filters (default: AND)
		//update the aggregation binding's filter
		this._oPlantsTableBinding.filter(aNewFilters, FilterType.Application);
	}	
}