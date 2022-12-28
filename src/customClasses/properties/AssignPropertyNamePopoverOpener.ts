import ManagedObject from "sap/ui/base/ManagedObject"

import JSONModel from "sap/ui/model/json/JSONModel";
import { BPropertyName, FBPropertiesInCategory, FBProperty } from "plants/ui/definitions/Properties";
import Popover from "sap/m/Popover";
import Button from "sap/m/Button";
import MessageToast from "sap/m/MessageToast";
import { LPopoverWithPropertiesCategory, LTemporaryAvailableProperties } from "plants/ui/definitions/PropertiesLocal";
import { BPlant } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.properties
 */
export default class AssignPropertyNamePopoverOpener extends ManagedObject {

	public constructor() {
		super();
	}

	public openPopupAddPropertyWhenPromiseResolved(oPromise: Promise<Popover>, oCurrentPlant: BPlant, oBtnAddProperty: Button): void {
		if (!oCurrentPlant.taxon_id) {
			MessageToast.show('Function available after setting botanical name.');
			return;
		}

		const oCategory = <FBPropertiesInCategory>oBtnAddProperty.getBindingContext('properties')!.getObject();
		// const sBindingPathProperties = oBtnAddProperty.getBindingContext('properties')!.getPath();
		const oModelPropertyNames = <JSONModel>oBtnAddProperty.getModel('propertyNames');

		oPromise.then((oPopover: Popover) => {
			const oModelTemp = this._getTemporaryAvailablePropertiesModel(oCategory, oModelPropertyNames);
			oPopover.setModel(oModelTemp, 'propertiesCompare');
			// we bind the current category to the popover to be able to find it when assigning later (seems to have a bug)
			// oPopover.bindElement({
			// 	path: sBindingPathProperties,
			// 	model: "properties"
			// });
			// as a workaround, we add the category to the popover
			const oPopoverWithPropertiesCategory = <LPopoverWithPropertiesCategory>oPopover;
			oPopoverWithPropertiesCategory.property_category = oCategory;
			oPopoverWithPropertiesCategory.openBy(oBtnAddProperty, true);
		});

		oBtnAddProperty.setType('Emphasized');
	}
	private _getTemporaryAvailablePropertiesModel(oCategory: FBPropertiesInCategory, oModelPropertyNames: JSONModel): JSONModel {
		var sPathPropertiesAvailable = '/propertiesAvailablePerCategory/' + oCategory.category_name;
		var aPropertiesAvailable: BPropertyName[] = oModelPropertyNames.getProperty(sPathPropertiesAvailable);

		// check which properties are already used for this plant
		var aCompared: LTemporaryAvailableProperties[] = this._comparePropertiesLists(aPropertiesAvailable, oCategory.properties);
		return new JSONModel(aCompared);
	}

	private _comparePropertiesLists(aPropertiesAvailable: BPropertyName[], aPropertiesUsed: FBProperty[]): LTemporaryAvailableProperties[] {

		var aList: LTemporaryAvailableProperties[] = [];
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
			}
			else {
				selected_plant = false;
				blocked_plant = false;
			}

			if (found && found.property_values.find(ele => ele.type === 'taxon')) {
				selected_taxon = true;
				blocked_taxon = true;
			}
			else {
				selected_taxon = false;
				blocked_taxon = false;
			}
			var oItem: LTemporaryAvailableProperties = {
				property_name: sName,
				property_name_id: entry.property_name_id!,
				selected_plant: selected_plant,
				selected_taxon: selected_taxon,
				blocked_plant: blocked_plant,
				blocked_taxon: blocked_taxon
			}
			aList.push(oItem);
		});
		return aList;
	}
}