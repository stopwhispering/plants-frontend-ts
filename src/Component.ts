import UIComponent from "sap/ui/core/UIComponent"
import * as models from "plants/ui/model/models"
import JSONModel from "sap/ui/model/json/JSONModel"
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler"
import Navigation from "./customClasses/singleton/Navigation"
import View from "sap/ui/core/mvc/View"
import ImageRegistryHandler from "./customClasses/singleton/ImageRegistryHandler"
import ChangeTracker from "./customClasses/singleton/ChangeTracker"
import UntaggedImagesHandler from "./customClasses/images/UntaggedImagesHandler"
import Saver from "./customClasses/singleton/Saver"
import PlantsLoader from "./customClasses/plants/PlantsLoader"

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
		this.setModel(models.createLayoutModel());

		const oTaxonModel = models.createTaxonModel();
		this.setModel(oTaxonModel, "taxon");
		const oPlantsModel = models.createPlantsModel()
		this.setModel(oPlantsModel, "plants");
		const oImagesModel = models.createImagesModel();
		this.setModel(oImagesModel, "images");
		const oUntaggedImagesModel = models.createUntaggedImagesModel();
		this.setModel(oUntaggedImagesModel, "untaggedImages");
		const oProposalKeywordsModel = models.createProposalKeywordsModel();
		this.setModel(oProposalKeywordsModel, "keywords");
		const oNurserySourcesModel = models.createNurserySourcesModel();
		this.setModel(oNurserySourcesModel, "nurseries_sources");
		const oPropertyNamesModel = models.createPropertyNamesModel();
		this.setModel(oPropertyNamesModel, "propertyNames");
		const oEventsModel = models.createEventsModel();
		this.setModel(oEventsModel, "events");
		const oPlantPropertiesModel = models.createPlantPropertiesModel();
		this.setModel(oPlantPropertiesModel, "properties");
		const oTaxonPropertiesModel = models.createTaxonPropertiesModel();
		this.setModel(oTaxonPropertiesModel, "propertiesTaxa");

		this.setModel(models.createFilterValuesModel(), "filterValues");
		this.setModel(models.createStatusModel(), "status");

		//////////////////////////////////////////////////////////
		// Instantiate Singleton Classes
		//////////////////////////////////////////////////////////		
		// instantiate message utility class and supply this component as context
		MessageHandler.createInstance();
		this.setModel(MessageHandler.getInstance().getMessageManager().getMessageModel(), "messages");

		ImageRegistryHandler.createInstance(oImagesModel);
		Navigation.createInstance(
			<View>this.getRootControl(),
			// this.getHelper(), 
			this.getRouter());
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
		new PlantsLoader(oPlantsModel).loadPlants();;
	}

	///////////////////////////////////////////////////////////////////////////////	
	// Others
	///////////////////////////////////////////////////////////////////////////////	
	public getModel(sModelName?: string): JSONModel {
		// override Component's getModel for type hint JSONModel instead of abstract model
		return <JSONModel>super.getModel(sModelName);
	}
}