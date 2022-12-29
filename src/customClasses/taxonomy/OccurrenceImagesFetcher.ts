import ManagedObject from "sap/ui/base/ManagedObject";
import Util from "plants/ui/customClasses/shared/Util";
import { BResultsFetchTaxonImages, FFetchTaxonOccurrenceImagesRequest } from "plants/ui/definitions/Taxon";
import JSONModel from "sap/ui/model/json/JSONModel";
import { BPlant } from "plants/ui/definitions/Plants";
import { ResponseStatus } from "plants/ui/definitions/SharedLocal";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import MessageHandler from "../singleton/MessageHandler";

/**
 * @namespace plants.ui.customClasses.taxonomy
 */
export default class OccurrenceImagesFetcher extends ManagedObject {
    private _oTaxonModel: JSONModel;

    public constructor(oTaxonModel: JSONModel) {
        super();
        this._oTaxonModel = oTaxonModel;
    }

    public fetchOccurrenceImages(gbif_id: int, oCurrentPlant: BPlant): void {
		Util.startBusyDialog('Refetching Taxon Occurrence Images from GBIF for GBIF ID ...' + gbif_id);
		var dPayload = <FFetchTaxonOccurrenceImagesRequest>{
			'gbif_id': gbif_id
		};
		$.ajax({
			url: Util.getServiceUrl('fetch_taxon_occurrence_images'),
			type: 'POST',
			contentType: "application/json",
			data: JSON.stringify(dPayload),
			context: this,
		})
			.done(this._cbReceivingOccurrenceImages.bind(this, oCurrentPlant))
			.fail(ModelsHelper.onReceiveErrorGeneric.bind(this, 'fetch_taxon_occurrence_images (POST)'));
	}

	private _cbReceivingOccurrenceImages(oCurrentPlant: BPlant, data: BResultsFetchTaxonImages, sStatus: ResponseStatus, oResponse: JQueryXHR): void {
		// display newly fetched taxon images from gbif occurrences
		// (no need for caring about the serialized clone model as occurrences are read-only)
		Util.stopBusyDialog();

		var current_taxon = this._oTaxonModel.getProperty("/TaxaDict/" + oCurrentPlant.taxon_id)
		current_taxon.occurrence_images = data.occurrence_images;
		this._oTaxonModel.updateBindings(false);
		MessageHandler.getInstance().addMessageFromBackend(data.message);
	}


}