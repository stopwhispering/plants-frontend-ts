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
import PlantsLoader from "./customClasses/singleton/PlantsLoader"
import Localization from "sap/base/i18n/Localization"

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
		
		// Set default timezone to Europe/Berlin (CET/CEST)
		Localization.setTimezone("Europe/Berlin");

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
		const oFlowerHistoryModel = models.createFlowerHistoryModel();
		this.setModel(oFlowerHistoryModel, "flower_history")

		this.setModel(models.createStatusModel(), "status");

		//loading the suggesions.json model in manifest.json is async and in some situations not
		//available when required in detail controller; therefore, we load it here, synchronously(!)
		const oRequest = new XMLHttpRequest();
		oRequest.open("GET", "model/suggestions.json", false); // false = sync
		oRequest.send(null);
		if (oRequest.status === 200) {
			const oData = JSON.parse(oRequest.responseText);
			const oModel = new JSONModel(oData);
			this.setModel(oModel, "suggestions");
		} else {
			console.error("Failed to load suggestions.json synchronously.");
		}

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
			oTaxonModel,
		);

		Saver.createInstance(
			oPlantsModel,
			oEventsModel,
			oTaxonModel
		);

		PlantsLoader.createInstance(oPlantsModel);


		///////////////////////////////////////////////////////////////////////////////	
		// Trigger loading of data from backend required from the beginning
		///////////////////////////////////////////////////////////////////////////////	
		new UntaggedImagesHandler(oUntaggedImagesModel).requestUntaggedImages();
		PlantsLoader.getInstance().loadPlants();;
	}

	///////////////////////////////////////////////////////////////////////////////	
	// Others
	///////////////////////////////////////////////////////////////////////////////	
	public getModel(sModelName?: string): JSONModel {
		// override Component's getModel for type hint JSONModel instead of abstract model
		return <JSONModel>super.getModel(sModelName);
	}
}