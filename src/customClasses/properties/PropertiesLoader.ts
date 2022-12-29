import Util from "plants/ui/customClasses/shared/Util";
import ModelsHelper from "plants/ui/model/ModelsHelper"
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler"
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import {
	FBPropertiesInCategory, BResultsPropertiesForPlant, FBPropertyCollectionPlant, LTaxonToPropertiesInCategoryMap
} from "plants/ui/definitions/Properties";
import {
	LCategoryToPropertiesInCategoryMap, LPlantPropertiesRequest
} from "plants/ui/definitions/PropertiesLocal";
import { BPlant } from "plants/ui/definitions/Plants";
import { ResponseStatus } from "plants/ui/definitions/SharedLocal";
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker";

/**
 * @namespace plants.ui.customClasses.properties
 */
export default class PropertiesLoader extends ManagedObject {

	private _oPlantPropertiesModel: JSONModel;
	private _oTaxonPropertiesModel: JSONModel;

	public constructor(oPlantPropertiesModel: JSONModel, oTaxonPropertiesModel: JSONModel) {
		super();

		this._oPlantPropertiesModel = oPlantPropertiesModel;
		this._oTaxonPropertiesModel = oTaxonPropertiesModel;
	}

	loadPropertiesForCurrentPlant(oPlant: BPlant): void {
		// request data from backend
		// data is added to local properties model and bound to current view upon receivement
		var sPlantId = encodeURIComponent(oPlant.id!);
		var uri = 'plant_properties/' + sPlantId;

		// if plant's taxon's properties have not been already loaded, load them as well
		if (oPlant.taxon_id && !this._taxon_properties_already_loaded(oPlant.taxon_id))
			var oPayload = <LPlantPropertiesRequest>{ taxon_id: oPlant.taxon_id };
		else
			oPayload = {};

		$.ajax({
			url: Util.getServiceUrl(uri),
			data: oPayload,
			context: this,
			async: true
		})
			.done(this._onReceivingPropertiesForPlant.bind(this, oPlant))
			.fail(ModelsHelper.onReceiveErrorGeneric.bind(this, 'Property (GET)'));
	}

	private _taxon_properties_already_loaded(taxon_id: int): boolean {
		if (this._oTaxonPropertiesModel.getProperty('/propertiesTaxon/' + taxon_id))
			return true;
		else
			return false;
	}

	private _onReceivingPropertiesForPlant(oPlant: BPlant, oData: BResultsPropertiesForPlant, sStatus: ResponseStatus, oResponse: JQueryXHR): void {
		//insert (overwrite!) properties data for current plant with data received from backend
		this._oPlantPropertiesModel.setProperty('/propertiesPlants/' + oPlant.id + '/', oData.propertyCollections);

		// //for tracking changes, save a clone
		const oPropertyCollectionForPlant: FBPropertyCollectionPlant = oData.propertyCollections;
		ChangeTracker.getInstance().addPlantPropertyCollection(oPropertyCollectionForPlant, oPlant);

		// update taxon properties model
		if (Object.keys(oData.propertyCollectionsTaxon.categories).length > 0) {
			this._oTaxonPropertiesModel.setProperty('/propertiesTaxon/' + oPlant.taxon_id + '/', oData.propertyCollectionsTaxon.categories);

			const oPropertiesInCategory: LTaxonToPropertiesInCategoryMap = oData.propertyCollectionsTaxon.categories;
			ChangeTracker.getInstance().addTaxonPropertiesInCategory(oPropertiesInCategory, oPlant.taxon_id!);
		}

		// ... and redundantly insert the taxon data into the plant's properties array (only for display)
		this._appendTaxonPropertiesToPlantProperties(oPlant);

		MessageHandler.getInstance().addMessageFromBackend(oData.message);

		// somehow UI5 requires a forced refresh here in case of no plant properties data but appended taxon properties to the plant properties; maybe a bug
		this._oPlantPropertiesModel.refresh(true);
	}

	private _appendTaxonPropertiesToPlantProperties(oPlant: BPlant): void {
		// called after loading plant properties or instead of loading plant properties if these have been loaded already
		if (!oPlant.taxon_id) {
			return;
		}

		// var oModelPropertiesTaxon = oOwnerComponent.getModel('propertiesTaxa');
		// var oModelPropertiesPlant = oOwnerComponent.getModel('properties');
		var oCategoriesTaxon: LCategoryToPropertiesInCategoryMap = this._oTaxonPropertiesModel.getProperty('/propertiesTaxon/' + oPlant.taxon_id + '/');
		var aCategoriesPlant: FBPropertiesInCategory[] = this._oPlantPropertiesModel.getProperty('/propertiesPlants/' + oPlant.id + '/categories/');
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