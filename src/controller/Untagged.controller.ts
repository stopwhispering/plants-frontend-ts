import BaseController from "plants/ui/controller/BaseController"
import MessageBox from "sap/m/MessageBox"
import formatter from "plants/ui/model/formatter"
import ModelsHelper from "plants/ui/model/ModelsHelper"
import * as Util from "plants/ui/customClasses/Util";
import MessageToast from "sap/m/MessageToast"
import ImageEventHandlers from "plants/ui/customClasses/ImageEventHandlers";
import Event from "sap/ui/base/Event";
import Button from "sap/m/Button";
import { PImage, PImagePlantTag, PKeyword } from "../definitions/image_entities";
import JSONModel from "sap/ui/model/json/JSONModel";
import Input from "sap/m/Input";
import Token from "sap/m/Token";
import Navigation from "../customClasses/Navigation";
import Icon from "sap/ui/core/Icon";
import List from "sap/m/List";
import OverflowToolbarButton from "sap/m/OverflowToolbarButton";
import Tokenizer from "sap/m/Tokenizer";
import { PPlant } from "../definitions/plant_entities";

/**
 * @namespace plants.ui.controller
 */
export default class Untagged extends BaseController {

	formatter = new formatter();

	private imageEventHandlers: ImageEventHandlers;
	private _currentPlantId: int;

	ModelsHelper: ModelsHelper;

	onInit() {
		super.onInit();
		this.oRouter.getRoute("untagged").attachPatternMatched(this._onPatternMatched, this);
		this.imageEventHandlers = ImageEventHandlers.getInstance(this.applyToFragment.bind(this));
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

	handleClose() {
		var sNextLayout =  this.oComponent.getModel().getProperty("/actionButtonsInfo/endColumn/closeColumn");
		this.oRouter.navTo("detail", { layout: sNextLayout, plant_id: this._currentPlantId });
	}

	onPressReApplyUntaggedFilter() {
		//triggered by text button to manually filter for untagged images
		// this.resetUntaggedPhotos();
		this.oComponent.resetUntaggedPhotos();
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

	onSelectNone(oEvent: Event) {
		this._resetSelection(<List>this.byId('listImagesUntagged'));
	}

	private _resetSelection(oList: List) {
		oList.getItems().forEach(function (item) {
			item.setSelected(false);
		});
	}

	public onSelectAll(oEvent: Event) {
		(<List>this.byId('listImagesUntagged')).getItems().forEach(function (item) {
			item.setSelected(true);
		});
	}

	public onDeleteSelected(oEvent: Event) {
		//delete 1..n selected images
		const oList = <List>this.byId('listImagesUntagged');
		const aSelectedItems = oList.getSelectedItems();
		const aSelectedImages = <PImage[]> aSelectedItems.map(item => item.getBindingContext('untaggedImages')!.getObject())
		if (aSelectedItems.length == 0) {
			MessageToast.show("Nothing selected.");
			return;
		}

		var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
		MessageBox.confirm(
			"Delete " + aSelectedItems.length + " images?", {
			title: "Delete",
			onClose: this._confirmDeleteSelectedImages.bind(this, aSelectedImages),
			actions: ['Delete', 'Cancel'],
			styleClass: bCompact ? "sapUiSizeCompact" : ""
		}
		);
	}

	private _confirmDeleteSelectedImages(aSelectedImages: PImage[], sAction: string) {
		if (sAction !== 'Delete') {
			return;
		}

		$.ajax({
			url: Util.getServiceUrl('images/'),
			type: 'DELETE',
			contentType: "application/json",
			data: JSON.stringify({ 'images': aSelectedImages }),
			context: this
		})
			.done(this.onAjaxDeletedImagesSuccess.bind(this, aSelectedImages, this.onSelectNone.bind(this)))
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Images (DELETE)'));
	}

	// // // // // // // // // // // // // // // // // // // // // 
	// Image Event Handlers
	// // // // // // // // // // // // // // // // // // // // // 	
	public onAddDetailsPlantToUntaggedImage(oEvent: Event){
		//adds current plant in details view to the image in untagged view; triggered from "<-"" Button
		const oPlant = <PPlant>this.getPlantById(this._currentPlantId);
		const oBindingContextImage = (<Button> oEvent.getSource()).getParent().getBindingContext("untaggedImages");
		const oImage = <PImage>oBindingContextImage!.getObject();
		const oImagesModel = this.oComponent.getModel('images');
		this.imageEventHandlers.assignPlantToImage(oPlant, oImage, oImagesModel);

		(<JSONModel>this.getView().getModel('untaggedImages')).updateBindings(true);
		this.resetImagesCurrentPlant(this._currentPlantId);
	}

	onAddPlantNameToUntaggedImage(oEvent: Event) {
		//adds selected plant in input field (via suggestions) to an image (untagged view)
		//note: there's a same-named function in detail controller doing the same thing for non-untagged images
		const oSource = <Input>oEvent.getSource();
		const oImage = <PImage>oSource.getBindingContext("untaggedImages")!.getObject();
		const oSelectedSuggestion = oEvent.getParameter('selectedRow');
		const oSelectedPlant = <PPlant>oSelectedSuggestion.getBindingContext('plants').getObject();
		const oImagesModel = this.oComponent.getModel('images');
		this.imageEventHandlers.assignPlantToImage(oSelectedPlant, oImage, oImagesModel);

		(<JSONModel>this.getView().getModel('untaggedImages')).updateBindings(true);
		oSource.setValue('');
	}

	onPressImagePlantToken(oEvent: Event){
		//navigate to chosen plant in plant details view when clicking on plant token in untagged images view
		//note: there's a same-named function in detail controller doing the same thing for non-untagged images
		const oSource = <Token>oEvent.getSource();
		const oPlantTag = <PImagePlantTag>oSource.getBindingContext('untaggedImages')!.getObject();
		if (!oPlantTag.plant_id || oPlantTag.plant_id <= 0) throw new Error("Unexpected error: No Plant ID");
		
		//navigate to plant in layout's current column (i.e. middle column)
		Navigation.getInstance().navToPlant(this.getPlantById(oPlantTag.plant_id), this.oComponent);
	}
	
	onIconPressDeleteImage(oEvent: Event){
		//note: there's a same-named function in detail controller doing the same thing for non-untagged images
		const oSource = <Icon>oEvent.getSource();
		const oImage = <PImage>oSource.getBindingContext("untaggedImages")!.getObject()
		
		//confirm dialog
		var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
		MessageBox.confirm(
			"Delete this image?", {
				title: "Delete",
				onClose: this.confirmDeleteImage.bind(this, oImage),
				actions: ['Delete', 'Cancel'],
				styleClass: bCompact ? "sapUiSizeCompact" : ""
			}
		);
	}
	
	onInputImageNewKeywordSubmit(oEvent: Event){
		//note: there's a same-named function in detail controller doing the same thing for non-untagged images
		const oInput = <Input>oEvent.getSource();
		oInput.setValue('');

		// check not empty and new
		const sKeyword = oEvent.getParameter('value').trim();
		if (!sKeyword){
			return;
		}

		const oImage = <PImage> oInput.getParent().getBindingContext('untaggedImages')!.getObject();
		let aKeywords: PKeyword[] = oImage.keywords;
		if(aKeywords.find(ele=>ele.keyword === sKeyword)){
			MessageToast.show('Keyword already in list');
			return;
		}

		//add to current image keywords in untaggedImages model
		aKeywords.push(<PKeyword>{
			keyword: sKeyword
		});

		const oImagesModel = this.oComponent.getModel('untaggedImages');
		oImagesModel.updateBindings(false);
	}

	public onTokenizerTokenDelete(oEvent: Event){
		// triggered upon changes of image's plant assignments and image's keywords
		// note: the token itself has already been deleted; here, we only delete the 
		// 		 corresponding entry from the model
		//note: there's a same-named function in detail controller doing the same thing for non-untagged images
		if (oEvent.getParameter('type') !== 'removed')
			return;

		const sKey = oEvent.getParameter('token').getProperty('key');  //either plant name or keyword
		const oTokenizer = <Tokenizer> oEvent.getSource();
		const oImage = <PImage>oTokenizer.getParent()!.getBindingContext('untaggedImages')!.getObject();
		const oModel = this.oComponent.getModel('untaggedImages');
		const sType = oTokenizer.data('type'); // plant|keyword

		this.imageEventHandlers.removeTokenFromModel(sKey, oImage, oModel, sType);
	}
}