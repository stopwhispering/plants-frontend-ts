//todo refactor

import ManagedObject from "sap/ui/base/ManagedObject"
import Input from "sap/m/Input";
import GenericTag from "sap/m/GenericTag";
import ColumnListItem from "sap/m/ColumnListItem";
import { BKewSearchResultEntry, BTaxon } from "plants/ui/definitions/Taxon";

/**
 * @namespace plants.ui.customClasses.taxonomy
 */
export default class SpeciesFinderDialogHelper extends ManagedObject {

	public findSpeciesTableSelectedOrDataUpdated(oCustomNamePreviewTag: GenericTag, oInputAdditionalName: Input, oSelectedSpeciesItem?: ColumnListItem) {
		if (oSelectedSpeciesItem === undefined || oSelectedSpeciesItem === null) {
			oCustomNamePreviewTag.setText('');
			oInputAdditionalName.setEditable(false);
			oInputAdditionalName.setValue('');
			return;
		}
		var oSelectedRowData = <BKewSearchResultEntry>oSelectedSpeciesItem.getBindingContext('kewSearchResults')!.getObject()

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

		oCustomNamePreviewTag.setText(oSelectedRowData.name + ' ' + sNewValueAdditionalName);
	}

	handleSpeciesAdditionalNameLiveChange(oSelectedSpeciesItem: ColumnListItem, oCustomNamePreviewTag: GenericTag, sNewAdditionalName: string) {
		if (oSelectedSpeciesItem){
			const oSelectedRowData = <BKewSearchResultEntry>oSelectedSpeciesItem.getBindingContext('kewSearchResults')!.getObject();
			oCustomNamePreviewTag.setText(oSelectedRowData.name + ' ' + sNewAdditionalName);
		} else
			oCustomNamePreviewTag.setText('Error: Select item from table first.');
	}

	setInitialInputValues(oInputSearchPattern: Input, oInputAdditionalName: Input, oTaxon: BTaxon|null) {
		oInputSearchPattern.setValue((oTaxon) ? oTaxon.name : '');
		oInputAdditionalName.setValue('');
	}
}