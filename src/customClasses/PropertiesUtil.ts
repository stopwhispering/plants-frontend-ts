import * as Util from "plants/ui/customClasses/Util";
import MessageToast from "sap/m/MessageToast"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import MessageHandler from "plants/ui/customClasses/MessageHandler"
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import Context from "sap/ui/model/Context";
import {
	FBPropertiesInCategory, FBProperty,
	BPropertyName, FBPropertyValue, BResultsPropertiesForPlant
} from "../definitions/Properties";
import {
	LCategoryToPropertiesInCategoryMap, LPlantPropertiesRequest, LTaxonToPropertyCategoryMap, LTemporaryAvailableProperties
} from "../definitions/PropertiesLocal";
import View from "sap/ui/core/mvc/View";
import Button from "sap/m/Button";
import Popover from "sap/m/Popover";
import Component from "../Component";
import Input from "sap/m/Input";
import CheckBox from "sap/m/CheckBox";
import Dialog from "sap/m/Dialog";
import { BPlant } from "../definitions/Plants";
import { ResponseStatus } from "../definitions/SharedLocal";
import { LPropertiesTaxonModelData } from "../definitions/PropertiesLocal";

/**
 * @namespace plants.ui.customClasses
 */
export default class PropertiesUtil extends ManagedObject {
	private _btnAdd: Button;
	private _btnNew: Button;


	private static _instance: PropertiesUtil;
	private applyToFragment: Function;

	public static getInstance(applyToFragment?: Function): PropertiesUtil {
		if (!PropertiesUtil._instance && applyToFragment) {
			PropertiesUtil._instance = new PropertiesUtil(applyToFragment);
		}
		return PropertiesUtil._instance;
	}

	private constructor(applyToFragment: Function) {
		super();
		this.applyToFragment = applyToFragment;
	}

	public editPropertyValueDelete(oPropertiesModel: JSONModel, oPropertiesTaxaModel: JSONModel, oPropertiesBindingContext: Context, oCurrentPlant: BPlant) {
		// delete a property value, either for current plant or it's taxon
		var sPathPropertyValue = oPropertiesBindingContext.getPath();
		var oPropertyValue = <FBPropertyValue>oPropertiesBindingContext.getObject();

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
			var aPropertyNames = <FBProperty[]>oPropertiesTaxaModel.getProperty(sPath);
			var foundPropertyName = aPropertyNames.find(ele => ele['property_name_id'] == iPropertyNameId);
			var foundPropertyValue = foundPropertyName!.property_values.find(ele => ele['type'] == 'taxon');

			// delete
			var iIndexTaxonPropertyValue = foundPropertyName!.property_values.indexOf(foundPropertyValue!);
			foundPropertyName!.property_values.splice(iIndexTaxonPropertyValue, 1);

			// finally delete the property name node if there's no property value left (currently always the case)
			if (foundPropertyName!.property_values.length === 0) {
				var iIndexPropertyName = aPropertyNames.indexOf(foundPropertyName!);
				aPropertyNames.splice(iIndexPropertyName, 1);
			}
		}

		//delete from (plants) properties model
		sPathPropertyValues = sPathPropertyValue.substr(0, sPathPropertyValue.lastIndexOf('/'));
		var aPathPropertyValues = oPropertiesModel.getProperty(sPathPropertyValues);
		var iIndex = aPathPropertyValues.indexOf(oPropertyValue);
		aPathPropertyValues.splice(iIndex, 1);

		oPropertiesModel.refresh();
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

	openDialogNewProperty(oPlant: BPlant, oSource: Button) {
		if (!oPlant.taxon_id) {
			MessageToast.show('Function available after setting botanical name.');
			return;
		}

		// bind current category in properties model to fragment
		var sBindingPathProperties = oSource.getBindingContext('properties')!.getPath();

		this.applyToFragment('dialogNewPropertyName', (oPopover: Popover) => {
			oPopover.bindElement({
				path: sBindingPathProperties,
				model: "properties"
			});
			oPopover.openBy(oSource, true);
		});

		this._btnNew = oSource;
		this._btnNew.setType('Emphasized');
	}

	public createNewPropertyName(oSource: Input | Button, oView: View) {
		var sPropertyName = (<Input>oView.byId('inpPropertyName')).getValue();
		if (!sPropertyName) {
			MessageToast.show('Enter Property Name.');
			return;
		}
		//check if already exists in property names model
		const oCategory = <FBPropertiesInCategory>oSource.getBindingContext('properties')!.getObject();
		var sCategoryName = oCategory.category_name;
		var oModelPropertyNames = oSource.getModel('propertyNames');
		var aPropertyNames = <BPropertyName[]>oModelPropertyNames.getProperty('/propertiesAvailablePerCategory/' + sCategoryName);
		var foundPropertyName = <BPropertyName>aPropertyNames.find(ele => ele['property_name'] == sPropertyName);
		if (foundPropertyName) {
			MessageToast.show('Property Name already exists.');
			return;
		}

		// add to property names model
		aPropertyNames.push(<BPropertyName>{
			// property_name_id: undefined
			countPlants: 0,
			property_name: sPropertyName,
		});


		var bAddToPlant = (<CheckBox>oView.byId("chkNewPropertyNameAddToPlant")).getSelected();
		var bAddToTaxon = (<CheckBox>oView.byId("chkNewPropertyNameAddToTaxon")).getSelected();

		// add empty property value item for plant if selected
		if (bAddToPlant) {
			const oPropertyValue = <FBPropertyValue>{
				type: 'plant',
				// property_value_id: undefined,
				property_value: ''
			}
			const oProperty = <FBProperty>{
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
			const oPropertyValue = <FBPropertyValue>{
				type: 'taxon',
				// property_value_id: undefined,
				property_value: ''
			}

			var oProperty = <FBProperty>{
				// property_name_id: undefined,
				property_name: sPropertyName,
				property_values: [oPropertyValue]
				// property_value: undefined
				// property_value_id: undefined
			};
			oCategory.properties.push(oProperty);

			//properties taxon model
			var oEntry = <LTemporaryAvailableProperties>{
				property_name: sPropertyName,
				property_name_id: undefined
			};
			var oPlant = <BPlant>oSource.getBindingContext('plants')!.getObject();
			const oPropertiesTaxaModel = <JSONModel>oView.getModel('propertiesTaxa');
			const oEmptyPropertyValue = <FBPropertyValue>{
				type: 'taxon',
				property_value: '',
			}
			this._insertPropertyIntoPropertiesTaxaModel(oEmptyPropertyValue, oCategory.category_id, oPlant.taxon_id!, oEntry, oPropertiesTaxaModel);
		}

		oView.getModel('properties').refresh();
		(<Dialog>oView.byId('dialogNewPropertyName')).close();
		// this._oNewPropertyNameFragment.close();
		this._btnNew.setType('Transparent');
	}

	public closeNewPropertyNameDialog() {
		this._btnNew.setType('Transparent');
	}

	public openDialogAddProperty(oView: View, oCurrentPlant: BPlant, oBtnAddProperty: Button): void {
		// if (!oView.getBindingContext('plants')!.getObject().taxon_id) {
		if (!oCurrentPlant.taxon_id) {
			MessageToast.show('Function available after setting botanical name.');
			return;
		}

		// var oCategoryControl = evt.getSource();  // for closure
		var oCategory: FBPropertiesInCategory = <FBPropertiesInCategory>oBtnAddProperty.getBindingContext('properties')!.getObject();
		// var oModelProperties = evt.getSource().getModel('properties');
		// var oModelPropertyNames = evt.getSource().getModel('propertyNames');
		var sBindingPathProperties = oBtnAddProperty.getBindingContext('properties')!.getPath();

		if (oView.byId('dialogAddProperties')) {
			oView.byId('dialogAddProperties').destroy();
		}

		const oModelPropertyNames = <JSONModel>oBtnAddProperty.getModel('propertyNames');
		this.applyToFragment('dialogAddProperties', (oPopover: Popover) => {
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
	}

	public addProperty(oView: View, oSource: Button) {
		// add selected properties to the plant's properties
		// var aModelProperties = this.getView().getModel('properties');
		var aPropertiesFromDialog = <LTemporaryAvailableProperties[]>(<JSONModel>oSource.getModel('propertiesCompare')).getData();
		// var iCountBefore = evt.getSource().getBindingContext('properties').getObject().properties.length;
		const oPropertiesInCategory = <FBPropertiesInCategory>oSource.getBindingContext('properties')!.getObject();
		var aProperties = <FBProperty[]>oPropertiesInCategory.properties;
		var iCategoryId = oPropertiesInCategory.category_id;
		var iTaxonId = (<BPlant>oSource.getBindingContext('plants')!.getObject()).taxon_id;
		// aPropertiesFromDialog.forEach(function(entry) {
		for (var i = 0; i < aPropertiesFromDialog.length; i++) {
			var entry = <LTemporaryAvailableProperties>aPropertiesFromDialog[i];
			if ((entry.selected_plant && !entry.blocked_plant) || (entry.selected_taxon && !entry.blocked_taxon)) {
				// find out if we already have that proprety name node for taxon or if we need to create it
				var found = aProperties.find(ele => ele.property_name_id == entry.property_name_id);
				if (found) {
					// insert plant value for plant and/or taxon into existing propery values list of the property name node
					if (entry.selected_plant && !entry.blocked_plant) {
						found.property_values.push(<FBPropertyValue>{
							'type': 'plant',
							'property_value': ''
						});  // property_value_id: undefined
					}
					if (entry.selected_taxon && !entry.blocked_taxon) {
						var oItem = <FBPropertyValue>{
							type: 'taxon',
							property_value: ''
						};  // property_value_id: undefined
						found.property_values.push(oItem);
						const oPropertiesTaxaModel = <JSONModel>oView.getModel('propertiesTaxa');
						this._insertPropertyIntoPropertiesTaxaModel(oItem, iCategoryId, iTaxonId!, entry, oPropertiesTaxaModel);
					}
				}
				else {
					// creat property name node and insert property value for plant and/or taxon
					var aPropertyValues = <FBPropertyValue[]>[];
					if (entry.selected_plant && !entry.blocked_plant) {
						aPropertyValues.push(<FBPropertyValue>{
							type: 'plant',
							property_value: ''
						});  //, 'property_value_id': undefined 
					}
					if (entry.selected_taxon && !entry.blocked_taxon) {
						var oItem_ = <FBPropertyValue>{
							type: 'taxon',
							property_value: ''
						};  //, 'property_value_id': undefined 
						aPropertyValues.push(oItem_);
						const oPropertiesTaxaModel = <JSONModel>oView.getModel('propertiesTaxa');
						this._insertPropertyIntoPropertiesTaxaModel(oItem_, iCategoryId, iTaxonId!, entry, oPropertiesTaxaModel);
					}
					oPropertiesInCategory.properties.push(<FBProperty>
						{
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
		const oPopover = <Popover>oView.byId('dialogAddProperties');
		oPopover.close();
		oPopover.destroy();
	}

	private _insertPropertyIntoPropertiesTaxaModel(oPropertyValue: FBPropertyValue, iCategoryId: int, iTaxonId: int, oEntry: LTemporaryAvailableProperties, oPropertiesTaxaModel: JSONModel) {
		// add a property value to taxon properties model
		const oPropertiesTaxaData = <LPropertiesTaxonModelData>oPropertiesTaxaModel.getData();
		const oTaxonToPropertyCategoryMap = <LTaxonToPropertyCategoryMap>oPropertiesTaxaData.propertiesTaxon;  // // maps from taxon_id to it's property categories
		const oCategoriesForCurrentTaxon = <LCategoryToPropertiesInCategoryMap>oTaxonToPropertyCategoryMap[iTaxonId];  //current taxon's property categories
		const oPropertiesInSelectedCategory = <FBPropertiesInCategory>oCategoriesForCurrentTaxon[iCategoryId];
		console.log("Inserting into category: " + oPropertiesInSelectedCategory.category_name);
		
		const aCurrentPropertyNames = <FBProperty[]>oPropertiesInSelectedCategory.properties;
		console.log("Current property names: " + aCurrentPropertyNames);

		// create property name node if not exists (if we have two new property names, we need to go by name not (undefined) id)
		if (oEntry.property_name_id) {
			var found = <FBProperty|undefined>aCurrentPropertyNames.find(ele => ele.property_name_id == oEntry.property_name_id);
		} else {
			found = aCurrentPropertyNames.find(ele => ele.property_name == oEntry.property_name);
		}
		if (!found) {
			aCurrentPropertyNames.push(<FBProperty>
				{
					'property_name': oEntry.property_name,
					'property_name_id': oEntry.property_name_id,
					'property_values': [oPropertyValue]
				});
		} else {
			// otherwise just insert the property value
			found.property_values.push(oPropertyValue);
		}
	}

	private _taxon_properties_already_loaded(oOwnerComponent: Component, taxon_id: int) {
		if (oOwnerComponent.getModel('propertiesTaxa').getProperty('/propertiesTaxon/' + taxon_id))
			return true;
		else
			return false;
	}

	loadPropertiesForCurrentPlant(oPlant: BPlant, oOwnerComponent: Component) {
		// request data from backend
		// data is added to local properties model and bound to current view upon receivement
		var sPlantId = encodeURIComponent(oPlant.id!);
		var uri = 'plant_properties/' + sPlantId;

		// if plant's taxon's properties have not been already loaded, load them as well
		if (oPlant.taxon_id && !this._taxon_properties_already_loaded(oOwnerComponent, oPlant.taxon_id))
			var oPayload = <LPlantPropertiesRequest>{ taxon_id: oPlant.taxon_id };
		else
			oPayload = {};

		$.ajax({
			url: Util.getServiceUrl(uri),
			data: oPayload,
			context: this,
			async: true
		})
			.done(this._onReceivingPropertiesForPlant.bind(this, oPlant, oOwnerComponent))
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Property (GET)'));
	}

	private _onReceivingPropertiesForPlant(oPlant: BPlant, oOwnerComponent: Component, oData: BResultsPropertiesForPlant, sStatus: ResponseStatus, oResponse: JQueryXHR) {
		//insert (overwrite!) properties data for current plant with data received from backend
		var oPropertiesModel = oOwnerComponent.getModel('properties');
		oPropertiesModel.setProperty('/propertiesPlants/' + oPlant.id + '/', oData.propertyCollections);

		//for tracking changes, save a clone
		if (!oOwnerComponent.oPropertiesDataClone) {
			oOwnerComponent.oPropertiesDataClone = {};
		}
		oOwnerComponent.oPropertiesDataClone[oPlant.id!] = Util.getClonedObject(oData.propertyCollections);

		// update taxon properties model
		if (Object.keys(oData.propertyCollectionsTaxon.categories).length > 0) {
			oOwnerComponent.getModel('propertiesTaxa').setProperty('/propertiesTaxon/' + oPlant.taxon_id + '/', oData.propertyCollectionsTaxon.categories);
			if (!oOwnerComponent.oPropertiesTaxonDataClone) {
				oOwnerComponent.oPropertiesTaxonDataClone = {};
			}
			oOwnerComponent.oPropertiesTaxonDataClone[oPlant.taxon_id!] = Util.getClonedObject(oData.propertyCollectionsTaxon.categories);
		}

		// ... and redundantly insert the taxon data into the plant's properties array (only for display)
		this._appendTaxonPropertiesToPlantProperties(oOwnerComponent, oPlant);

		MessageHandler.getInstance().addMessageFromBackend(oData.message);

		// somehow UI5 requires a forced refresh here in case of no plant properties data but appended taxon properties to the plant properties; maybe a bug
		oPropertiesModel.refresh(true);
	}

	private _appendTaxonPropertiesToPlantProperties(oOwnerComponent: Component, oPlant: BPlant) {
		// called after loading plant properties or instead of loading plant properties if these have been loaded already
		if (!oPlant.taxon_id) {
			return;
		}

		var oModelPropertiesTaxon = oOwnerComponent.getModel('propertiesTaxa');
		var oModelPropertiesPlant = oOwnerComponent.getModel('properties');
		var oCategoriesTaxon: LCategoryToPropertiesInCategoryMap = oModelPropertiesTaxon.getProperty('/propertiesTaxon/' + oPlant.taxon_id + '/');
		var aCategoriesPlant: FBPropertiesInCategory[] = oModelPropertiesPlant.getProperty('/propertiesPlants/' + oPlant.id + '/categories/');
		const aCategoryIds: int[] = Object.keys(oCategoriesTaxon).map(sCategoryId => parseInt(sCategoryId));
		for (var i = 0; i < Object.keys(oCategoriesTaxon).length; i++) {
			var oCategory: FBPropertiesInCategory = oCategoriesTaxon[aCategoryIds[i]];
			var category_id = oCategory.category_id;
			var plant_category = aCategoriesPlant.find(ele => ele.category_id == category_id);

			for (var j = 0; j < oCategory.properties.length; j++) {
				var property_name = oCategory.properties[j];
				var plant_property_name = plant_category!.properties.find(ele => ele.property_name_id == property_name.property_name_id);
				if (plant_property_name) {
					plant_property_name.property_values.push(...property_name.property_values);
				} else {
					plant_category!.properties.push(property_name);
				}
			}
		}
	}
}