import ManagedObject from "sap/ui/base/ManagedObject"
import { GetPlantsResponse, PlantRead} from "plants/ui/definitions/Plants";
import JSONModel from "sap/ui/model/json/JSONModel";
import View from "sap/ui/core/mvc/View";
import MessageToast from "sap/m/MessageToast";
import ImageRegistryHandler from "plants/ui/customClasses/singleton/ImageRegistryHandler";
import { LCurrentPlant } from "plants/ui/definitions/PlantsLocal";
import PlantImagesLoader from "./PlantImagesLoader";
import TaxonLoader from "../taxonomy/TaxonLoader";
import EventLoader from "../events/EventLoader";
import Control from "sap/ui/core/Control";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantDetailsBootstrap extends ManagedObject {

	private _oPlantsModel: JSONModel;
	private _oEventsModel: JSONModel;
	private _oFlowerHistoryModel: JSONModel;
	private _oTaxonModel: JSONModel;
	private _oDetailView: View;
	private _mCurrentPlant: LCurrentPlant;
	private _oPlantImagesLoader: PlantImagesLoader;

	// controls to be set busy while loading corresponding data
	private _oBusyControlsEvents: Control[];
	private _oBusyControlsImages: Control[];
		

	public constructor(
		oDetailView: View, 
		oPlantsModel: JSONModel, 
		oEventsModel: JSONModel, 
		oFlowerHistoryModel: JSONModel,
		oImagesModel: JSONModel, 
		oTaxonModel: JSONModel, 
		mCurrentPlant: LCurrentPlant,
		oBusyControlsEvents: Control[],
		oBusyControlsImages: Control[],
		) {

		super();
		this._oPlantsModel = oPlantsModel;
		this._oEventsModel = oEventsModel;
		this._oFlowerHistoryModel = oFlowerHistoryModel;
		this._oTaxonModel = oTaxonModel;

		this._oDetailView = oDetailView;
		this._mCurrentPlant = mCurrentPlant;

		this._oPlantImagesLoader = new PlantImagesLoader(oImagesModel);

		this._oBusyControlsEvents = oBusyControlsEvents;
		this._oBusyControlsImages = oBusyControlsImages;
	}

	
	public async load(iPlantId: int) {
		// triggered in _onPatternMatched of details controller

		// we can't request the plant's taxon details as we might not have the taxon id, yet
		// (plants have not been loaded, yet, if site was opened with detail or untagged view)
		// we need to wait for the plants model to be loaded, to be sure to have the taxon id
		var oPromise: Promise<any> = this._oPlantsModel.dataLoaded();
		oPromise.then(this._cbPlantsLoaded.bind(this), this._cbPlantsLoaded.bind(this));

		// requesting events requires only the plant id...
		this._bindAndRequestEventsForPlant(iPlantId);

		// ... so does requesting images
		// if we haven't loaded images for this plant, yet, we do so before generating the images model
		const oImageRegistryHandler = ImageRegistryHandler.getInstance();
		if (!oImageRegistryHandler.isPlantInPlantsWithImagesLoaded(iPlantId)){
			this._oBusyControlsImages.forEach(c => c.setBusy(true));
			await this._oPlantImagesLoader.requestImagesForPlant(iPlantId);
			this._oBusyControlsImages.forEach(c => c.setBusy(false));
		}
		else
			oImageRegistryHandler.resetImagesForPlant(iPlantId);
		
	}

	private async _bindAndRequestEventsForPlant(iPlantId: int) {
		// bind the plant's events to the current view
		this._oDetailView.bindElement({
			path: "/PlantsEventsDict/" + iPlantId.toString(),
			model: "events"
		});
		
		// bind the plant's flower history (read only, loaded with events) to the current view
		this._oDetailView.bindElement({
			path: "/PlantsFlowerHistoryDict/" + iPlantId.toString(),
			model: "flower_history"
		});

		//load only on first load of that plant, otherwise we would overwrite modifications
		//to the plant's events
		if (!this._oEventsModel.getProperty('/PlantsEventsDict/' + iPlantId.toString() + '/')) {
			this._oBusyControlsEvents.forEach(c => c.setBusy(true));
			await new EventLoader(this._oEventsModel, this._oFlowerHistoryModel).loadEventsForPlant(iPlantId);
			this._oBusyControlsEvents.forEach(c => c.setBusy(false));
		}
	}

	private _cbPlantsLoaded(): void {
		// triggered upon data loading finished of plants model, i.e. we now have all the
		// plants' details which enables to find the current plant's details including
		// the taxon id 

		// get current plant's position in plants model array
		const oPlantsData = <GetPlantsResponse>this._oPlantsModel.getData();
		var aPlants = <PlantRead[]>oPlantsData.PlantsCollection;
		this._mCurrentPlant.plant_index = aPlants.findIndex(plant => plant.id === this._mCurrentPlant.plant_id);
		if (this._mCurrentPlant.plant_index === -1) {
			MessageToast.show('Plant ID ' + this._mCurrentPlant.plant_id + ' not found. Redirecting.');
			this._mCurrentPlant.plant_index = 0;
		}

		// get current plant object in plants model array and bind plant to details view
		var sPathCurrentPlant = "/PlantsCollection/" + this._mCurrentPlant.plant_index;
		this._mCurrentPlant.plant = <PlantRead>this._oPlantsModel.getProperty(sPathCurrentPlant);

		this._oDetailView.bindElement({
			path: sPathCurrentPlant,
			model: "plants"
		});

		this._oDetailView.bindElement({
			path: "/TaxaDict/" + this._mCurrentPlant.plant.taxon_id,
			model: "taxon"
		});
		if (this._mCurrentPlant.plant.taxon_id)
			new TaxonLoader(this._oTaxonModel).loadTaxonIfRequired(this._mCurrentPlant.plant.taxon_id);
	}
}