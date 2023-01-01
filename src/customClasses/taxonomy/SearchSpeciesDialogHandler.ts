import { BPlant } from "plants/ui/definitions/Plants";
import { LSearchSpeciesInputData } from "plants/ui/definitions/PlantsLocal";
import { BKewSearchResultEntry, BResultsRetrieveTaxonDetailsRequest, BTaxon } from "plants/ui/definitions/Taxon";
import Dialog from "sap/m/Dialog";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import Event from "sap/ui/base/Event";
import SpeciesFinder from "./SpeciesFinder";
import TaxonToPlantAssigner from "./TaxonToPlantAssigner";
import { LAjaxLoadDetailsForSpeciesDoneCallback } from "plants/ui/definitions/TaxonLocal";
import { ResponseStatus } from "plants/ui/definitions/SharedLocal";
import MessageToast from "sap/m/MessageToast";
import Util from "../shared/Util";
import MessageHandler from "../singleton/MessageHandler";
import ColumnListItem from "sap/m/ColumnListItem";
import Table from "sap/m/Table";

/**
 * @namespace plants.ui.customClasses.taxonomy
 */
export default class SearchSpeciesDialogHandler extends ManagedObject {
    
    private _oView: View;  // we need to bind the assigned taxon to the view later on
    private _oPlant: BPlant;
    private _oTaxon: BTaxon|undefined;

    private _oSearchSpeciesDialog: Dialog;  // "dialogFindSpecies"

    private _oTaxonToPlantAssigner: TaxonToPlantAssigner;


    constructor(oPlantsModel: JSONModel, oTaxonModel: JSONModel, oView: View) {
        super();
        this._oView = oView;
        this._oTaxonToPlantAssigner = new TaxonToPlantAssigner(oPlantsModel, oTaxonModel);
    }

    public openSearchSpeciesDialog(oViewAttachTo: View, oPlant: BPlant, oTaxon: BTaxon|undefined): void {
        this._oPlant = oPlant;
        this._oTaxon = oTaxon;

        if (this._oSearchSpeciesDialog) {
            this._oSearchSpeciesDialog.open();
            return;
        }

        Fragment.load({
            name: "plants.ui.view.fragments.detail.DetailFindSpecies",
            id: oViewAttachTo.getId(),
            controller: this
        }).then((oControl: Control | Control[]) => {
            this._oSearchSpeciesDialog = <Dialog>oControl;
            oViewAttachTo.addDependent(this._oSearchSpeciesDialog);

            this._oSearchSpeciesDialog.setModel(new JSONModel(), 'kewSearchResults');

            // attach two models: 1) for inputs 2) for backend results
            const oSearchSpeciesInputData: LSearchSpeciesInputData = {
                searchPattern: (this._oTaxon) ? this._oTaxon.name : '',
                additionalName: '',
                includeExternalApis: true,
                genusNotSpecies: false,
                customName: '',
                additionalNameEditable: true,
                searchResultName: undefined
            };

            const oSearchSpeciesInputModel = new JSONModel(oSearchSpeciesInputData);
            this._oSearchSpeciesDialog.setModel(oSearchSpeciesInputModel, 'searchSpeciesInput');

            this._oSearchSpeciesDialog.open();
        });

    }

	onButtonFindSpecies(oEvent: Event) {
		// when hitting search, trigger a backend call to retrieve species matching the search pattern
        const oSearchSpeciesInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('searchSpeciesInput');
        const oSearchSpeciesInputData = <LSearchSpeciesInputData>oSearchSpeciesInputModel.getData();
		const sTaxonNamePattern = oSearchSpeciesInputData.searchPattern;
		const bIncludeExternalApis = oSearchSpeciesInputData.includeExternalApis;
		const bSearchForGenusNotSpecies = oSearchSpeciesInputData.genusNotSpecies;

		const oModelKewSearchResults = <JSONModel>this._oSearchSpeciesDialog.getModel('kewSearchResults');
		new SpeciesFinder(oModelKewSearchResults).searchSpecies(sTaxonNamePattern, bIncludeExternalApis, bSearchForGenusNotSpecies);
	}

	onFindSpeciesChoose(oEvent: Event) {
		// when user chooses a species from the search results, trigger a backend call to retrieve additional information on
		// that species and assign it to the current plant
        const oSearchSpeciesInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('searchSpeciesInput');
        const oSearchSpeciesInputData = <LSearchSpeciesInputData>oSearchSpeciesInputModel.getData();

		const cbReceivingAdditionalSpeciesInformation: LAjaxLoadDetailsForSpeciesDoneCallback = (
			data: BResultsRetrieveTaxonDetailsRequest, sStatus: ResponseStatus, oResponse: JQueryXHR) => {
			Util.stopBusyDialog();
			MessageToast.show(data.message.message);
			MessageHandler.getInstance().addMessageFromBackend(data.message);
			this._oSearchSpeciesDialog.close();
			this._oTaxonToPlantAssigner.assignTaxonToPlant(this._oPlant, data.taxon_data, data.botanical_name);

			// bind received taxon to view (otherwise applied upon switching plant in detail view)
            // todo that's super ugly
			this._oView.bindElement({
				path: "/TaxaDict/" + data.taxon_data.id,
				model: "taxon"
			});
		}

		const oSelectedSpeciesItem = <ColumnListItem>(<Table>this.byId('tableFindSpeciesResults')).getSelectedItem();
		// const sCustomName = (<GenericTag>this.byId('textFindSpeciesAdditionalName')).getText().trim();
		const sCustomName = oSearchSpeciesInputData.customName ? oSearchSpeciesInputData.customName.trim() : '';
		const oModelKewSearchResults = <JSONModel>this._oSearchSpeciesDialog.getModel('kewSearchResults');
		new SpeciesFinder(oModelKewSearchResults).loadDetailsForSpecies(oSelectedSpeciesItem, sCustomName, this._oPlant, cbReceivingAdditionalSpeciesInformation);
	}

	onFindSpeciesTableSelectedOrDataUpdated(oEvent: Event) {
		// depending on selected search result, the additional name input field is enabled or disabled and the preview custom name tag is updated

        const oSearchSpeciesInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('searchSpeciesInput');
        const oSearchSpeciesInputData = <LSearchSpeciesInputData>oSearchSpeciesInputModel.getData();
        if(oEvent.getParameter('selected')){
            const oSelectedSpeciesItem = <ColumnListItem>oEvent.getParameter('listItem');
            const oSelectedSearchResult = <BKewSearchResultEntry>oSelectedSpeciesItem.getBindingContext('kewSearchResults')!.getObject()
            oSearchSpeciesInputData.searchResultName = oSelectedSearchResult.name;

            if (oSelectedSearchResult.is_custom)
                // if search result is itself a custom name, we don't allow an additional suffix
                this._disableCustomName(oSelectedSearchResult);
            else if (oSelectedSearchResult.rank == 'gen.')
                // if a genus was selected, we enable custom names
                this._setGenericSpecies(oSelectedSearchResult);
            else if (oSelectedSearchResult.rank == 'spec.')
                // if a species was selected, we enable custom names
                this._allowCustomName(oSelectedSearchResult);
            else   // 'genus', 'species'].includes(oSelectedSearchResult.rank)
                throw new Error('Invalid rank: ' + oSelectedSearchResult.rank);

        } else
            this._disableCustomName();
	}

	onFindSpeciesAdditionalNameLiveChange(oEvent: Event) {
		// when changing the optional additional name, update the corresponding tag to preview final full custom species name
        
        const oSearchSpeciesInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('searchSpeciesInput');
        const oSearchSpeciesInputData = <LSearchSpeciesInputData>oSearchSpeciesInputModel.getData();
        if (!oSearchSpeciesInputData.searchResultName)
            return

        const sNewAdditionalName = oEvent.getParameter('value').trim();
        oSearchSpeciesInputData.customName = oSearchSpeciesInputData.searchResultName.trim() + ' ' + sNewAdditionalName;
        oSearchSpeciesInputModel.updateBindings(false);
	}

    private _disableCustomName(oSelectedSearchResult?: BKewSearchResultEntry): void{
        const oSearchSpeciesInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('searchSpeciesInput');
        const oSearchSpeciesInputData = <LSearchSpeciesInputData>oSearchSpeciesInputModel.getData();        
        oSearchSpeciesInputData.additionalName = '';
        oSearchSpeciesInputData.customName = oSelectedSearchResult ? oSelectedSearchResult.name.trim() : '';
        oSearchSpeciesInputData.additionalNameEditable = false;
        oSearchSpeciesInputModel.updateBindings(false);
    }

    private _setGenericSpecies(oSelectedSearchResult: BKewSearchResultEntry){
        // if user selected a genus instead of a species, we add " spec." suffix
        // as a default and allow user to change it
        const oSearchSpeciesInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('searchSpeciesInput');
        const oSearchSpeciesInputData = <LSearchSpeciesInputData>oSearchSpeciesInputModel.getData();   
        oSearchSpeciesInputData.additionalName = 'spec.';
        oSearchSpeciesInputData.customName = oSelectedSearchResult.name + ' spec.'
        oSearchSpeciesInputData.additionalNameEditable = true;
        oSearchSpeciesInputModel.updateBindings(false);
    }

    private _allowCustomName(oSelectedSearchResult: BKewSearchResultEntry){
        // if user selected a species, we allow user to add an additional name
        const oSearchSpeciesInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('searchSpeciesInput');
        const oSearchSpeciesInputData = <LSearchSpeciesInputData>oSearchSpeciesInputModel.getData();   
        // oSearchSpeciesInputData.additionalName = 
        oSearchSpeciesInputData.customName = (oSelectedSearchResult.name.trim() + oSearchSpeciesInputData.additionalName).trim()
        oSearchSpeciesInputData.additionalNameEditable = true;
        oSearchSpeciesInputModel.updateBindings(false);
    }

	onCancelSearchSpeciesDialog(oEvent: Event) {
		this._oSearchSpeciesDialog.close();
	}
}