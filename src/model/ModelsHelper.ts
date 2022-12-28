import JSONModel from "sap/ui/model/json/JSONModel";
import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler";
import * as Util from "plants/ui/customClasses/shared/Util";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import { MessageType } from "sap/ui/core/library";
import Event from "sap/ui/base/Event";
import { LTaxonMap } from "../definitions/TaxonLocal";
import { BResultsGetTaxon, BTaxon } from "../definitions/Taxon";
import { BPlant, FPlantsUpdateRequest } from "../definitions/Plants";
import ChangeTracker from "../customClasses/singleton/ChangeTracker";
import ImageRegistryHandler from "../customClasses/singleton/ImageRegistryHandler";

/**
 * @namespace plants.ui.model
 */
export default class ModelsHelper extends ManagedObject {
	private static _instance: ModelsHelper;
	private _oPlantsModel: JSONModel;
	private _oTaxonModel: JSONModel;
	private _oImagesModel: JSONModel;
	private _oUntaggedImagesModel: JSONModel;
	private _oProposalKeywordsModel: JSONModel;
	private _oNurserySourcesModel: JSONModel;
	private _oPropertyNamesModel: JSONModel;

	
	public static createInstance(
		oPlantsModel: JSONModel, 
		oTaxonModel: JSONModel,
		oImagesModel: JSONModel,
		oUntaggedImagesModel: JSONModel,
		oProposalKeywordsModel: JSONModel,
		oNurserySourcesModel: JSONModel,
		oPropertyNamesModel: JSONModel,
		): void {
		if (ModelsHelper._instance)
			throw new Error('ModelsHelper already instantiated');
		ModelsHelper._instance = new ModelsHelper(oPlantsModel, oTaxonModel, oImagesModel, oUntaggedImagesModel, oProposalKeywordsModel, oNurserySourcesModel, oPropertyNamesModel);
	}
	
	public static getInstance(): ModelsHelper {
		if (!ModelsHelper._instance) {
			throw new Error('ModelsHelper not yet instantiated');
		}
		return ModelsHelper._instance;
	}

	constructor(
		oPlantsModel: JSONModel, 
		oTaxonModel: JSONModel,
		oImagesModel: JSONModel,
		oUntaggedImagesModel: JSONModel,
		oProposalKeywordsModel: JSONModel,
		oNurserySourcesModel: JSONModel,
		oPropertyNamesModel: JSONModel,
		
		) {
		super();
		this._oPlantsModel = oPlantsModel;
		this._oTaxonModel = oTaxonModel;
		this._oImagesModel = oImagesModel;
		this._oUntaggedImagesModel = oUntaggedImagesModel;
		this._oProposalKeywordsModel = oProposalKeywordsModel;
		this._oNurserySourcesModel = oNurserySourcesModel;
		this._oPropertyNamesModel = oPropertyNamesModel;

		//we need to add the event handlers to the jsonmodel here as this is executed only
		//once; if we attach them before calling, they're adding up to one more each time
		this._oPlantsModel.attachRequestCompleted(this._onReceivingPlantsFromBackend.bind(this));
		this._oPlantsModel.attachRequestFailed(this.onReceiveErrorGeneric.bind(this, 'Plants Model'));
	}

	onReceiveErrorGeneric(sCaller: string, error: JQueryXHR, sTypeOfError: null|"timeout"|"error"|"abort"|"parsererror", oExceptionObject?: any) {
		//trying to catch different kinds of error callback returns
		//always declare similar to: .fail(this.ModelsHelper.getInstance()._onReceiveErrorGeneric.bind(thisOrOtherContext,'EventsResource'));
		Util.stopBusyDialog();

		//fastapi manually thrown exceptions (default)
		if ((!!error) && (!!error.responseJSON) && (!!error.responseJSON.detail) && (!!error.responseJSON.detail.type)) {
			MessageHandler.getInstance().addMessageFromBackend(error.responseJSON.detail);
			MessageToast.show(error.responseJSON.detail.type + ': ' + error.responseJSON.detail.message);
			return;
		};

		//server not reachable
		const oErrorEvent: Event = <unknown>error as Event;
		if (!!oErrorEvent.getParameter && oErrorEvent.getParameter('message')){
			const sMsg = 'Error at ' + sCaller + ' - Could not reach Server (Error: ' + error.status + ' ' + error.statusText + ')'
			MessageHandler.getInstance().addMessage(MessageType.Error, sMsg);
			MessageToast.show(sMsg);
			return;
		};

		//fastapi unexpected error (e.g. pydantic validation error)
		if (!!error && !error.responseJSON){
			const sMsg = 'Error at ' + sCaller + ' - Unexpected Backend Error (Error: ' + error.status + ' ' + error.statusText + ')'
			MessageHandler.getInstance().addMessage(MessageType.Error, sMsg);
			MessageToast.show(sMsg);
			return;
		}

		MessageToast.show('Unknown Error. See onReceiveErrorGeneric and handle.');
	}

	private _onReceivingPlantsFromBackend(oRequestInfo: Event) {
		// create new clone objects to track changes
		const oPlantsModel = <JSONModel>oRequestInfo.getSource();
		ChangeTracker.getInstance().setOriginalPlants(<FPlantsUpdateRequest>oPlantsModel.getData());

		//create message
		var sresource = Util.parse_resource_from_url(oRequestInfo.getParameter('url'));
		MessageHandler.getInstance().addMessage(MessageType.Information, 'Loaded Plants from backend', undefined,
			'Resource: ' + sresource);
	}

	reloadPlantsFromBackend() {
		var sUrl = Util.getServiceUrl('plants/');
		this._oPlantsModel.loadData(sUrl);
		Util.stopBusyDialog();  // todo: should be stopped only when everything has been reloaded, not only plants
	}

	resetImages() {
		// completely reset images, i.e. images registry, list of plants with images loaded, 
		// and original image data in change tracker
		// update image-related models
		const oImageRegistryHandler = ImageRegistryHandler.getInstance();
		oImageRegistryHandler.resetImageRegistry();
		ChangeTracker.getInstance().resetOriginalImages();
		oImageRegistryHandler.resetPlantsWithImagesLoaded();
		this._oImagesModel.updateBindings(false);
		this._oUntaggedImagesModel.updateBindings(false);
	}

	public loadTaxon(taxon_id: int|undefined): void{
		// in case we loaded a plant from same taxon earlier, we may not overwrite it in case of changes
		// we can just leave then as the correct taxon has already been bound to the view
		const oTaxon = this._oTaxonModel.getProperty('/TaxaDict/' + taxon_id);
		if (oTaxon) {
			return;
		}

		// in case the plant has no taxon, yet, we can skip loading, too
		if (!taxon_id) {
			return;
		}

		// request taxon details from backend
		const uri = 'taxa/' + taxon_id;
		$.ajax({
			url: Util.getServiceUrl(uri),
			context: this,
			async: true
		})
			.done(this._onReceivingTaxonDetailsForPlant.bind(this, taxon_id!))
			.fail(this.onReceiveErrorGeneric.bind(this, 'Event (GET)'))
	}

	private _onReceivingTaxonDetailsForPlant(taxonId: int, oData: BResultsGetTaxon): void {
		//insert (overwrite!) events data for current plant with data received from backend
		const oTaxon = <BTaxon>oData.taxon;
		this._oTaxonModel.setProperty('/TaxaDict/' + taxonId + '/', oTaxon);
		ChangeTracker.getInstance().addOriginalTaxon(oTaxon);
		MessageHandler.getInstance().addMessageFromBackend(oData.message);
	}

	private _parse_plant_id_from_hash(): int|undefined {
		// parse plant id from hash, e.g. '#/detail/870/TwoColumnsMidExpanded' -> 870
		const sHash: string = window.location.hash;
		if (sHash.startsWith('#/detail/')) {
			const aParts = sHash.split('/');
			return parseInt(aParts[2]);
		}
	}

	public resetTaxaRegistry() {
		// reset the taxa registry including it's clone and trigger reload of current plant's taxon details
		this._oTaxonModel.setProperty('/', {TaxaDict: <LTaxonMap>{}});
		ChangeTracker.getInstance().resetOriginalTaxa();
		this._oTaxonModel.updateBindings(false);

		// trigger reload of taxon details for current plant
		const iPlantId = this._parse_plant_id_from_hash();
		if (!iPlantId)
			return;
		const aPlants = <BPlant[]>this._oPlantsModel.getProperty('/PlantsCollection/');
		const oCurrentPlant = aPlants.find(p => p.id === iPlantId);
		if (!oCurrentPlant)
			throw new Error('Plant with id ' + iPlantId + ' not found in plants collection');
		if (!oCurrentPlant.taxon_id)
			return;
		this.loadTaxon(oCurrentPlant.taxon_id);
	}

	reloadKeywordProposalsFromBackend() {
		// get keywords collection from backend proposals resource
		var sUrl = Util.getServiceUrl('proposals/KeywordProposals');
		this._oProposalKeywordsModel.loadData(sUrl);
	}

	reloadNurserySourceProposalsFromBackend() {
		var sUrl = Util.getServiceUrl('proposals/NurserySourceProposals');
		this._oNurserySourcesModel.loadData(sUrl);
	}

	reloadPropertyNamesFromBackend() {
		// get property names with their categories from backend
		var sUrl = Util.getServiceUrl('property_names/');
		this._oPropertyNamesModel.loadData(sUrl);
	}

}