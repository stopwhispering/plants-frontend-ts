import ManagedObject from "sap/ui/base/ManagedObject"
import Popover from "sap/m/Popover";
import Button from "sap/m/Button";
import MessageToast from "sap/m/MessageToast";
import { BPlant } from "plants/ui/definitions/Plants";
import { LPopoverWithPropertiesCategory } from "plants/ui/definitions/PropertiesLocal";
import { FBPropertiesInCategory } from "plants/ui/definitions/Properties";

/**
 * @namespace plants.ui.customClasses.properties
 */
export default class NewPropertyNamePopoverOpener extends ManagedObject {

	public constructor() {
		super();
	}

	public openPopupNewPropertyWhenPromiseResolved(oPromise: Promise<Popover>, oPlant: BPlant, oBtnNewProperty: Button): void {
		if (!oPlant.taxon_id) {
			MessageToast.show('Function available after setting botanical name.');
			return;
		}

		// bind current category in properties model to fragment  (seems to have a bug)
		// var sBindingPathProperties = oBtnNewProperty.getBindingContext('properties')!.getPath();
		var oCategory = <FBPropertiesInCategory>oBtnNewProperty.getBindingContext('properties')!.getObject();

		oPromise.then((oPopover: Popover) => {
			// oPopover.bindElement({
			// 	path: sBindingPathProperties,
			// 	model: "properties"
			// });
			// as a workaround, we add the category to the popover
			const oPopoverWithPropertiesCategory = <LPopoverWithPropertiesCategory>oPopover;
			oPopoverWithPropertiesCategory.property_category = oCategory;
			oPopoverWithPropertiesCategory.openBy(oBtnNewProperty, true);
		});

		oBtnNewProperty.setType('Emphasized');
	}

}