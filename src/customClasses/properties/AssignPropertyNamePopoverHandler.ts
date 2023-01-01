import ManagedObject from "sap/ui/base/ManagedObject"

import JSONModel from "sap/ui/model/json/JSONModel";
import { BPropertyName, FBPropertiesInCategory, FBProperty } from "plants/ui/definitions/Properties";
import Popover from "sap/m/Popover";
import Button from "sap/m/Button";
import MessageToast from "sap/m/MessageToast";
import { LPopoverWithPropertiesCategory, LTemporaryAvailableProperties } from "plants/ui/definitions/PropertiesLocal";
import { BPlant } from "plants/ui/definitions/Plants";
import Fragment from "sap/ui/core/Fragment";
import Control from "sap/ui/core/Control";
import View from "sap/ui/core/mvc/View";
import Event from "sap/ui/base/Event";
import PropertyNameCRUD from "./PropertyNameCRUD";
import PropertyValueCRUD from "./PropertyValueCRUD";

/**
 * @namespace plants.ui.customClasses.properties
 */
export default class AssignPropertyNamePopoverHandler extends ManagedObject {
	private _oPlant: BPlant;
	private _oPropertyNameCRUD: PropertyNameCRUD;

	private _oAddPropertyPopover: Popover;

	public constructor(oPlant: BPlant, oPropertyNameCRUD: PropertyNameCRUD) {
		super();
		this._oPlant = oPlant;
		this._oPropertyNameCRUD = oPropertyNameCRUD;
	}

	public openPopupAddProperty(oViewAttachTo: View, oBtnAOpenBy: Button): void {
		if (!this._oPlant.taxon_id) {
			MessageToast.show('Function available after setting botanical name.');
			return;
		}

		const oCategory = <FBPropertiesInCategory>oBtnAOpenBy.getBindingContext('properties')!.getObject();
		// const sBindingPathProperties = oBtnAddProperty.getBindingContext('properties')!.getPath();
		const oModelPropertyNames = <JSONModel>oBtnAOpenBy.getModel('propertyNames');

		Fragment.load({
			name: "plants.ui.view.fragments.properties.AvailableProperties",
			id: oViewAttachTo.getId(),
			controller: this
		}).then((oControl: Control | Control[]) => {
			this._oAddPropertyPopover = <Popover>oControl;
			const oModelTemp = this._getTemporaryAvailablePropertiesModel(oCategory, oModelPropertyNames);
			this._oAddPropertyPopover.setModel(oModelTemp, 'propertiesCompare');
			// we bind the current category to the popover to be able to find it when assigning later (seems to have a bug)
			// oPopover.bindElement({
			// 	path: sBindingPathProperties,
			// 	model: "properties"
			// });
			// as a workaround, we add the category to the popover
			const oPopoverWithPropertiesCategory = <LPopoverWithPropertiesCategory>this._oAddPropertyPopover;  // todo remove this workaround
			oPopoverWithPropertiesCategory.property_category = oCategory;
			oPopoverWithPropertiesCategory.openBy(oBtnAOpenBy, true);
		});

		oBtnAOpenBy.setType('Emphasized');
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

	onAssignPropertyNameToPlantAndOrTaxon(oEvent: Event) {
		// this.propertiesUtil.assignPropertyNameToPlantAndOrTaxon(this.getView(), <Button>oEvent.getSource());

		const oBtn = <Button>oEvent.getSource();
		const oPropertyNamesModel = this._oPropertyNameCRUD.getPropertyNamesModel();  // todo remove
		const oPlantPropertiesModel = this._oPropertyNameCRUD.getPlantPropertiesModel();  // todo remove
		const oTaxonPropertiesModel = this._oPropertyNameCRUD.getTaxonPropertiesModel();  // todo remove
		const oPropertyNameCRUD = new PropertyNameCRUD(oPropertyNamesModel, oPlantPropertiesModel, oTaxonPropertiesModel)

		const aAvailablePropertiesFromDialog = <LTemporaryAvailableProperties[]>(<JSONModel>oBtn.getModel('propertiesCompare')).getData();
		const oPropertiesInCategory = (<LPopoverWithPropertiesCategory>this._oAddPropertyPopover).property_category;  //todo remove
		oPropertyNameCRUD.assignPropertyNameToPlantAndOrTaxon(this._oPlant.taxon_id!, aAvailablePropertiesFromDialog, oPropertiesInCategory);

		this._oAddPropertyPopover.close();
		this._oAddPropertyPopover.destroy();
	}

	onAfterCloseAddPropertyNamePopover(evt: Event) {
		// when closing Add Properties Popover, make sure it is destroyed 
		// and reset the Add-Property Button from Emphasized to Default
		evt.getParameter('openBy').setType('Transparent');
		evt.getSource().destroy();
	}
}