import JSONModel from "sap/ui/model/json/JSONModel"
import MessageToast from "sap/m/MessageToast"
import * as Util from "plants/ui/customClasses/Util";
import MessageUtil from "plants/ui/customClasses/MessageUtil"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import ManagedObject from "sap/ui/base/ManagedObject"
import Dialog from "sap/m/Dialog";
import Input from "sap/m/Input";
import GenericTag from "sap/m/GenericTag";
import Detail from "../controller/Detail.controller";
import { Taxon, TaxonData } from "../definitions/entities";
import View from "sap/ui/core/mvc/View";
import Component from "../Component";
import Table from "sap/m/Table";
import ColumnListItem from "sap/m/ColumnListItem";
import { PPlant } from "../definitions/plant_entities";
import { PKewSearchResultEntry, PResultsFetchTaxonImages, PResultsSaveTaxonRequest, PResultsTaxonInfoRequest } from "../definitions/taxon_entities";
import { ResponseStatus } from "../definitions/shared_types";

/**
 * @namespace plants.ui.customClasses
 */
export default class TaxonomyUtil extends ManagedObject {
	private static _instance: TaxonomyUtil;

	public static getInstance(): TaxonomyUtil {
		if (!TaxonomyUtil._instance) {
			TaxonomyUtil._instance = new TaxonomyUtil();
		}
		return TaxonomyUtil._instance;
	}

	public findSpecies(sSpecies: string, bIncludeKew: boolean, bSearchForGenus: boolean, oModelKewSearchResults: JSONModel){
		if (sSpecies.length === 0) {
			MessageToast.show('Enter species first.');
			return;
		}
		Util.startBusyDialog('Retrieving results from species search...');
		var dPayload = {
			// 'args': {
			'species': sSpecies,
			'includeKew': bIncludeKew,
			'searchForGenus': bSearchForGenus
			// }
		};
		$.ajax({
			url: Util.getServiceUrl('search_external_biodiversity'),
			type: 'POST',
			contentType: "application/json",
			data: JSON.stringify(dPayload),
			context: this,
			// async: true
		})
			.done(this._onReceivingSpeciesDatabase.bind(this, oModelKewSearchResults))
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'search_external_biodiversity (POST)'));
	}

	private _onReceivingSpeciesDatabase(oModelKewSearchResults: JSONModel, data: PResultsTaxonInfoRequest, sStatus: ResponseStatus, oResponse: JQueryXHR) {
		Util.stopBusyDialog();
		oModelKewSearchResults.setData(data);
		MessageUtil.getInstance().addMessageFromBackend(data.message);
	}

	public chooseSpecies(oSelectedItem: ColumnListItem, sCustomName: string,
		oDialog: Dialog, oPlant: PPlant, oDetailController: Detail, oView: View){
		
		if (!oSelectedItem) {
			MessageToast.show('Select item from results list first.');
			return;
		}

		const oSelectedRowData = <PKewSearchResultEntry>oSelectedItem.getBindingContext('kewSearchResults')!.getObject()
		const fqId = oSelectedRowData.fqId;

		// optionally, use has set a custom additional name. send full name then.
		if (sCustomName.startsWith('Error')) {
			var nameInclAddition = '';
		} else if (sCustomName === oSelectedRowData.name.trim()) {
			nameInclAddition = '';
		} else {
			nameInclAddition = sCustomName;
		}

		var dPayload = {
			'fqId': fqId,
			'hasCustomName': (nameInclAddition.length === 0) ? false : true,
			'nameInclAddition': nameInclAddition,
			'source': oSelectedRowData.source,
			// in py interface, null is resolved to empty str in py, undefined is resolved to None
			'id': oSelectedRowData.id ? oSelectedRowData.id : undefined,
			'plant_id': oPlant.id
		};

		Util.startBusyDialog('Retrieving additional species information and saving them to Plants database...');
		const sServiceUrl = Util.getServiceUrl('download_taxon_details');

		$.ajax({
			url: sServiceUrl,
			context: this,
			contentType: "application/json",
			type: 'POST',
			data: JSON.stringify(dPayload)
		})
			.done(this._onReceivingAdditionalSpeciesInformationSaved.bind(this, oDialog, oPlant, oDetailController, oView))
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'download_taxon_details (POST)'));
	}

	private _onReceivingAdditionalSpeciesInformationSaved(oDialog: Dialog, oPlant: PPlant, oDetailController: Detail, oView: View, data: PResultsSaveTaxonRequest, sStatus: ResponseStatus, oResponse: JQueryXHR) {
		//taxon was saved in database and the taxon id is returned here
		//we assign that taxon id to the plant; this is persisted only upon saving
		//the whole new taxon dictionary is added to the taxon model and it's clone
		Util.stopBusyDialog();
		MessageToast.show(data.message.message);
		MessageUtil.getInstance().addMessageFromBackend(data.message);
		oDialog.close();

		const oPlantsModel = <JSONModel> oView.getModel('plants');
		const oModelTaxon = <JSONModel> oView.getModel('taxon');

		oPlant.botanical_name = data.botanical_name;
		oPlant.taxon_id = data.taxon_data.id;
		oPlantsModel.updateBindings(false);

		// add taxon to model if new 
		var sPathTaxon = '/TaxaDict/' + data.taxon_data.id;
		if (oModelTaxon.getProperty(sPathTaxon) === undefined) {
			oModelTaxon.setProperty(sPathTaxon, data.taxon_data);
		}

		//add taxon to model's clone if new
		var oTaxonDataClone = <TaxonData> (<Component> oDetailController.getOwnerComponent()).oTaxonDataClone;
		if (oTaxonDataClone.TaxaDict[data.taxon_data.id] === undefined) {
			oTaxonDataClone.TaxaDict[data.taxon_data.id] = Util.getClonedObject(data.taxon_data);
		}

		// bind received taxon to view (otherwise applied upon switching plant in detail view)
		oView.bindElement({
			path: "/TaxaDict/" + data.taxon_data.id,
			model: "taxon"
		});
	}

	public findSpeciesTableSelectedOrDataUpdated(oText: GenericTag, oInputAdditionalName: Input, oSelectedItem?: ColumnListItem) {
		if (oSelectedItem === undefined || oSelectedItem === null) {
			oText.setText('');
			oInputAdditionalName.setEditable(false);
			oInputAdditionalName.setValue('');
			return;
		}
		var oSelectedRowData = <PKewSearchResultEntry>oSelectedItem.getBindingContext('kewSearchResults')!.getObject()

		//reset additional name
		var sNewValueAdditionalName;
		if (oSelectedRowData.is_custom) {
			// if selected botanical name is a custom one, adding a(nother) suffix is forbidden
			oInputAdditionalName.setValue('');
			oInputAdditionalName.setEditable(false);
			sNewValueAdditionalName = '';

		} else if (oSelectedRowData.species === null || oSelectedRowData.species === undefined) {
			// if a genus is selected, not a (sub)species, we add a 'spec.' as a default
			oInputAdditionalName.setValue('spec.');
			sNewValueAdditionalName = 'spec.';
			oInputAdditionalName.setEditable(true);

		} else {
			//default case: selected a species with an official taxon name
			if (sNewValueAdditionalName === 'spec.') {
				oInputAdditionalName.setValue('');
				sNewValueAdditionalName = '';
			} else {
				sNewValueAdditionalName = oInputAdditionalName.getValue();
			}
			oInputAdditionalName.setEditable(true);
		}

		oText.setText(oSelectedRowData.name + ' ' + sNewValueAdditionalName);
	}

	findSpeciesAdditionalNameLiveChange(oView: View) {
		const oSelectedItem = <ColumnListItem> (<Table> oView.byId('tableFindSpeciesResults')).getSelectedItem();
		const oSelectedRowData = <PKewSearchResultEntry>oSelectedItem.getBindingContext('kewSearchResults')!.getObject()
		const oText = <GenericTag> oView.byId('textFindSpeciesAdditionalName');
		const sNewValueAdditionalName = (<Input>oView.byId('inputFindSpeciesAdditionalName')).getValue();

		if (!oSelectedItem) {
			oText.setText('Error: Select item from table first.');
			return;
		}

		oText.setText(oSelectedRowData.name + ' ' + sNewValueAdditionalName);
	}

	findSpeciesBeforeOpen(oView: View) { 
		//default plant search name is the current one (if available)
		if (oView.getBindingContext('taxon') === undefined || oView.getBindingContext('taxon')!.getObject() === undefined) {
			var sCurrentBotanicalName = '';
		} else {
			sCurrentBotanicalName = (<Taxon> oView.getBindingContext('taxon')!.getObject()).name;
		}
		(<Input> oView.byId('inputFindSpecies')).setValue(sCurrentBotanicalName);

		// clear additional name
		(<Input> oView.byId('inputFindSpeciesAdditionalName')).setValue('');
	}


	refetchGbifImages(gbif_id: int, oTaxonModel: JSONModel, oCurrentPlant: PPlant) {
		Util.startBusyDialog('Refetching Taxon Images from GBIF for GBIF ID ...' + gbif_id);
		var dPayload = {
			'gbif_id': gbif_id
		};
		$.ajax({
			url: Util.getServiceUrl('fetch_taxon_images'),
			type: 'POST',
			contentType: "application/json",
			data: JSON.stringify(dPayload),
			context: this,
			// async: true
		})
			.done(this._onReceivingRefetchdeGbifImages.bind(this, oTaxonModel, oCurrentPlant))
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'search_external_bifetch_taxon_imagesodiversity (POST)'));
	}

	private _onReceivingRefetchdeGbifImages(oTaxonModel: JSONModel, oCurrentPlant: PPlant, data: PResultsFetchTaxonImages, sStatus: ResponseStatus, oResponse: JQueryXHR) {
		// display newly fetched taxon images from gbif occurrences
		// (no need for caring about the serialized clone model as occurrences are read-only)
		Util.stopBusyDialog();

		var current_taxon = oTaxonModel.getProperty("/TaxaDict/" + oCurrentPlant.taxon_id)
		current_taxon.occurrenceImages = data.occurrenceImages;
		oTaxonModel.updateBindings(false);
		MessageUtil.getInstance().addMessageFromBackend(data.message);
	}
}