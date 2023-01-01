import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import Context from "sap/ui/model/Context";
import { FBProperty, FBPropertyValue } from "plants/ui/definitions/Properties";
import { BPlant } from "plants/ui/definitions/Plants";

/**
 * @namespace plants.ui.customClasses.properties
 */
export default class PropertyValueCRUD extends ManagedObject {

	private _oPlantPropertiesModel: JSONModel;  // "properties"
	private _oTaxonPropertiesModel: JSONModel;  // "propertiesTaxa"

	public constructor(oPlantPropertiesModel: JSONModel, oTaxonPropertiesModel: JSONModel) {
		super();
		
		this._oPlantPropertiesModel = oPlantPropertiesModel;
		this._oTaxonPropertiesModel = oTaxonPropertiesModel;
	}

	public editPropertyValueDelete(oPropertiesBindingContext: Context, oCurrentPlant: BPlant): void {
		// delete a property value, either for current plant or it's taxon
		var sPathPropertyValue = oPropertiesBindingContext.getPath();
		var oPropertyValue = <FBPropertyValue>oPropertiesBindingContext.getObject();

		// if it's a taxon's property value, we need to remove it from the original taxon properties model as well
		if (oPropertyValue.type === 'taxon') {
			// get property name id
			var sPathPropertyValues = sPathPropertyValue.substring(0, sPathPropertyValue.lastIndexOf('/'));
			var sPathPropertyName = sPathPropertyValues.substring(0, sPathPropertyValues.lastIndexOf('/'));
			var iPropertyNameId = this._oPlantPropertiesModel.getProperty(sPathPropertyName).property_name_id;

			// get category id
			var sPath_1 = sPathPropertyName.substring(0, sPathPropertyName.lastIndexOf('/'));
			var sPathCategory = sPath_1.substring(0, sPath_1.lastIndexOf('/'));
			var iCategoryId = this._oPlantPropertiesModel.getProperty(sPathCategory).category_id;

			// var iTaxonId = evt.getSource().getBindingContext('plants').getObject().taxon_id;
			var iTaxonId = oCurrentPlant.taxon_id;

			// now we can find the respective node in the taxon properties model
			// find path in taxon properties model
			var sPath = '/propertiesTaxon/' + iTaxonId + '/' + iCategoryId + '/properties';
			var aPropertyNames = <FBProperty[]>this._oTaxonPropertiesModel.getProperty(sPath);
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
		sPathPropertyValues = sPathPropertyValue.substring(0, sPathPropertyValue.lastIndexOf('/'));
		var aPathPropertyValues = this._oPlantPropertiesModel.getProperty(sPathPropertyValues);
		var iIndex = aPathPropertyValues.indexOf(oPropertyValue);
		aPathPropertyValues.splice(iIndex, 1);

		this._oPlantPropertiesModel.refresh();
	}
}