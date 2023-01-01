import ManagedObject from "sap/ui/base/ManagedObject"
import Popover from "sap/m/Popover";
import Button from "sap/m/Button";
import MessageToast from "sap/m/MessageToast";
import { BPlant } from "plants/ui/definitions/Plants";
import { LNewPropertyNameInputData, LPopoverWithPropertiesCategory } from "plants/ui/definitions/PropertiesLocal";
import { FBPropertiesInCategory } from "plants/ui/definitions/Properties";
import Fragment from "sap/ui/core/Fragment";
import Control from "sap/ui/core/Control";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import Event from "sap/ui/base/Event";
import PropertyNameCRUD from "./PropertyNameCRUD";
/**
 * @namespace plants.ui.customClasses.properties
 */
export default class NewPropertyNamePopoverHandler extends ManagedObject {
	
	private _oPlant: BPlant;
	private _oPropertyNameCRUD: PropertyNameCRUD;
	
	private _oNewPropertyNamePopover: LPopoverWithPropertiesCategory;  // "dialogNewPropertyName"

	public constructor(oPropertyNameCRUD: PropertyNameCRUD, oPlant: BPlant) {
		super();
		this._oPlant = oPlant;
		this._oPropertyNameCRUD = oPropertyNameCRUD;
	}

	public openPopupNewProperty(oPlant: BPlant, oBtnOpenBy: Button, oViewAttachTo: View): void {
		if (!oPlant.taxon_id) {
			MessageToast.show('Function available after setting botanical name.');
			return;
		}

		// bind current category in properties model to fragment  (seems to have a bug)
		var oCategory = <FBPropertiesInCategory>oBtnOpenBy.getBindingContext('properties')!.getObject();

		<Promise<Popover>>Fragment.load({
			name: "plants.ui.view.fragments.properties.NewPropertyName",
			id: oViewAttachTo.getId(),
			controller: this
		}).then((oControl: Control|Control[]) => {
			this._oNewPropertyNamePopover = <LPopoverWithPropertiesCategory>oControl;  // todo remove this workaround once not used anymore

			const oNewPropertyNameInputData: LNewPropertyNameInputData = {
				propertyName: undefined,
				propertyCategory: oCategory,
				addToPlant: true,
				addToTaxon: false
			}
			const oNewPropertyNameInputModel = new JSONModel(oNewPropertyNameInputData);
			this._oNewPropertyNamePopover.setModel(oNewPropertyNameInputModel, 'newPropertyNameInput');

			// as a workaround, we add the category to the popover
			// this._oNewPropertyNamePopover.property_category = oCategory;
			this._oNewPropertyNamePopover.openBy(oBtnOpenBy, true);
		});

		oBtnOpenBy.setType('Emphasized');
	}

	onAfterCloseNewPropertyNamePopover(evt: Event) {
		// when closing New Property Name Popover, make sure it is destroyed and reset the New-Property Button from Emphasized to Default
		evt.getParameter('openBy').setType('Transparent');
		this._oNewPropertyNamePopover.getModel('newPropertyNameInput').destroy();
		evt.getSource().destroy();
	}

	onNewPropertyNameCreate(oEvent: Event) {
		// var osourcecontrol = <Input | Button>oEvent.getSource();
		// const oCategory = this._oNewPropertyNamePopover.property_category;
		
		const oNewPropertyNameInputModel = <JSONModel>this._oNewPropertyNamePopover.getModel('newPropertyNameInput');
		const oNewPropertyNameInputData = <LNewPropertyNameInputData>oNewPropertyNameInputModel.getData();

		const sPropertyName = oNewPropertyNameInputData.propertyName;
		const oCategory = oNewPropertyNameInputData.propertyCategory;
		const bAddToPlant = oNewPropertyNameInputData.addToPlant;
		const bAddToTaxon = oNewPropertyNameInputData.addToTaxon;

		if (!sPropertyName) {
			MessageToast.show('Property name is empty.');
			return;
		}

		// const sPropertyName = (<Input>this.byId('inpPropertyName')).getValue();  //todo bind to model
		// const bAddToPlant = (<CheckBox>this.byId("chkNewPropertyNameAddToPlant")).getSelected();
		// const bAddToTaxon = (<CheckBox>this.byId("chkNewPropertyNameAddToTaxon")).getSelected();
		
		this._oPropertyNameCRUD.createNewPropertyName(sPropertyName, oCategory, this._oPlant, bAddToPlant, bAddToTaxon);
		this._oNewPropertyNamePopover.close();
	}

}