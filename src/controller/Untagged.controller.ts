import BaseController from "plants/ui/controller/BaseController"
import formatter from "plants/ui/model/formatter"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import MessageToast from "sap/m/MessageToast"
import Event from "sap/ui/base/Event";
import Button from "sap/m/Button";
import { FBImage, FBImagePlantTag } from "../definitions/Images";
import JSONModel from "sap/ui/model/json/JSONModel";
import Input from "sap/m/Input";
import Token from "sap/m/Token";
import Navigation from "../customClasses/singleton/Navigation";
import Icon from "sap/ui/core/Icon";
import List from "sap/m/List";
import OverflowToolbarButton from "sap/m/OverflowToolbarButton";
import Tokenizer from "sap/m/Tokenizer";
import PlantLookup from "plants/ui/customClasses/plants/PlantLookup";
import { BPlant } from "../definitions/Plants";
import ImageRegistryHandler from "plants/ui/customClasses/singleton/ImageRegistryHandler";
import ImageDeleter from "../customClasses/images/ImageDeleter";
import UntaggedImagesHandler from "plants/ui/customClasses/images/UntaggedImagesHandler";
import ImageKeywordTagger from "plants/ui/customClasses/images/ImageKeywordTagger";
import ImagePlantTagger from "plants/ui/customClasses/images/ImagePlantTagger";

/**
 * @namespace plants.ui.controller
 */
export default class Untagged extends BaseController {

	formatter = new formatter();

	private oPlantLookup: PlantLookup;
	private _currentPlantId: int;

	ModelsHelper: ModelsHelper;

	onInit() {
		super.onInit();

		this.oRouter.getRoute("untagged").attachPatternMatched(this._onPatternMatched, this);
		
		this.oPlantLookup = new PlantLookup(this.oComponent.getModel('plants'));
		
		(this.oComponent.getModel('status')).setProperty('/untagged_selectable', false);
	}

	private _onPatternMatched(oEvent: Event) {
		// get current plant id
		this._currentPlantId = parseInt(oEvent.getParameter("arguments").plant_id || this._currentPlantId || "0");

		// this is called when closing untagged view as well
		if (oEvent.getParameter('name') !== 'untagged') {
			return;
		}
	}


	//////////////////////////////////////////////////////////
	// Other Handlers
	//////////////////////////////////////////////////////////
	onPressReApplyUntaggedFilter() {
		//triggered by text button to manually filter for untagged images
		// this.resetUntaggedImages();
		// this.oComponent.resetUntaggedImages();
		new UntaggedImagesHandler(this.oComponent.getModel('untaggedImages')).resetUntaggedImages();


	}

	//////////////////////////////////////////////////////////
	// Selection Handlers
	//////////////////////////////////////////////////////////
	public onSelectAll(oEvent: Event) {
		(<List>this.byId('listImagesUntagged')).getItems().forEach(function (item) {
			item.setSelected(true);
		});
	}

	onSelectNone(oEvent: Event) {
		this._resetSelection(<List>this.byId('listImagesUntagged'));
	}

	private _resetSelection(oList: List) {
		oList.getItems().forEach(function (item) {
			item.setSelected(false);
		});
	}

	onToggleSelectManyListMode(oEvent: Event) {
		const oSource = <OverflowToolbarButton>oEvent.getSource();
		const sCurrentType = oSource.getType();  // 'Transparent' or 'Emphasized'
		const oUntaggedList = <List>this.byId('listImagesUntagged');
		const oStatusModel = <JSONModel>this.getView().getModel('status');
		if (sCurrentType === 'Transparent') {
			// set multi-select mode
			oSource.setType('Emphasized');
			oUntaggedList.setMode('MultiSelect');
			// we need to save current mode to a model to allow access via expression binding
			oStatusModel.setProperty('/untagged_selectable', true);

		} else {
			// set default mode
			oSource.setType('Transparent');
			oUntaggedList.setMode('None');
			oStatusModel.setProperty('/untagged_selectable', false);
		}
	}

	public onDeleteSelected(oEvent: Event) {
		//delete 1..n selected images
		const oList = <List>this.byId('listImagesUntagged');
		const aSelectedItems = oList.getSelectedItems();
		const aSelectedImages = <FBImage[]> aSelectedItems.map(item => item.getBindingContext('untaggedImages')!.getObject())
		if (aSelectedItems.length == 0) {
			MessageToast.show("Nothing selected.");
			return;
		}

		const oImagesModel = this.oComponent.getModel('images');;
		const oUntaggedImagesModel = this.oComponent.getModel('untaggedImages');
		//todo use imageregistryhandler instaed in imagedeleter
		var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
		const oImageDeleter = new ImageDeleter(oImagesModel, oUntaggedImagesModel, this.onAjaxSimpleSuccess);
		oImageDeleter.askToDeleteMultipleImages(aSelectedImages, bCompact, this.onSelectNone.bind(this));
	}

	//////////////////////////////////////////////////////////
	// GUI Handlers
	//////////////////////////////////////////////////////////
	onHandleClose() {
		var sNextLayout =  this.oComponent.getModel().getProperty("/actionButtonsInfo/endColumn/closeColumn");
		this.oRouter.navTo("detail", { layout: sNextLayout, plant_id: this._currentPlantId });
	}

	//////////////////////////////////////////////////////////
	// Image Event Handlers
	//////////////////////////////////////////////////////////
	public onAddDetailsPlantToUntaggedImage(oEvent: Event){
		//adds current plant in details view to the image in untagged view; triggered from "<-"" Button
		const oPlant = <BPlant>this.oPlantLookup.getPlantById(this._currentPlantId);
		const oBindingContextImage = (<Button> oEvent.getSource()).getParent().getBindingContext("untaggedImages");
		const oImage = <FBImage>oBindingContextImage!.getObject();
		const oImagesModel = this.oComponent.getModel('images');  // "images", not "untaggedImages"
		// this.imageEventHandlers.assignPlantToImage(oPlant, oImage, oImagesModel);
		new ImagePlantTagger(oImagesModel).addPlantToImage(oPlant, oImage);

		(<JSONModel>this.getView().getModel('untaggedImages')).updateBindings(true);
		// this.resetImagesCurrentPlant(this._currentPlantId);
		ImageRegistryHandler.getInstance().resetImagesForPlant(this._currentPlantId);
	}

	onAddPlantNameToUntaggedImage(oEvent: Event) {
		//adds selected plant in input field (via suggestions) to an image (untagged view)
		//note: there's a same-named function in detail controller doing the same thing for non-untagged images
		const oSource = <Input>oEvent.getSource();
		const oImage = <FBImage>oSource.getBindingContext("untaggedImages")!.getObject();
		const oSelectedSuggestion = oEvent.getParameter('selectedRow');
		const oSelectedPlant = <BPlant>oSelectedSuggestion.getBindingContext('plants').getObject();
		const oImagesModel = this.oComponent.getModel('images');  // "images", not "untaggedImages"
		// this.imageEventHandlers.assignPlantToImage(oSelectedPlant, oImage, oImagesModel);
		new ImagePlantTagger(oImagesModel).addPlantToImage(oSelectedPlant, oImage);

		(<JSONModel>this.getView().getModel('untaggedImages')).updateBindings(true);
		oSource.setValue('');
	}

	onPressImagePlantToken(oEvent: Event){
		//navigate to chosen plant in plant details view when clicking on plant token in untagged images view
		//note: there's a same-named function in detail controller doing the same thing for non-untagged images
		const oSource = <Token>oEvent.getSource();
		const oPlantTag = <FBImagePlantTag>oSource.getBindingContext('untaggedImages')!.getObject();
		if (!oPlantTag.plant_id || oPlantTag.plant_id <= 0) throw new Error("Unexpected error: No Plant ID");
		
		//navigate to plant in layout's current column (i.e. middle column)
		Navigation.getInstance().navToPlant(this.oPlantLookup.getPlantById(oPlantTag.plant_id));
	}
	
	onIconPressDeleteImage(oEvent: Event){
		//note: there's a same-named function in detail controller doing the same thing for non-untagged images
		const oSource = <Icon>oEvent.getSource();
		const oImage = <FBImage>oSource.getBindingContext("untaggedImages")!.getObject()
		var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

		const oImagesModel = this.oComponent.getModel('images');;
		const oUntaggedImagesModel = this.oComponent.getModel('untaggedImages');
		//todo use imageregistryhandler instaed in imagedeleter
		const oImageDeleter = new ImageDeleter(oImagesModel, oUntaggedImagesModel, this.onAjaxSimpleSuccess);
		oImageDeleter.askToDeleteImage(oImage, bCompact);
	}
	
	onInputImageNewKeywordSubmit(oEvent: Event){
		//note: there's a same-named function in detail controller doing the same thing for non-untagged images
		const oInput = <Input>oEvent.getSource();
		oInput.setValue('');
		const sKeyword = oEvent.getParameter('value').trim();
		const oImage = <FBImage> oInput.getParent().getBindingContext('untaggedImages')!.getObject();
		new ImageKeywordTagger(this.oComponent.getModel('untaggedImages')).addKeywordToImage(sKeyword, oImage);
	}

	onTokenizerKeywordImageTokenDelete(oEvent: Event){
		// note: the token itself has already been deleted; here, we only delete the 
		// 		 corresponding plant-to-image entry from the model
		//note: there's a same-named function in details controller doing the same thing for already tagged images
		
		// we get the token from the event parameters
		const aTokens = <Token[]>oEvent.getParameter('tokens');
		if (aTokens.length > 1) throw new Error("Unexpected error: More than one token to be deleted at once");
		const oToken = <Token>aTokens[0];
		const sKeywordTokenKey = oToken.getKey();

		// the event's source is the tokenizer
		const oTokenizer = <Tokenizer> oEvent.getSource();
		const oImage = <FBImage>oTokenizer.getBindingContext('untaggedImages')!.getObject();
		
		// const oImagesModel = this.oComponent.getModel('untaggedImages');
		// this.imageEventHandlers.removeKeywordImageTokenFromModel(sKeywordTokenKey, oImage, oImagesModel);
		new ImageKeywordTagger(this.oComponent.getModel('untaggedImages')).removeKeywordFromImage(sKeywordTokenKey, oImage);
	}

	onTokenizerPlantImageTokenDelete(oEvent: Event){
		// note: the token itself has already been deleted; here, we only delete the 
		// 		 corresponding keyword-to-image entry from the model
		//note: there's a same-named function in details controller doing the same thing for already tagged images
		
		// we get the token from the event parameters
		const aTokens = <Token[]>oEvent.getParameter('tokens');
		if (aTokens.length > 1) throw new Error("Unexpected error: More than one token to be deleted at once");
		const oToken = <Token>aTokens[0];
		const sPlantTokenKey = oToken.getKey();

		// the event's source is the tokenizer
		const oTokenizer = <Tokenizer> oEvent.getSource();
		const oImage = <FBImage>oTokenizer.getBindingContext('untaggedImages')!.getObject();
		
		// const oImagesModel = this.oComponent.getModel('untaggedImages');
		// this.imageEventHandlers.removePlantImageTokenFromModel(sPlantTokenKey, oImage, oImagesModel);
		new ImagePlantTagger(this.oComponent.getModel('untaggedImages')).removePlantFromImage(sPlantTokenKey, oImage);
	}	
}