import * as Util from "plants/ui/customClasses/Util";
import ManagedObject from "sap/ui/base/ManagedObject"
import { BPlant} from "../definitions/Plants";
import JSONModel from "sap/ui/model/json/JSONModel";
import { BEvents, BResultsEventResource } from "../definitions/Events";
import MessageHandler from "./MessageHandler";
import View from "sap/ui/core/mvc/View";
import ModelsHelper from "../model/ModelsHelper";
import { PlantIdToEventsMap } from "../definitions/EventsLocal";
import MessageToast from "sap/m/MessageToast";
import PropertiesUtil from "plants/ui/customClasses/PropertiesUtil"
import Component from "../Component";
import ImageRegistryHandler from "./ImageRegistryHandler";
import { LCurrentPlant } from "../definitions/PlantsLocal";
import PlantImagesLoader from "./PlantImagesLoader";
import ChangeTracker from "./ChangeTracker";

/**
 * @namespace plants.ui.customClasses
 */
export default class PlantDetailsBootstrap extends ManagedObject {

	private _oPlantsModel: JSONModel;
	private _oPropertiesModel: JSONModel;
	private _oEventsModel: JSONModel;
	private _oDetailView: View;
	private _setImagesPlantsLoaded: Set<int>;
	private _oComponent: Component;
	private _mCurrentPlant: LCurrentPlant;
	private _oPlantImagesLoader: PlantImagesLoader;
		

	public constructor(
		oDetailView: View, 
		oPlantsModel: JSONModel, 
		oPropertiesModel: JSONModel, 
		oEventsModel: JSONModel, 
		oImagesModel: JSONModel, 
		setImagesPlantsLoaded: Set<int>,
		oComponent: Component,
		mCurrentPlant: LCurrentPlant,
		) {

		super();
		this._oPropertiesModel = oPropertiesModel;
		this._oPlantsModel = oPlantsModel;
		this._oEventsModel = oEventsModel;
		this._oDetailView = oDetailView;
		this._setImagesPlantsLoaded = setImagesPlantsLoaded
		this._oComponent = oComponent;
		this._mCurrentPlant = mCurrentPlant;

		this._oPlantImagesLoader = new PlantImagesLoader(oImagesModel, setImagesPlantsLoaded);
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
		if (!this._setImagesPlantsLoaded.has(iPlantId)) {
			this._oPlantImagesLoader.requestImagesForPlant(iPlantId);
			// this._requestImagesForPlant(iPlantId);
		} else {
			ImageRegistryHandler.getInstance().resetImagesCurrentPlant(iPlantId);
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
		if (!this._oPropertiesModel.getProperty('/propertiesPlants/' + this._mCurrentPlant.plant.id + '/')) {
			PropertiesUtil.getInstance().loadPropertiesForCurrentPlant(this._mCurrentPlant.plant, this._oComponent);
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