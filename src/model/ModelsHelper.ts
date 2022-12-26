import JSONModel from "sap/ui/model/json/JSONModel";
import MessageUtil from "plants/ui/customClasses/MessageUtil";
import * as Util from "plants/ui/customClasses/Util";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import formatter from "plants/ui/model/formatter";
import Component from "../Component";
import { MessageType } from "sap/ui/core/library";
import Event from "sap/ui/base/Event";
import { FBImage } from "../definitions/Images";
import { LTaxonData, LTaxonMap } from "../definitions/TaxonLocal";
import { BResultsGetTaxon, BTaxon } from "../definitions/Taxon";
import { BPlant } from "../definitions/Plants";

/**
 * @namespace plants.ui.model
 */
export default class ModelsHelper extends ManagedObject {
	private static _instance: ModelsHelper;
	private formatter = new formatter();
	private _component: Component;
	
	public static getInstance(component?: Component) {
		if (!ModelsHelper._instance && !!component) {
			ModelsHelper._instance = new ModelsHelper(component);
		}
		return ModelsHelper._instance;
	}

	constructor(component: Component) {
		super();
		this._component = component;
		//we need to add the event handlers to the jsonmodel here as this is executed only
		//once; if we attach them before calling, they're adding up to one more each time
		this._component.getModel('plants').attachRequestCompleted(this._onReceivingPlantsFromBackend.bind(this));
		this._component.getModel('plants').attachRequestFailed(this.onReceiveErrorGeneric.bind(this, 'Plants Model'));

		this._component.getModel('taxon').attachRequestCompleted(this._onReceivingTaxaFromBackend.bind(this));
		this._component.getModel('taxon').attachRequestFailed(this.onReceiveErrorGeneric.bind(this, 'Taxon Model'));
	}

	onReceiveErrorGeneric(sCaller: string, error: JQueryXHR, sTypeOfError: null|"timeout"|"error"|"abort"|"parsererror", oExceptionObject?: any) {
		//trying to catch different kinds of error callback returns
		//always declare similar to: .fail(this.ModelsHelper.getInstance()._onReceiveErrorGeneric.bind(thisOrOtherContext,'EventsResource'));
		Util.stopBusyDialog();

		//fastapi manually thrown exceptions (default)
		if ((!!error) && (!!error.responseJSON) && (!!error.responseJSON.detail) && (!!error.responseJSON.detail.type)) {
			MessageUtil.getInstance().addMessageFromBackend(error.responseJSON.detail);
			MessageToast.show(error.responseJSON.detail.type + ': ' + error.responseJSON.detail.message);
			return;
		};

		//server not reachable
		const oErrorEvent: Event = <unknown>error as Event;
		if (!!oErrorEvent.getParameter && oErrorEvent.getParameter('message')){
			const sMsg = 'Error at ' + sCaller + ' - Could not reach Server (Error: ' + error.status + ' ' + error.statusText + ')'
			MessageUtil.getInstance().addMessage(MessageType.Error, sMsg);
			MessageToast.show(sMsg);
			return;
		};

		//fastapi unexpected error (e.g. pydantic validation error)
		if (!!error && !error.responseJSON){
			const sMsg = 'Error at ' + sCaller + ' - Unexpected Backend Error (Error: ' + error.status + ' ' + error.statusText + ')'
			MessageUtil.getInstance().addMessage(MessageType.Error, sMsg);
			MessageToast.show(sMsg);
			return;
		}

		MessageToast.show('Unknown Error. See onReceiveErrorGeneric and handle.');
	}

	private _onReceivingPlantsFromBackend(oRequestInfo: Event) {
		// create new clone objects to track changes
		const oPlantsModel = <JSONModel>oRequestInfo.getSource();
		this._component.oPlantsDataClone = Util.getClonedObject(oPlantsModel.getData());

		//create message
		var sresource = Util.parse_resource_from_url(oRequestInfo.getParameter('url'));
		MessageUtil.getInstance().addMessage(MessageType.Information, 'Loaded Plants from backend', undefined,
			'Resource: ' + sresource);
	}

	private _onReceivingTaxaFromBackend(oRequestInfo: Event) {
		// create new clone objects to track changes
		const oTaxonModel = <JSONModel>oRequestInfo.getSource();
		this._component.oTaxonDataClone = Util.getClonedObject(oTaxonModel.getData());

		//create message
		var sresource = Util.parse_resource_from_url(oRequestInfo.getParameter('url'));
		MessageUtil.getInstance().addMessage(MessageType.Information, 'Loaded Taxa from backend', undefined,
			'Resource: ' + sresource);
	}

	reloadPlantsFromBackend() {
		var sUrl = Util.getServiceUrl('plants/');
		this._component.getModel('plants').loadData(sUrl);
		Util.stopBusyDialog();  // todo: should be stopped only when everything has been reloaded, not only plants
	}

	resetImagesRegistry() {
		this._component.imagesRegistry = {};
		this._component.imagesRegistryClone = {};
		this._component.imagesPlantsLoaded = new Set();
		this._component.getModel('images').updateBindings(false);
		this._component.getModel('untaggedImages').updateBindings(false);
	}

	addToImagesRegistry(aImages: FBImage[]) {
		// after uploading new images, add them to the  registry
		aImages.forEach(oImage => {
			var sKey = oImage['filename'];
			if (!(sKey in this._component.imagesRegistry)) {
				this._component.imagesRegistry[sKey] = oImage;
			}
			this._component.imagesRegistryClone[sKey] = Util.getClonedObject(oImage);
		});
	}

	// reloadTaxaFromBackend() {
	// 	//todo remove everywhere
	// 	//reload taxon data
	// 	var sUrl = Util.getServiceUrl('taxa/');
	// 	this._component.getModel('taxon').loadData(sUrl);
	// }

	public loadTaxon(taxon_id: int|undefined): void{
		// in case we loaded a plant from same taxon earlier, we may not overwrite it in case of changes
		// we can just leave then as the correct taxon has already been bound to the view
		const oTaxonModel = <JSONModel>this._component.getModel('taxon');
		const oTaxon = oTaxonModel.getProperty('/TaxaDict/' + taxon_id);
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
		const oTaxonModel = <JSONModel>this._component.getModel('taxon');
		const oTaxon = <BTaxon>oData.taxon;
		oTaxonModel.setProperty('/TaxaDict/' + taxonId + '/', oTaxon);
		this._component.oTaxonDataClone.TaxaDict[taxonId] = Util.getClonedObject(oTaxon);
		MessageUtil.getInstance().addMessageFromBackend(oData.message);
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
		const oTaxonModel = <JSONModel>this._component.getModel('taxon');
		oTaxonModel.setProperty('/', {TaxaDict: <LTaxonMap>{}});
		this._component.oTaxonDataClone = <LTaxonData>{TaxaDict: <LTaxonMap>{}};
		oTaxonModel.updateBindings(false);

		// trigger reload of taxon details for current plant
		const iPlantId = this._parse_plant_id_from_hash();
		if (!iPlantId)
			return;
		const oPlantsModel = <JSONModel>this._component.getModel('plants');
		const aPlants = <BPlant[]>oPlantsModel.getProperty('/PlantsCollection/');
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
		if (!this._component.getModel('keywords')) {
			this._component.setModel(new JSONModel(sUrl), 'keywords');
		} else {
			this._component.getModel('keywords').loadData(sUrl);
		}
	}

	reloadNurserySourceProposalsFromBackend() {
		var sUrl = Util.getServiceUrl('proposals/NurserySourceProposals');
		if (!this._component.getModel('nurseries_sources')) {
			var oModel = new JSONModel(sUrl);
			oModel.setSizeLimit(50);
			this._component.setModel(oModel, 'nurseries_sources');
		} else {
			this._component.getModel('nurseries_sources').loadData(sUrl);
		}
	}

	reloadPropertyNamesFromBackend() {
		// get property names with their categories from backend
		var sUrl = Util.getServiceUrl('property_names/');
		if (!this._component.getModel('propertyNames')) {
			var oModel = new JSONModel(sUrl);
			oModel.setSizeLimit(300);
			this._component.setModel(oModel, 'propertyNames');
		} else {
			this._component.getModel('propertyNames').loadData(sUrl);
		}
	}

}