import JSONModel from "sap/ui/model/json/JSONModel"
import Device from "sap/ui/Device"
import { LTaxonData, LTaxonMap } from "plants/ui/definitions/TaxonLocal";
import { LPlantIdToPropertyCollectionMap, LPropertiesPlantsModelData, LPropertiesTaxonModelData, LTaxonToPropertyCategoryMap } from "plants/ui/definitions/PropertiesLocal";
import { LEventsModelData } from "plants/ui/definitions/EventsLocal";
import Util from "plants/ui/customClasses/shared/Util";
import { LStatusModelData } from "../definitions/SharedLocal";

/**
 * @namespace plants.ui.model
 */
//////////////////////////////////////////////////////////
// Instantiated in Component
//////////////////////////////////////////////////////////		
export function createDeviceModel(): JSONModel {
	const oModel = new JSONModel(Device);
	oModel.setDefaultBindingMode("OneWay");
	return oModel;
}

export function createPlantsModel(): JSONModel {
	const oModel = new JSONModel();
	oModel.setSizeLimit(2000);
	return oModel;
}

export function createImagesModel(): JSONModel {
	const oModel = new JSONModel();
	oModel.setSizeLimit(50000);
	return oModel;
}

export function createUntaggedImagesModel(): JSONModel {
	const oModel = new JSONModel();
	oModel.setSizeLimit(250);
	return oModel;
}

export function createTaxonModel(): JSONModel {
	const oInitialData: LTaxonData = {
		TaxaDict: <LTaxonMap>{}
	};
	const oModel = new JSONModel(oInitialData);
	oModel.setSizeLimit(2000);
	return oModel;
}

export function createNurserySourcesModel(): JSONModel {
	const oModel = new JSONModel();
	oModel.setSizeLimit(150);
	oModel.loadData(Util.getServiceUrl('proposals/NurserySourceProposals'));	
	return oModel;
}

export function createPropertyNamesModel(): JSONModel {
	const oModel = new JSONModel();
	oModel.setSizeLimit(400);
	oModel.loadData(Util.getServiceUrl('property_names/'));	
	return oModel;
}

export function createProposalKeywordsModel(): JSONModel {
	const oModel = new JSONModel();
	oModel.setSizeLimit(2000);
	oModel.loadData(Util.getServiceUrl('proposals/KeywordProposals'));
	return oModel;
}

export function createEventsModel(): JSONModel {
	const oInitialData: LEventsModelData = {
		PlantsEventsDict: {}
	}
	const oModel = new JSONModel(oInitialData);
	return oModel;
}

export function createPlantPropertiesModel(): JSONModel {
	const oInitialData: LPropertiesPlantsModelData = {
		propertiesPlants: <LPlantIdToPropertyCollectionMap>{}
	}
	const oModel = new JSONModel(oInitialData);
	return oModel;
}

export function createTaxonPropertiesModel(): JSONModel {
	const oInitialData: LPropertiesTaxonModelData = {
		propertiesTaxon: <LTaxonToPropertyCategoryMap>{}
	}
	const oModel = new JSONModel(oInitialData);
	return oModel;
}

export function createLayoutModel(): JSONModel {
	return new JSONModel();
}

export function createStatusModel(): JSONModel {
	const oInitialData: LStatusModelData = {
		preview_image: "favourite_image",
		filterBarVisible: false,
		filterBarLabel: "",
	}
	const oModel = new JSONModel(oInitialData);
	return oModel;
}
