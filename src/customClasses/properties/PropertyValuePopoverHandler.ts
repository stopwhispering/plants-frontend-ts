import Popover from "sap/m/Popover";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import Event from "sap/ui/base/Event";
import PropertyValueCRUD from "./PropertyValueCRUD";
import Context from "sap/ui/model/Context";
import Button from "sap/m/Button";
import { BPlant } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.properties
 */
export default class PropertyValuePopoverHandler extends ManagedObject {

    private _oPropertyValuePopover: Popover;
    private _oPropertyValueCRUD: PropertyValueCRUD;
    private _oPlant: BPlant;

    public constructor(oPropertyValueCRUD: PropertyValueCRUD, oPlant: BPlant) {
        super();
        this._oPropertyValueCRUD = oPropertyValueCRUD;
        this._oPlant = oPlant;
    }

	public openPropertyValuePopover(oViewAttachTo: View, oOpenBy: Control, sPathPropertyValue: string): void {
		// open popover to edit or delete property value
		Fragment.load({
			name: "plants.ui.view.fragments.properties.EditPropertyValue",
			id: oViewAttachTo.getId(),
			controller: this
		}).then((oControl: Control | Control[]) => {
			this._oPropertyValuePopover = <Popover>oControl;

            this._oPropertyValuePopover.bindElement({
				path: sPathPropertyValue,
				model: "properties"
			});

			this._oPropertyValuePopover.openBy(oOpenBy, true);
		});

	}

	onDeletePropertyValue(oEvent: Event) {
		const oPropertiesBindingContext = <Context>(<Button>oEvent.getSource()).getBindingContext('properties');
		this._oPropertyValueCRUD.editPropertyValueDelete(oPropertiesBindingContext, this._oPlant);
	}

	onClosePropertyValuePopover(evt: Event) {
		this._oPropertyValuePopover.close();
	}

	public onAfterClosePropertyValuePopover(evt: Event): void {
		// destroy popover after closing
		evt.getSource().destroy();
	}    

}

