import { KewSearchResultEntry, SearchTaxaResponse, FNewTaxon, SearchTaxaRequest } from "plants/ui/definitions/Taxon";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import Util from "plants/ui/customClasses/shared/Util";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageHandler from "../singleton/MessageHandler";
import { ResponseStatus } from "plants/ui/definitions/SharedLocal";
import { LAjaxLoadDetailsForSpeciesDoneCallback } from "plants/ui/definitions/TaxonLocal";
import { SearchSpeciesCustomTaxonInputData } from "plants/ui/definitions/PlantsLocal";
import ErrorHandling from "../shared/ErrorHandling";

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
		var dPayload = <SearchTaxaRequest>{
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
			.fail(ErrorHandling.onFail.bind(this, 'Search Taxa by Name (POST)'));
	}

	private _onReceivingSpeciesSearchResult(data: SearchTaxaResponse, sStatus: ResponseStatus, oResponse: JQueryXHR): void {
		Util.stopBusyDialog();
		this._oModelKewSearchResults.setData(data);
		MessageHandler.getInstance().addMessageFromBackend(data.message);
	}

	public loadDetailsForSpecies(oSelectedSearchResult: KewSearchResultEntry, 
		oCustomTaxonInputData: SearchSpeciesCustomTaxonInputData,
		cbReceivingAdditionalSpeciesInformation: LAjaxLoadDetailsForSpeciesDoneCallback){  // todo refactor
			//having selected one of the search results (optionally with custom name), we now retrieve additional information
		
		if (!oSelectedSearchResult) {
			MessageToast.show('Select item from results list first.');
			return;
		}

		const oNewTaxon: FNewTaxon = {
			id: (oCustomTaxonInputData.newCustomTaxon) ? null : oSelectedSearchResult.id,  // if id is supplied, then we don't save anything but simply retrieve that existing taxon from db
			rank: oSelectedSearchResult.rank,
			family: oSelectedSearchResult.family,
			genus: oSelectedSearchResult.genus,
			species: oSelectedSearchResult.species,
			infraspecies: oSelectedSearchResult.infraspecies,
			lsid: oSelectedSearchResult.lsid,
			taxonomic_status: oSelectedSearchResult.taxonomic_status,
			synonym: oSelectedSearchResult.synonym,
			authors: oSelectedSearchResult.authors,
			name_published_in_year: oSelectedSearchResult.name_published_in_year,
			basionym: oSelectedSearchResult.basionym,
			hybrid: oSelectedSearchResult.hybrid,
			hybridgenus: oSelectedSearchResult.hybridgenus,
			synonyms_concat: oSelectedSearchResult.synonyms_concat,
			distribution_concat: oSelectedSearchResult.distribution_concat,
			
			is_custom: oCustomTaxonInputData.newCustomTaxon,
			custom_rank: Util.extract_custom_rank(oCustomTaxonInputData),
			custom_infraspecies: oCustomTaxonInputData.customInfraspecies,
			cultivar: oCustomTaxonInputData.cultivar,
			affinis: oCustomTaxonInputData.affinis,
			custom_suffix: oCustomTaxonInputData.customSuffix
		}

		Util.startBusyDialog('Assigning taxon to plant and retrieving additional information...');

		$.ajax({
			url: Util.getServiceUrl('taxa/new'),
			context: this,
			contentType: "application/json",
			dataType: 'json',
			type: 'POST',
			data: JSON.stringify(oNewTaxon)
		})
			.done(cbReceivingAdditionalSpeciesInformation)
			.fail(ErrorHandling.onFail.bind(this, 'Retrieve Details for selected Taxon (POST)'));
	}




}