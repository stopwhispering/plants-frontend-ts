import * as Util from "plants/ui/customClasses/shared/Util";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { EventsModelData, PlantIdToEventsMap } from "plants/ui/definitions/EventsLocal";
import { FBImage } from "plants/ui/definitions/Images";
import { BSaveConfirmation, FBMajorResource } from "plants/ui/definitions/Messages";
import { BPlant, FPlantsUpdateRequest } from "plants/ui/definitions/Plants";
import { LCategoryToPropertiesInCategoryMap, LPlantIdToPropertyCollectionMap, LPropertiesTaxonModelData, LTaxonToPropertyCategoryMap } from "../../definitions/PropertiesLocal";
import { BTaxon, FTaxon } from "plants/ui/definitions/Taxon";
import { LTaxonData } from "plants/ui/definitions/TaxonLocal";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import ChangeTracker from "./ChangeTracker";
import MessageHandler from "./MessageHandler";

/**
 * @namespace plants.ui.customClasses.singleton
 */
export default class Saver extends ManagedObject {

	private static _instance: Saver;

	private _oPlantsModel: JSONModel;
	private _oEventsModel: JSONModel;
	private _oPlantPropertiesModel: JSONModel;
	private _oTaxonPropertiesModel: JSONModel;
	private _oTaxonModel: JSONModel;

	private _bSavingPlants = false;
	private _bSavingImages = false;
	private _bSavingTaxa = false;
	private _bSavingEvents = false;
	private _bSavingPlantProperties = false;	
	private _bSavingTaxonProperties = false;	

	public static createInstance(
		oPlantsModel: JSONModel, 
		oEventsModel: JSONModel, 
		oPlantPropertiesModel: JSONModel, 
		oTaxonPropertiesModel: JSONModel, 
		oTaxonModel: JSONModel
		): void {
		if (Saver._instance)
			throw new Error('ChangeTracker instance already created');
			Saver._instance = new Saver(oPlantsModel, oEventsModel, oPlantPropertiesModel, oTaxonPropertiesModel, oTaxonModel);
	}

	public static getInstance(): Saver {
		if (!Saver._instance) {
			throw new Error('Saver instance not created yet');
		}
		return Saver._instance;
	}

	private constructor(
		oPlantsModel: JSONModel, 
		oEventsModel: JSONModel, 
		oPlantPropertiesModel: JSONModel, 
		oTaxonPropertiesModel: JSONModel, 
		oTaxonModel: JSONModel, 
		) {

		super();
		this._oPlantsModel = oPlantsModel;
		this._oEventsModel = oEventsModel;;
		this._oPlantPropertiesModel = oPlantPropertiesModel;
		this._oTaxonPropertiesModel = oTaxonPropertiesModel;
		this._oTaxonModel = oTaxonModel;
	}

	saveMajorResources() {
		//todo Save Class
		// saving images, plants, taxa, and events model
		Util.startBusyDialog('Saving...', 'Plants and Images');
		this._bSavingPlants = false;
		this._bSavingImages = false;
		this._bSavingTaxa = false;
		this._bSavingEvents = false;
		this._bSavingPlantProperties = false;
		this._bSavingTaxonProperties = false;

		const oChangeTracker = ChangeTracker.getInstance();
		const aModifiedPlants: BPlant[] = oChangeTracker.getModifiedPlants();
		const aModifiedImages: FBImage[] = oChangeTracker.getModifiedImages();
		const aModifiedTaxa: BTaxon[] = oChangeTracker.getModifiedTaxa();
		const dModifiedEvents: PlantIdToEventsMap = oChangeTracker.getModifiedEvents();
		const dModifiedPropertiesPlants: LPlantIdToPropertyCollectionMap = oChangeTracker.getModifiedPlantProperties();
		const dModifiedPropertiesTaxa: LCategoryToPropertiesInCategoryMap = oChangeTracker.getModifiedTaxonProperties();

		// cancel busydialog if nothing was modified (callbacks not triggered)
		if ((aModifiedPlants.length === 0) && (aModifiedImages.length === 0) && (aModifiedTaxa.length === 0)
			&& (Object.keys(dModifiedEvents).length === 0) && (Object.keys(dModifiedPropertiesPlants).length === 0) && (Object.keys(dModifiedPropertiesTaxa).length === 0)) {
			MessageToast.show('Nothing to save.');
			Util.stopBusyDialog();
			return;
		}

		// save plants
		if (aModifiedPlants.length > 0) {
			this._bSavingPlants = true;  // required in callback function  to find out if both savings are finished
			var dPayloadPlants = { 'PlantsCollection': aModifiedPlants };
			$.ajax({
				url: Util.getServiceUrl('plants/'),
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(dPayloadPlants),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Plant (POST)'));
		}

		// save images
		if (aModifiedImages.length > 0) {
			this._bSavingImages = true;
			var dPayloadImages = { 'ImagesCollection': aModifiedImages };
			$.ajax({
				url: Util.getServiceUrl('images/'),
				type: 'PUT',
				contentType: "application/json",
				data: JSON.stringify(dPayloadImages),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Image (PUT)'));
		}

		// save taxa
		if (aModifiedTaxa.length > 0) {
			this._bSavingTaxa = true;


			// cutting occurrence images (read-only)
			const aModifiedTaxaUnattached: BTaxon[] = Util.getClonedObject(aModifiedTaxa);
			const aModifiedTaxaSave = <FTaxon[]>aModifiedTaxaUnattached.map(m => {
				// @ts-ignore
				delete m.occurrence_images;
				return m;
			});

			var dPayloadTaxa = { 'ModifiedTaxaCollection': aModifiedTaxaSave };
			$.ajax({
				url: Util.getServiceUrl('taxa/'),
				type: 'PUT',
				contentType: "application/json",
				data: JSON.stringify(dPayloadTaxa),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Taxon (POST)'));
		}

		// save events
		if (Object.keys(dModifiedEvents).length > 0) {
			this._bSavingEvents = true;
			var dPayloadEvents = { 'plants_to_events': dModifiedEvents };
			$.ajax({
				url: Util.getServiceUrl('events/'),
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(dPayloadEvents),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Event (POST)'));
		}

		// save properties
		if (Object.keys(dModifiedPropertiesPlants).length > 0) {
			this._bSavingPlantProperties = true;
			var dPayloadProperties = { 'modifiedPropertiesPlants': dModifiedPropertiesPlants };
			$.ajax({
				url: Util.getServiceUrl('plant_properties/'),
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(dPayloadProperties),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'plant_properties (POST)'));
		}

		// save properties taxa
		if (Object.keys(dModifiedPropertiesTaxa).length > 0 || Object.keys(dModifiedPropertiesTaxa).length > 0) {
			this._bSavingTaxonProperties = true;
			var dPayloadPropertiesTaxa = { 'modifiedPropertiesTaxa': dModifiedPropertiesTaxa };
			$.ajax({
				url: Util.getServiceUrl('taxon_properties/'),
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(dPayloadPropertiesTaxa),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'taxon_properties (POST)'));
		}
	}

	private _onAjaxSuccessSave(oMsg: BSaveConfirmation, sStatus: string, oReturnData: object) {
		// cancel busydialog only if neither saving plants nor images or taxa is still running
		const sResource: FBMajorResource = oMsg.resource;
		if (sResource === 'PlantResource') {
			this._bSavingPlants = false;
			var dDataPlants: FPlantsUpdateRequest = this._oPlantsModel.getData();
			ChangeTracker.getInstance().setOriginalPlants(dDataPlants);
		} else if (sResource === 'ImageResource') {
			this._bSavingImages = false;
			// var oImageMap: LImageMap = this.oComponent.imagesRegistry;
			// ChangeTracker.getInstance().setOriginalImages(oImageMap);
			ChangeTracker.getInstance().setOriginalImagesFromImageRegistry();
		} else if (sResource === 'TaxonResource') {
			this._bSavingTaxa = false;
			var dDataTaxon: LTaxonData = this._oTaxonModel.getData();
			ChangeTracker.getInstance().setOriginalTaxa(dDataTaxon);
		} else if (sResource === 'EventResource') {
			this._bSavingEvents = false;
			var dDataEvents: EventsModelData =this._oEventsModel.getData();
			ChangeTracker.getInstance().setOriginalEvents(dDataEvents.PlantsEventsDict);
			MessageHandler.getInstance().addMessageFromBackend(oMsg.message);
		} else if (sResource === 'PlantPropertyResource') {
			this._bSavingPlantProperties = false;
			var dDataProperties = this._oPlantPropertiesModel.getData();
			const propertiesPlantsWithoutTaxa: LPlantIdToPropertyCollectionMap = ChangeTracker.getInstance().getPropertiesSansTaxa(dDataProperties.propertiesPlants);
			ChangeTracker.getInstance().setPlantPropertyCollections(propertiesPlantsWithoutTaxa)
			MessageHandler.getInstance().addMessageFromBackend(oMsg.message);
		} else if (sResource === 'TaxonPropertyResource') {
			this._bSavingTaxonProperties = false;
			var dDataPropertiesTaxa: LPropertiesTaxonModelData = this._oTaxonPropertiesModel.getData();
			const oTaxonToPropertyCategoryMap: LTaxonToPropertyCategoryMap = dDataPropertiesTaxa.propertiesTaxon;
			ChangeTracker.getInstance().setTaxonProperties(oTaxonToPropertyCategoryMap);
			MessageHandler.getInstance().addMessageFromBackend(oMsg.message);
		}

		if (!this._bSavingPlants && !this._bSavingImages && !this._bSavingTaxa && !this._bSavingEvents && !this._bSavingPlantProperties && !this._bSavingTaxonProperties) {
			Util.stopBusyDialog();
		}
	}	

}