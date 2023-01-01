import MessageToast from "sap/m/MessageToast"
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import {
	FBPropertiesInCategory, FBProperty,
	BPropertyName, FBPropertyValue
} from "plants/ui/definitions/Properties";
import {
	LCategoryToPropertiesInCategoryMap, LTaxonToPropertyCategoryMap, LTemporaryAvailableProperties
} from "plants/ui/definitions/PropertiesLocal";
import { BPlant } from "plants/ui/definitions/Plants";
import { LPropertiesTaxonModelData } from "plants/ui/definitions/PropertiesLocal";

/**
 * @namespace plants.ui.customClasses.properties
 */
export default class PropertyNameCRUD extends ManagedObject {

	private _oPropertyNamesModel: JSONModel;
	private _oPlantPropertiesModel: JSONModel;
	private _oTaxonPropertiesModel: JSONModel;

	public constructor(oPropertyNamesModel: JSONModel, oPlantPropertiesModel: JSONModel, oTaxonPropertiesModel: JSONModel) {
		super();
		this._oPropertyNamesModel = oPropertyNamesModel;
		this._oPlantPropertiesModel = oPlantPropertiesModel;
		this._oTaxonPropertiesModel = oTaxonPropertiesModel;
	}

	public getPlantPropertiesModel(): JSONModel {
		// todo remove this
		return this._oPlantPropertiesModel;
	}

	public getTaxonPropertiesModel(): JSONModel {
		// todo remove this
		return this._oTaxonPropertiesModel;
	}

	public getPropertyNamesModel(): JSONModel {
		// todo remove this
		return this._oPropertyNamesModel;
	}

	public createNewPropertyName(sPropertyName: string, oCategory:FBPropertiesInCategory, oPlant: BPlant, bAddToPlant: boolean, bAddToTaxon: boolean): void {
		if (!sPropertyName) {
			MessageToast.show('Enter Property Name.');
			return;
		}
		//check if already exists in property names model
		var sCategoryName = oCategory.category_name;
		var aPropertyNames = <BPropertyName[]>this._oPropertyNamesModel.getProperty('/propertiesAvailablePerCategory/' + sCategoryName);
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
			// const oPropertiesTaxaModel = <JSONModel>oView.getModel('propertiesTaxa');
			const oEmptyPropertyValue = <FBPropertyValue>{
				type: 'taxon',
				property_value: '',
			}
			this._insertPropertyIntoPropertiesTaxaModel(oEmptyPropertyValue, oCategory.category_id, oPlant.taxon_id!, oEntry);
		}

		this._oPlantPropertiesModel.refresh();
	}

	public assignPropertyNameToPlantAndOrTaxon(iTaxonId: int, aAvailablePropertiesFromDialog: LTemporaryAvailableProperties[], oPropertiesInCategory: FBPropertiesInCategory): void {
		// add selected properties to the plant's properties
		var aProperties = <FBProperty[]>oPropertiesInCategory.properties;
		var iCategoryId = oPropertiesInCategory.category_id;
		for (var i = 0; i < aAvailablePropertiesFromDialog.length; i++) {
			var entry = <LTemporaryAvailableProperties>aAvailablePropertiesFromDialog[i];
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
						// const oPropertiesTaxaModel = <JSONModel>oView.getModel('propertiesTaxa');
						this._insertPropertyIntoPropertiesTaxaModel(oItem, iCategoryId, iTaxonId!, entry);
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
						// const oPropertiesTaxaModel = <JSONModel>oView.getModel('propertiesTaxa');
						this._insertPropertyIntoPropertiesTaxaModel(oItem_, iCategoryId, iTaxonId!, entry);
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
		
		this._oPlantPropertiesModel.refresh();
	}
	
	private _insertPropertyIntoPropertiesTaxaModel(oPropertyValue: FBPropertyValue, iCategoryId: int, iTaxonId: int, oEntry: LTemporaryAvailableProperties): void {
		// add a property value to taxon properties model
		const oPropertiesTaxaData = <LPropertiesTaxonModelData>this._oTaxonPropertiesModel.getData();
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

}