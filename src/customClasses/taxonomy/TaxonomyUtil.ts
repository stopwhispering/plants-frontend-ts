//todo refactor

import ManagedObject from "sap/ui/base/ManagedObject"
import Input from "sap/m/Input";
import GenericTag from "sap/m/GenericTag";
import View from "sap/ui/core/mvc/View";
import Table from "sap/m/Table";
import ColumnListItem from "sap/m/ColumnListItem";
import { BKewSearchResultEntry, BTaxon } from "plants/ui/definitions/Taxon";

/**
 * @namespace plants.ui.customClasses.taxonomy
 */
export default class TaxonomyUtil extends ManagedObject {
	private static _instance: TaxonomyUtil;

	public static getInstance(): TaxonomyUtil {
		// todo why singleton?=?=???!
		if (!TaxonomyUtil._instance) {
			TaxonomyUtil._instance = new TaxonomyUtil();
		}
		return TaxonomyUtil._instance;
	}

	public findSpeciesTableSelectedOrDataUpdated(oText: GenericTag, oInputAdditionalName: Input, oSelectedItem?: ColumnListItem) {
		if (oSelectedItem === undefined || oSelectedItem === null) {
			oText.setText('');
			oInputAdditionalName.setEditable(false);
			oInputAdditionalName.setValue('');
			return;
		}
		var oSelectedRowData = <BKewSearchResultEntry>oSelectedItem.getBindingContext('kewSearchResults')!.getObject()

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
		const oSelectedRowData = <BKewSearchResultEntry>oSelectedItem.getBindingContext('kewSearchResults')!.getObject()
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
			sCurrentBotanicalName = (<BTaxon> oView.getBindingContext('taxon')!.getObject()).name;
		}
		(<Input> oView.byId('inputTaxonNamePattern')).setValue(sCurrentBotanicalName);

		// clear additional name
		(<Input> oView.byId('inputFindSpeciesAdditionalName')).setValue('');
	}
}