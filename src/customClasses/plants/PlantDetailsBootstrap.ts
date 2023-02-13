import ManagedObject from "sap/ui/base/ManagedObject"
import { BPlant} from "plants/ui/definitions/Plants";
import JSONModel from "sap/ui/model/json/JSONModel";
import View from "sap/ui/core/mvc/View";
import MessageToast from "sap/m/MessageToast";
import ImageRegistryHandler from "plants/ui/customClasses/singleton/ImageRegistryHandler";
import { LCurrentPlant } from "plants/ui/definitions/PlantsLocal";
import PlantImagesLoader from "./PlantImagesLoader";
import TaxonLoader from "../taxonomy/TaxonLoader";
import EventLoader from "../events/EventLoader";

/**
 * @namespace plants.ui.customClasses.plants
 */
export default class PlantDetailsBootstrap extends ManagedObject {

	private _oPlantsModel: JSONModel;
	private _oEventsModel: JSONModel;
	private _oTaxonModel: JSONModel;
	private _oDetailView: View;
	private _mCurrentPlant: LCurrentPlant;
	private _oPlantImagesLoader: PlantImagesLoader;
		

	public constructor(
		oDetailView: View, 
		oPlantsModel: JSONModel, 
		oEventsModel: JSONModel, 
		oImagesModel: JSONModel, 
		oTaxonModel: JSONModel, 
		mCurrentPlant: LCurrentPlant,
		) {

		super();
		this._oPlantsModel = oPlantsModel;
		this._oEventsModel = oEventsModel;
		this._oTaxonModel = oTaxonModel;

		this._oDetailView = oDetailView;
		this._mCurrentPlant = mCurrentPlant;

		this._oPlantImagesLoader = new PlantImagesLoader(oImagesModel);
	}

	
	public load(iPlantId: int): void {
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
		if (!oImageRegistryHandler.isPlantInPlantsWithImagesLoaded(iPlantId))
			this._oPlantImagesLoader.requestImagesForPlant(iPlantId);
		else
			oImageRegistryHandler.resetImagesForPlant(iPlantId);
		
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
			// this._loadEventsForCurrentPlant(iPlantId);
			new EventLoader(this._oEventsModel).loadEventsForPlant(iPlantId);
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

		this._oDetailView.bindElement({
			path: "/TaxaDict/" + this._mCurrentPlant.plant.taxon_id,
			model: "taxon"
		});
		if (this._mCurrentPlant.plant.taxon_id)
			// ModelsHelper.getInstance().loadTaxon(this._mCurrentPlant.plant.taxon_id);
			new TaxonLoader(this._oTaxonModel).loadTaxonIfRequired(this._mCurrentPlant.plant.taxon_id);


	}
}