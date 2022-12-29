import { BKewSearchResultEntry, BResultsTaxonInfoRequest, FAssignTaxonRequest, FTaxonInfoRequest } from "plants/ui/definitions/Taxon";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import Util from "plants/ui/customClasses/shared/Util";
import ModelsHelper from "plants/ui/model/ModelsHelper";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageHandler from "../singleton/MessageHandler";
import { ResponseStatus } from "plants/ui/definitions/SharedLocal";
import { BPlant } from "plants/ui/definitions/Plants";
import ColumnListItem from "sap/m/ColumnListItem";
import { LAjaxLoadDetailsForSpeciesDoneCallback } from "plants/ui/definitions/TaxonLocal";

/**
 * @namespace plants.ui.customClasses.taxonomy
 */
export default class SpeciesFinder extends ManagedObject {
    private _oModelKewSearchResults: JSONModel;

    public constructor(oModelKewSearchResults: JSONModel) {
        super();
        this._oModelKewSearchResults = oModelKewSearchResults;
    }

	public searchSpecies(sTaxonNamePattern: string, bIncludeExternalApis: boolean, bSearchForGenusNotSpecies: boolean): void{
		if (sTaxonNamePattern.length === 0) {
			MessageToast.show('Enter species first.');
			return;
		}
		Util.startBusyDialog('Retrieving results from species search...');
		var dPayload = <FTaxonInfoRequest>{
			'include_external_apis': bIncludeExternalApis,
			'taxon_name_pattern': sTaxonNamePattern,
			'search_for_genus_not_species': bSearchForGenusNotSpecies
		};
		$.ajax({
			url: Util.getServiceUrl('search_taxa_by_name'),
			type: 'POST',
			contentType: "application/json",
			data: JSON.stringify(dPayload),
			context: this,
			// async: true
		})
			.done(this._onReceivingSpeciesSearchResult)
			.fail(ModelsHelper.onReceiveErrorGeneric.bind(this, 'Search Taxa by Name (POST)'));
	}

	private _onReceivingSpeciesSearchResult(data: BResultsTaxonInfoRequest, sStatus: ResponseStatus, oResponse: JQueryXHR): void {
		Util.stopBusyDialog();
		this._oModelKewSearchResults.setData(data);
		MessageHandler.getInstance().addMessageFromBackend(data.message);
	}

	public loadDetailsForSpecies(oSelectedItem: ColumnListItem, sCustomName: string, oPlant: BPlant, 
		cbReceivingAdditionalSpeciesInformation: LAjaxLoadDetailsForSpeciesDoneCallback
		){  // todo refactor
			//having selected one of the search results (optionally with custom name), we now retrieve additional information
		
		if (!oSelectedItem) {
			MessageToast.show('Select item from results list first.');
			return;
		}

		const oSelectedRowData = <BKewSearchResultEntry>oSelectedItem.getBindingContext('kewSearchResults')!.getObject()
		const lsid = oSelectedRowData.lsid;

		// optionally, use has set a custom additional name. send full name then.
		if (sCustomName.startsWith('Error')) {
			var nameInclAddition = '';
		} else if (sCustomName === oSelectedRowData.name.trim()) {
			nameInclAddition = '';
		} else {
			nameInclAddition = sCustomName;
		}

		var dPayload = <FAssignTaxonRequest>{
			'lsid': lsid,
			'hasCustomName': (nameInclAddition.length === 0) ? false : true,
			'nameInclAddition': nameInclAddition,
			'source': oSelectedRowData.source,
			// in py interface, null is resolved to empty str in py, undefined is resolved to None
			'taxon_id': oSelectedRowData.id ? oSelectedRowData.id : undefined,
			'plant_id': oPlant.id
		};

		Util.startBusyDialog('Retrieving additional species information and saving them to Plants database...');
		const sServiceUrl = Util.getServiceUrl('retrieve_details_for_selected_taxon');

		$.ajax({
			url: sServiceUrl,
			context: this,
			contentType: "application/json",
			dataType: 'json',  // expected data type for response
			type: 'POST',
			data: JSON.stringify(dPayload)
		})
			.done(cbReceivingAdditionalSpeciesInformation)
			.fail(ModelsHelper.onReceiveErrorGeneric.bind(this, 'Retrieve Details for selected Taxon (POST)'));
	}




}