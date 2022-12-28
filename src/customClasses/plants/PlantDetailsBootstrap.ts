import * as Util from "plants/ui/customClasses/shared/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import { BPlant} from "plants/ui/definitions/Plants";
import JSONModel from "sap/ui/model/json/JSONModel";
import { BEvents, BResultsEventResource } from "plants/ui/definitions/Events";
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler";
import View from "sap/ui/core/mvc/View";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import MessageToast from "sap/m/MessageToast";
import ImageRegistryHandler from "plants/ui/customClasses/singleton/ImageRegistryHandler";
import { LCurrentPlant } from "plants/ui/definitions/PlantsLocal";
import PlantImagesLoader from "./PlantImagesLoader";
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker";
import PropertiesLoader from "plants/ui/customClasses/properties/PropertiesLoader";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantDetailsBootstrap extends ManagedObject {

	private _oPlantsModel: JSONModel;
	private _oEventsModel: JSONModel;
	private _oPlantPropertiesModel: JSONModel;
	private _oTaxonPropertiesModel: JSONModel;
	private _oDetailView: View;
	private _mCurrentPlant: LCurrentPlant;
	private _oPlantImagesLoader: PlantImagesLoader;
		

	public constructor(
		oDetailView: View, 
		oPlantsModel: JSONModel, 
		oEventsModel: JSONModel, 
		oImagesModel: JSONModel, 
		oPlantPropertiesModel: JSONModel, 
		oTaxonPropertiesModel: JSONModel, 
		mCurrentPlant: LCurrentPlant,
		) {

		super();
		this._oPlantsModel = oPlantsModel;
		this._oEventsModel = oEventsModel;
		this._oPlantPropertiesModel = oPlantPropertiesModel;
		this._oTaxonPropertiesModel = oTaxonPropertiesModel;

		this._oDetailView = oDetailView;
		this._mCurrentPlant = mCurrentPlant;

		this._oPlantImagesLoader = new PlantImagesLoader(oImagesModel);
	}

	
	public load(iPlantId: int): void {
		// triggered in _onPatternMatched of details controller

		// we can't request the plant's taxon details as we might not have the taxon id, yet
		// (plants have not been loaded, yet, if site was opened with detail or untagged view)
		// we need to wait for the plants model to be loaded, to be sure to have the taxon id
		// the same applies to the properties - requesting requires the taxon id, too
		var oPromise: Promise<any> = this._oPlantsModel.dataLoaded();
		oPromise.then(this._cbPlantsLoaded.bind(this), this._cbPlantsLoaded.bind(this));

		// requesting events requires only the plant id...
		this._bindAndRequestEventsForPlant(iPlantId);

		// ... so does requesting images
		// if we haven't loaded images for this plant, yet, we do so before generating the images model
		const oImageRegistryHandler = ImageRegistryHandler.getInstance();
		// if (!this._setImagesPlantsLoaded.has(iPlantId)) {
		if (!oImageRegistryHandler.isPlantInPlantsWithImagesLoaded(iPlantId)){
			this._oPlantImagesLoader.requestImagesForPlant(iPlantId);
			// this._requestImagesForPlant(iPlantId);
		} else {
			oImageRegistryHandler.resetImagesForPlant(iPlantId);
		}
	}

	private _bindAndRequestEventsForPlant(iPlantId: int): void {
		// bind the plant's events to the current view
		this._oDetailView.bindElement({
			path: "/PlantsEventsDict/" + iPlantId.toString(),
			model: "events"
		});

		//load only on first load of that plant, otherwise we would overwrite modifications
		//to the plant's events
		if (!this._oEventsModel.getProperty('/PlantsEventsDict/' + iPlantId.toString() + '/')) {
			this._loadEventsForCurrentPlant(iPlantId);
		}
	}

	private _cbPlantsLoaded(): void {
		// triggered upon data loading finished of plants model, i.e. we now have all the
		// plants' details which enables to find the current plant's details including
		// the taxon id 

		// get current plant's position in plants model array
		var aPlants = <BPlant[]>this._oPlantsModel.getProperty('/PlantsCollection');
		this._mCurrentPlant.plant_index = aPlants.findIndex(plant => plant.id === this._mCurrentPlant.plant_id);
		if (this._mCurrentPlant.plant_index === -1) {
			MessageToast.show('Plant ID ' + this._mCurrentPlant.plant_id + ' not found. Redirecting.');
			this._mCurrentPlant.plant_index = 0;
		}

		// get current plant object in plants model array and bind plant to details view
		var sPathCurrentPlant = "/PlantsCollection/" + this._mCurrentPlant.plant_index;
		this._mCurrentPlant.plant = <BPlant>this._oPlantsModel.getProperty(sPathCurrentPlant);

		this._oDetailView.bindElement({
			path: sPathCurrentPlant,
			model: "plants"
		});

		// bind properties to view and have properties data loaded  
		this._oDetailView.bindElement({
			path: "/TaxaDict/" + this._mCurrentPlant.plant.taxon_id,
			model: "taxon"
		});
		ModelsHelper.getInstance().loadTaxon(this._mCurrentPlant.plant.taxon_id);

		// bind taxon to view and have taxon data loaded
		this._oDetailView.bindElement({
			path: "/propertiesPlants/" + this._mCurrentPlant.plant.id,
			model: "properties"
		});
		if (!this._oPlantPropertiesModel.getProperty('/propertiesPlants/' + this._mCurrentPlant.plant.id + '/')) {
			new PropertiesLoader(this._oPlantPropertiesModel, this._oTaxonPropertiesModel).loadPropertiesForCurrentPlant(this._mCurrentPlant.plant);
		}
	}

	private _loadEventsForCurrentPlant(iPlantId: int): void {
		// request plant's events from backend
		// data is added to local events model and bound to current view upon receivement
		const uri = 'events/' + iPlantId;
		$.ajax({
			url: Util.getServiceUrl(uri),
			context: this,
			async: true
		})
			.done(this._cbReceivingEventsForPlant.bind(this, iPlantId))
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Event (GET)'))
	}

	private _cbReceivingEventsForPlant(plantId: int, oData: BResultsEventResource): void {
		//insert (overwrite!) events data for current plant with data received from backend
		const aEvents = <BEvents>oData.events;
		this._oEventsModel.setProperty('/PlantsEventsDict/' + plantId + '/', aEvents);
		// this._oEventsDataClone[plantId] = Util.getClonedObject(aEvents);
		ChangeTracker.getInstance().setOriginalEventsForPlant(aEvents, plantId)
		MessageHandler.getInstance().addMessageFromBackend(oData.message);
	}
}