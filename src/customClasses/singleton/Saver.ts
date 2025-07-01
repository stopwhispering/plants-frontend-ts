import Util from "plants/ui/customClasses/shared/Util";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { ImageRead, UpdateImageRequest } from "plants/ui/definitions/Images";
import { BackendSaveConfirmation, FBMajorResource } from "plants/ui/definitions/Messages";
import { PlantRead, UpdatePlantsRequest } from "plants/ui/definitions/Plants";
import { TaxonRead, TaxonUpdate } from "plants/ui/definitions/Taxon";
import { LTaxonData } from "plants/ui/definitions/TaxonLocal";
import ChangeTracker from "./ChangeTracker";
import MessageHandler from "./MessageHandler";
import { LEventsModelData, LPlantIdToEventsMap } from "plants/ui/definitions/EventsLocal";
import ErrorHandling from "../shared/ErrorHandling";
import { CreateOrUpdateEventRequest } from "plants/ui/definitions/Events";

/**
 * @namespace plants.ui.customClasses.singleton
 */
export default class Saver extends ManagedObject {

	private static _instance: Saver;

	private _oPlantsModel: JSONModel;
	private _oEventsModel: JSONModel;
	private _oTaxonModel: JSONModel;

	private _bSavingPlants = false;
	private _bSavingImages = false;
	private _bSavingTaxa = false;
	private _bSavingEvents = false;

	public static createInstance(
		oPlantsModel: JSONModel, 
		oEventsModel: JSONModel, 
		oTaxonModel: JSONModel
		): void {
		if (Saver._instance)
			throw new Error('ChangeTracker instance already created');
			Saver._instance = new Saver(oPlantsModel, oEventsModel, oTaxonModel);
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
		oTaxonModel: JSONModel, 
		) {

		super();
		this._oPlantsModel = oPlantsModel;
		this._oEventsModel = oEventsModel;
		this._oTaxonModel = oTaxonModel;
	}

	saveMajorResources() {
		Util.startBusyDialog('Saving...');
		this._bSavingPlants = false;
		this._bSavingImages = false;
		this._bSavingTaxa = false;
		this._bSavingEvents = false;

		const oChangeTracker = ChangeTracker.getInstance();
		const aModifiedPlants: PlantRead[] = oChangeTracker.getModifiedPlants();
		const aModifiedImages: ImageRead[] = oChangeTracker.getModifiedImages();
		const aModifiedTaxa: TaxonRead[] = oChangeTracker.getModifiedTaxa();
		const dModifiedEvents: LPlantIdToEventsMap = oChangeTracker.getModifiedEvents();

		// cancel busydialog if nothing was modified (callbacks not triggered)
		if ((aModifiedPlants.length === 0) && (aModifiedImages.length === 0) && (aModifiedTaxa.length === 0)
			&& (Object.keys(dModifiedEvents).length === 0)) {
			MessageToast.show('Nothing to save.');
			Util.stopBusyDialog();
			return;
		}

		// save plants
		if (aModifiedPlants.length > 0) {
			this._bSavingPlants = true;  // required in callback function  to find out if both savings are finished
			var dPayloadPlants: UpdatePlantsRequest = { 'PlantsCollection': aModifiedPlants };
			$.ajax({
				url: Util.getServiceUrl('plants/'),
				type: 'PUT',
				contentType: "application/json",
				data: JSON.stringify(dPayloadPlants),
				context: this
			})
				.done(this._onAjaxSuccessSave)  // returns UpdatePlantsResponse
				.fail(ErrorHandling.onFail.bind(this, 'Plant (PUT)'));
		}

		// save images
		if (aModifiedImages.length > 0) {
			this._bSavingImages = true;
			var dPayloadImages: UpdateImageRequest = { 'ImagesCollection': aModifiedImages };
			$.ajax({
				url: Util.getServiceUrl('images/'),
				type: 'PUT',
				contentType: "application/json",
				data: JSON.stringify(dPayloadImages),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ErrorHandling.onFail.bind(this, 'Image (PUT)'));
		}

		// save taxa
		if (aModifiedTaxa.length > 0) {
			this._bSavingTaxa = true;

			// cutting occurrence images (read-only)
			const aModifiedTaxaUnattached: TaxonRead[] = Util.getClonedObject(aModifiedTaxa);
			const aModifiedTaxaSave = <TaxonUpdate[]>aModifiedTaxaUnattached.map(m => {
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
				.fail(ErrorHandling.onFail.bind(this, 'Taxon (POST)'));
		}

		// save events
		if (Object.keys(dModifiedEvents).length > 0) {
			this._bSavingEvents = true;
			var dPayloadEvents: CreateOrUpdateEventRequest = { 'plants_to_events': dModifiedEvents };
			$.ajax({
				url: Util.getServiceUrl('events/'),
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(dPayloadEvents),
				context: this
			})
				.done(this._onAjaxSuccessSave)
				.fail(ErrorHandling.onFail.bind(this, 'Event (POST)'));
		}

	}

	private _onAjaxSuccessSave(oMsg: BackendSaveConfirmation, sStatus: string, oReturnData: object) {
		// cancel busydialog only if neither saving plants nor images or taxa is still running
		const sResource: FBMajorResource = oMsg.resource;
		if (sResource === 'PlantResource') {
			this._bSavingPlants = false;
			var dDataPlants: UpdatePlantsRequest = this._oPlantsModel.getData();
			ChangeTracker.getInstance().setOriginalPlants(dDataPlants);
		} else if (sResource === 'ImageResource') {
			this._bSavingImages = false;
			ChangeTracker.getInstance().setOriginalImagesFromImageRegistry();
		} else if (sResource === 'TaxonResource') {
			this._bSavingTaxa = false;
			var dDataTaxon: LTaxonData = this._oTaxonModel.getData();
			ChangeTracker.getInstance().setOriginalTaxa(dDataTaxon);
		} else if (sResource === 'EventResource') {
			this._bSavingEvents = false;
			var dDataEvents: LEventsModelData =this._oEventsModel.getData();
			ChangeTracker.getInstance().setOriginalEvents(dDataEvents.PlantsEventsDict);
			MessageHandler.getInstance().addMessageFromBackend(oMsg.message);
		}

		if (!this._bSavingPlants && !this._bSavingImages && !this._bSavingTaxa && !this._bSavingEvents) {
			Util.stopBusyDialog();
		}
	}	

}