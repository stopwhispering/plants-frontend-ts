import UIComponent from "sap/ui/core/UIComponent"
import * as models from "plants/ui/model/models"
import JSONModel from "sap/ui/model/json/JSONModel"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler"
import {
	LTaxonData, LTaxonMap
} from "./definitions/TaxonLocal"
import Navigation from "./customClasses/singleton/Navigation"
import View from "sap/ui/core/mvc/View"
import ImageRegistryHandler from "./customClasses/singleton/ImageRegistryHandler"
import ChangeTracker from "./customClasses/singleton/ChangeTracker"
import UntaggedImagesHandler from "./customClasses/images/UntaggedImagesHandler"
import Saver from "./customClasses/singleton/Saver"

/**
 * @namespace plants.ui
 */
export default class Component extends UIComponent {

	public static metadata = {
		manifest: "json"
	}

	public init(): void {
		super.init();
		this.getRouter().initialize();

		//////////////////////////////////////////////////////////
		// Instantiate Models and name them
		//////////////////////////////////////////////////////////
		this.setModel(models.createDeviceModel(), "device");

		var oPlantsModel = new JSONModel();
		oPlantsModel.setSizeLimit(2000);
		this.setModel(oPlantsModel, 'plants');

		var oImagesModel = new JSONModel();
		oImagesModel.setSizeLimit(50000);
		this.setModel(oImagesModel, 'images');

		var oUntaggedImagesModel = new JSONModel();
		oUntaggedImagesModel.setSizeLimit(250);
		this.setModel(oUntaggedImagesModel, 'untaggedImages');

		var oTaxonModel = new JSONModel(<LTaxonData>{ TaxaDict: <LTaxonMap>{} });
		oTaxonModel.setSizeLimit(2000);
		this.setModel(oTaxonModel, 'taxon');

		var oProposalKeywordsModel = new JSONModel();
		oTaxonModel.setSizeLimit(2000);
		this.setModel(oProposalKeywordsModel, 'keywords');

		var oNurserySourcesModel = new JSONModel();
		oNurserySourcesModel.setSizeLimit(50);
		this.setModel(oNurserySourcesModel, 'nurseries_sources');

		var oPropertyNamesModel = new JSONModel();
		oPropertyNamesModel.setSizeLimit(300);
		this.setModel(oPropertyNamesModel, 'propertyNames');

		this.setModel(new JSONModel(), 'filterValues');

		var oSettingsModel = new JSONModel({ preview_image: 'favourite_image' });
		this.setModel(oSettingsModel, 'status');

		this.setModel(new JSONModel());	 //layout model

		var oEventsModel = new JSONModel();
		oEventsModel.setProperty('/PlantsEventsDict', {}); // plant ids will be keys of that dict
		this.setModel(oEventsModel, 'events');

		const oPlantPropertiesModel = new JSONModel();
		oPlantPropertiesModel.setProperty('/propertiesPlants', {}); // plant ids will be keys of that dict
		this.setModel(oPlantPropertiesModel, 'properties');

		const oTaxonPropertiesModel = new JSONModel();
		oTaxonPropertiesModel.setProperty('/propertiesTaxon', {}); // taxon_id will be keys of that dict
		this.setModel(oTaxonPropertiesModel, 'propertiesTaxa');

		//////////////////////////////////////////////////////////
		// Instantiate Singleton Classes
		//////////////////////////////////////////////////////////		
		// instantiate message utility class and supply this component as context
		MessageHandler.createInstance();
		this.setModel(MessageHandler.getInstance().getMessageManager().getMessageModel(), "messages");

		// create plant images resetter instance class and supply image model
		ImageRegistryHandler.createInstance(oImagesModel);

		// instantiate navigation class and supply this component as context
		// TODO requires FlexibleColumnLayoutSemanticHelper
		// TODO this triggers onInit of FlexibleColumnLayout Controller! WHY???
		// Navigation requiers
		Navigation.createInstance(
			<View>this.getRootControl(),
			// this.getHelper(), 
			this.getRouter());

		//use helper class to load data into json models
		//(helper class is used to reload data via button as well)
		ModelsHelper.createInstance(
			oPlantsModel,
			oTaxonModel,
			oImagesModel,
			oUntaggedImagesModel,
			oProposalKeywordsModel,
			oNurserySourcesModel,
			oPropertyNamesModel,
		);

		// create instance of change handler class
		ChangeTracker.createInstance(
			oPlantsModel,
			oEventsModel,
			oPlantPropertiesModel,
			oTaxonPropertiesModel,
			oTaxonModel,
		);

		Saver.createInstance(
			oPlantsModel,
			oEventsModel,
			oPlantPropertiesModel,
			oTaxonPropertiesModel,
			oTaxonModel
		);


		///////////////////////////////////////////////////////////////////////////////	
		// Trigger loading of data from backend required from the beginning
		///////////////////////////////////////////////////////////////////////////////	
		new UntaggedImagesHandler(oUntaggedImagesModel).requestUntaggedImages();

		const oModelsHelper = ModelsHelper.getInstance();
		oModelsHelper.reloadPlantsFromBackend();
		// oModelsHelper.reloadTaxaFromBackend();
		oModelsHelper.reloadKeywordProposalsFromBackend();
		oModelsHelper.reloadNurserySourceProposalsFromBackend();
		oModelsHelper.reloadPropertyNamesFromBackend();
	}

	///////////////////////////////////////////////////////////////////////////////	
	// Others
	///////////////////////////////////////////////////////////////////////////////	
	public getModel(sModelName?: string): JSONModel {
		// override Component's getModel for type hint JSONModel instead of abstract model
		return <JSONModel>super.getModel(sModelName);
	}

}