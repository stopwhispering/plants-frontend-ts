import { BPlant } from "plants/ui/definitions/Plants";
import { LSearchSpeciesInputData, SearchSpeciesCustomTaxonInputData } from "plants/ui/definitions/PlantsLocal";
import { 
    BCreatedTaxonResponse, BKewSearchResultEntry, BResultsGetBotanicalName, BTaxon, FBotanicalAttributes 
} from "plants/ui/definitions/Taxon";
import Dialog from "sap/m/Dialog";
import ManagedObject from "sap/ui/base/ManagedObject";
import Control from "sap/ui/core/Control";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import JSONModel from "sap/ui/model/json/JSONModel";
import SpeciesFinder from "./SpeciesFinder";
import TaxonToPlantAssigner from "./TaxonToPlantAssigner";
import { LAjaxLoadDetailsForSpeciesDoneCallback } from "plants/ui/definitions/TaxonLocal";
import { ResponseStatus } from "plants/ui/definitions/SharedLocal";
import MessageToast from "sap/m/MessageToast";
import Util from "../shared/Util";
import MessageHandler from "../singleton/MessageHandler";
import ColumnListItem from "sap/m/ColumnListItem";
import Context from "sap/ui/model/Context";
import VBox from "sap/m/VBox";
import formatter from "plants/ui/model/formatter";
import Switch, { Switch$ChangeEvent } from "sap/m/Switch";
import ErrorHandling from "../shared/ErrorHandling";
import { ListBase$SelectionChangeEvent } from "sap/m/ListBase";
import { Input$SubmitEvent } from "sap/m/Input";
import { Button$PressEvent } from "sap/m/Button";
import { InputBase$ChangeEvent } from "sap/m/InputBase";

/**
 * @namespace plants.ui.customClasses.taxonomy
 */
export default class SearchSpeciesDialogHandler extends ManagedObject {

    public formatter: formatter = new formatter();  // requires instant instantiation, otherwise formatter is not available in dialog
    
    private _oView: View;  // we need to bind the assigned taxon to the view later on
    private _oPlant: BPlant;
    private _oTaxon: BTaxon|undefined;

    private _oSearchSpeciesDialog: Dialog;  // "dialogFindSpecies"

    private _oTaxonToPlantAssigner: TaxonToPlantAssigner;
    private _oSelectedListItemBindingContext: Context | null | undefined;
    private _oBoxSelectedResultEntry: VBox;


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
            this._oBoxSelectedResultEntry = <VBox>oViewAttachTo.byId('boxSelectedResultEntry');
            this._oSearchSpeciesDialog.setModel(new JSONModel(), 'kewSearchResults');

            const oSearchSpeciesInputModel = this._resetSearchSpeciesInput();
            this._oSearchSpeciesDialog.setModel(oSearchSpeciesInputModel, 'searchSpeciesInput');
            
            const oCustomTaxonInputData = this._resetCustomTaxonInput();
            this._oSearchSpeciesDialog.setModel(oCustomTaxonInputData, 'customTaxonInput');

            this._oSearchSpeciesDialog.open();
        });

    }

    private _resetSearchSpeciesInput(): JSONModel{
        let oSearchSpeciesInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('searchSpeciesInput');
        if (!oSearchSpeciesInputModel) {
            oSearchSpeciesInputModel = new JSONModel({});
        }
        const oSearchSpeciesInputData = <LSearchSpeciesInputData>oSearchSpeciesInputModel.getData();
        oSearchSpeciesInputData.searchPattern = (this._oTaxon) ? this._oTaxon.name : '';
        oSearchSpeciesInputData.additionalName = '';
        oSearchSpeciesInputData.includeExternalApis = true;
        oSearchSpeciesInputData.genusNotSpecies = false;
        oSearchSpeciesInputData.customName = '';
        oSearchSpeciesInputData.additionalNameEditable = true;
        oSearchSpeciesInputData.searchResultName = undefined;
        oSearchSpeciesInputData.resultSelected = false;  
        oSearchSpeciesInputModel.updateBindings(false);
        return oSearchSpeciesInputModel;
    }

    private _resetCustomTaxonInput(): JSONModel{
        let oCustomTaxonInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('customTaxonInput');
        if (!oCustomTaxonInputModel) {
            oCustomTaxonInputModel = new JSONModel({});
        }
        const oCustomTaxonInputData = <SearchSpeciesCustomTaxonInputData>oCustomTaxonInputModel.getData();
        oCustomTaxonInputData.visible = false;
        oCustomTaxonInputData.editable = true;
        oCustomTaxonInputData.editableCustomInfraspecies = true;

        oCustomTaxonInputData.newCustomTaxon = false;
        oCustomTaxonInputData.customRankNone = true;
        oCustomTaxonInputData.customRankSubspecies = false;
        oCustomTaxonInputData.customRankVariety = false;
        oCustomTaxonInputData.customRankForma = false;
        oCustomTaxonInputData.customInfraspecies = undefined;
        oCustomTaxonInputData.cultivar = undefined;
        oCustomTaxonInputData.customSuffix = undefined;
        oCustomTaxonInputData.affinis = undefined;
        oCustomTaxonInputModel.updateBindings(false);
        return oCustomTaxonInputModel;
    }

	onButtonFindSpecies(oEvent: Input$SubmitEvent) {
		// when hitting search, trigger a backend call to retrieve species matching the search pattern
        const oSearchSpeciesInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('searchSpeciesInput');
        const oSearchSpeciesInputData = <LSearchSpeciesInputData>oSearchSpeciesInputModel.getData();
		const sTaxonNamePattern = oSearchSpeciesInputData.searchPattern.trim();
		const bIncludeExternalApis = oSearchSpeciesInputData.includeExternalApis;
		const bSearchForGenusNotSpecies = oSearchSpeciesInputData.genusNotSpecies;

		const oModelKewSearchResults = <JSONModel>this._oSearchSpeciesDialog.getModel('kewSearchResults');
		new SpeciesFinder(oModelKewSearchResults).searchSpecies(sTaxonNamePattern, bIncludeExternalApis, bSearchForGenusNotSpecies);
	}

	public onAssignTaxon(oEvent: Button$PressEvent): void {
		// when user chooses a species from the search results, trigger a backend call to retrieve additional information on
		// that species and assign it to the current plant
        if (!this._oSelectedListItemBindingContext){
            MessageToast.show('Please select a species from the list');
            return;
        }

		const cbReceivingAdditionalSpeciesInformation: LAjaxLoadDetailsForSpeciesDoneCallback = (
			data: BCreatedTaxonResponse, sStatus: ResponseStatus, oResponse: JQueryXHR) => {
			Util.stopBusyDialog();
			MessageToast.show(data.message.message);
			MessageHandler.getInstance().addMessageFromBackend(data.message);
			this._oSearchSpeciesDialog.close();
			this._oTaxonToPlantAssigner.assignTaxonToPlant(this._oPlant, data.new_taxon, data.new_taxon.name);

			// bind received taxon to view (otherwise applied upon switching plant in detail view)
            // todo that's super ugly
			this._oView.bindElement({
				path: "/TaxaDict/" + data.new_taxon.id,
				model: "taxon"
			});
		}
		const oSelectedSearchResult = <BKewSearchResultEntry>this._oSelectedListItemBindingContext.getObject();
        const oCustomTaxonInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('customTaxonInput');
        const oCustomTaxonInputData: SearchSpeciesCustomTaxonInputData = oCustomTaxonInputModel.getData()

		// const sCustomName = oSearchSpeciesInputData.customName ? oSearchSpeciesInputData.customName.trim() : '';
		const oModelKewSearchResults = <JSONModel>this._oSearchSpeciesDialog.getModel('kewSearchResults');
		new SpeciesFinder(oModelKewSearchResults).loadDetailsForSpecies(oSelectedSearchResult, oCustomTaxonInputData, cbReceivingAdditionalSpeciesInformation.bind(this));
	}

	public onFindSpeciesTableSelectedOrDataUpdated(oEvent: ListBase$SelectionChangeEvent):void {
		// depending on selected search result, the additional name input field is enabled or disabled and the preview custom name tag is updated
        if(!oEvent.getParameter('selected'))
            return

        const oSearchSpeciesInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('searchSpeciesInput');
        const oSearchSpeciesInputData = <LSearchSpeciesInputData>oSearchSpeciesInputModel.getData();
        const oSelectedSpeciesItem = <ColumnListItem>oEvent.getParameter('listItem');
        // we need to 'remember' the selected item for later use in the 'assign' button handler
        this._oSelectedListItemBindingContext = <Context>oSelectedSpeciesItem.getBindingContext('kewSearchResults');
        oSearchSpeciesInputData.resultSelected = true;
        oSearchSpeciesInputModel.updateBindings(false);

        const oSelectedSearchResult = <BKewSearchResultEntry>this._oSelectedListItemBindingContext!.getObject();
        oSearchSpeciesInputData.searchResultName = oSelectedSearchResult.name;
    
        // change custom name input field depending on selected search result
        this._resetCustomTaxonInput();
        if (oSelectedSearchResult.is_custom){
            // if search result is itself a custom name, we don't allow an additional suffix
            // but we show it's custom details as read-only
            // this._disableCustomName(oSelectedSearchResult);
            this._displayCustomDetailsReadOnly(oSelectedSearchResult);
        
        } else if (oSelectedSearchResult.rank == 'gen.' || oSelectedSearchResult.rank == 'spec.')
            // if search result is a genus or species, i.e. has no infraspecies rank, we allow for
            // setting a custom infraspecies rank and name
            this._allowFullCustomDetails();
            // this._setGenericSpecies(oSelectedSearchResult);
        else if (oSelectedSearchResult.rank == 'var.' || oSelectedSearchResult.rank == 'subsp.' || oSelectedSearchResult.rank == 'forma')
            // if search result has an infraspecies rank, we don't allow for setting a custom infraspecies rank and name
            this._allowCustomDetailsExceptInfraSpecies();
        else
            throw new Error('Invalid rank: ' + oSelectedSearchResult.rank);

	}

	public onFindSpeciesAdditionalNameLiveChange(oEvent: InputBase$ChangeEvent): void {
        const oSelectedSearchResult = <BKewSearchResultEntry>this._oSelectedListItemBindingContext!.getObject();
        const oCustomTaxonInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('customTaxonInput');
        const oCustomTaxonInputData: SearchSpeciesCustomTaxonInputData = oCustomTaxonInputModel.getData()

        const custom_rank = Util.extract_custom_rank(oCustomTaxonInputData);

        const oPayload: FBotanicalAttributes = {
            rank: oSelectedSearchResult.rank,
            genus: oSelectedSearchResult.genus,
            species: oSelectedSearchResult.species,
            infraspecies: oSelectedSearchResult.infraspecies,
            hybrid: oSelectedSearchResult.hybrid,
            hybridgenus: oSelectedSearchResult.hybridgenus,
            authors: oSelectedSearchResult.authors,
            name_published_in_year: oSelectedSearchResult.name_published_in_year,

            is_custom: oCustomTaxonInputData.newCustomTaxon,
            cultivar: oCustomTaxonInputData.cultivar,
            affinis: oCustomTaxonInputData.affinis,
            custom_rank: custom_rank,
            custom_infraspecies: oCustomTaxonInputData.customInfraspecies,
            custom_suffix: oCustomTaxonInputData.customSuffix
		};
		$.ajax({
			url: Util.getServiceUrl('taxa/botanical_name'),
			type: 'POST',
			contentType: "application/json",
			data: JSON.stringify(oPayload),
			context: this,
		})
			.done(this._onReceivingBotanicalName)
			.fail(ErrorHandling.onFail.bind(this, 'Create Botanical Name (POST)'));
	}

	private _onReceivingBotanicalName(data: BResultsGetBotanicalName, sStatus: ResponseStatus, oResponse: JQueryXHR): void {
		let oBotanicalNamePreviewModel = <JSONModel>this._oSearchSpeciesDialog.getModel('botanicalNamePreview');
        if (!oBotanicalNamePreviewModel)
            oBotanicalNamePreviewModel = new JSONModel();
            this._oSearchSpeciesDialog.setModel(oBotanicalNamePreviewModel, 'botanicalNamePreview');
        oBotanicalNamePreviewModel.setData(data);
	}
    
    private _displayCustomDetailsReadOnly(oSelectedSearchResult: BKewSearchResultEntry): void{
        const oCustomTaxonInputData: SearchSpeciesCustomTaxonInputData = {
            visible: true,
            editable: false,
            editableCustomInfraspecies: false,
            newCustomTaxon: false,

            customRankNone: (!oSelectedSearchResult.custom_rank),
            customRankSubspecies: (oSelectedSearchResult.custom_rank == 'subsp.'),
            customRankVariety: (oSelectedSearchResult.custom_rank == 'var.'),
            customRankForma: (oSelectedSearchResult.custom_rank == 'forma'),
            customInfraspecies: oSelectedSearchResult.custom_infraspecies,
            cultivar: oSelectedSearchResult.cultivar,
            customSuffix: oSelectedSearchResult.custom_suffix,
            affinis: oSelectedSearchResult.affinis,
        }

        const oCustomTaxonInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('customTaxonInput');
        oCustomTaxonInputModel.setData(oCustomTaxonInputData);
        oCustomTaxonInputModel.updateBindings(false);
    }

    private _allowFullCustomDetails(): void{
        this._resetCustomTaxonInput();

        const oCustomTaxonInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('customTaxonInput');
        const oCustomTaxonInputData: SearchSpeciesCustomTaxonInputData = oCustomTaxonInputModel.getData()
        
        oCustomTaxonInputData.visible = true,
        oCustomTaxonInputData.editable = true,
        oCustomTaxonInputData.editableCustomInfraspecies = true,

        oCustomTaxonInputModel.updateBindings(false);
    }

    private _allowCustomDetailsExceptInfraSpecies(): void{
        this._resetCustomTaxonInput();

        const oCustomTaxonInputModel = <JSONModel>this._oSearchSpeciesDialog.getModel('customTaxonInput');
        const oCustomTaxonInputData: SearchSpeciesCustomTaxonInputData = oCustomTaxonInputModel.getData()
        
        oCustomTaxonInputData.visible = true,
        oCustomTaxonInputData.editable = true,
        oCustomTaxonInputData.editableCustomInfraspecies = false,

        oCustomTaxonInputModel.updateBindings(false);
    }

	public onCancelSearchSpeciesDialog(oEvent: Button$PressEvent): void {
		this._oSearchSpeciesDialog.close();
	}
	public onCustomTaxonChange(oEvent: Switch$ChangeEvent): void {
        const oSwitch = <Switch>oEvent.getSource();
        const bState = oSwitch.getState();
		if (!bState)
            this._resetCustomTaxonInput();
	}

}