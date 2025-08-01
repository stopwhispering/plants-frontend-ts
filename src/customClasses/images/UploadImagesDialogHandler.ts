import Dialog, { Dialog$AfterCloseEvent } from "sap/m/Dialog";
import ManagedObject from "sap/ui/base/ManagedObject";
import Fragment from "sap/ui/core/Fragment";
import View from "sap/ui/core/mvc/View";
import Control from "sap/ui/core/Control";
import MultiInput from "sap/m/MultiInput";
import Token from "sap/m/Token";
import Util from "../shared/Util";
import FileUploader, { FileUploader$TypeMissmatchEvent, FileUploader$UploadCompleteEvent } from "sap/ui/unified/FileUploader";
import MessageToast from "sap/m/MessageToast";
import { ImageRead, UploadedImageMetadata } from "plants/ui/definitions/Images";
import MessageHandler from "../singleton/MessageHandler";
import { MessageType } from "sap/ui/core/library";
import ImageRegistryHandler from "../singleton/ImageRegistryHandler";
import ChangeTracker from "../singleton/ChangeTracker";
import UntaggedImagesHandler from "./UntaggedImagesHandler";
import JSONModel from "sap/ui/model/json/JSONModel";
import PlantLookup from "../plants/PlantLookup";
import { Button$PressEvent } from "sap/m/Button";
import DateFormat from "sap/ui/core/format/DateFormat";

/**
 * @namespace plants.ui.customClasses.images
 */
export default class UploadImagesDialogHandler extends ManagedObject {
// dialogUploadPhotos: "plants.ui.view.fragments.menu.UploadPhotos",
    private _oUploadImagesDialog: Dialog;
    private _oFileUploader: FileUploader;
    private _oImagesModel: JSONModel;
    private _oUntaggedImagesModel: JSONModel;
    private _iCurrentPlantId: int;
    private _oPlantLookup: PlantLookup;
    private _oMultiInputPlants: MultiInput;
    private _oMultiInputKeywords: MultiInput;
	private _oStatusModel: JSONModel;

    constructor(oImagesModel: JSONModel, oUntaggedImagesModel: JSONModel, oStatusModel: JSONModel,
        oPlantLookup: PlantLookup) {
        super();
        this._oImagesModel = oImagesModel;
        this._oUntaggedImagesModel = oUntaggedImagesModel;
		this._oStatusModel = oStatusModel;
        this._oPlantLookup = oPlantLookup;
    }

    public openUploadImagesDialog(oViewAttachTo: View, iCurrentPlantId: int): void {

        this._iCurrentPlantId = iCurrentPlantId;

        Fragment.load({
            name: "plants.ui.view.fragments.menu.UploadPhotos",
            id: oViewAttachTo.getId(),
            controller: this
        }).then((oControl: Control | Control[]) => {
            this._oUploadImagesDialog = <Dialog>oControl;
			oViewAttachTo.addDependent(this._oUploadImagesDialog);

			this._oFileUploader = <FileUploader>oViewAttachTo.byId("idPhotoUpload");
			this._oMultiInputPlants = <MultiInput>oViewAttachTo.byId('multiInputUploadImagePlants');
			this._oMultiInputKeywords = <MultiInput>oViewAttachTo.byId('multiInputUploadImageKeywords');

            // we need to manually add a validator here
            this._oMultiInputKeywords.addValidator(this._keywordValidator);            

            this._oUploadImagesDialog.open();

			this.updateLastImageUploadTimeStamp()
        });
    }

	private async updateLastImageUploadTimeStamp(){
		// const oResult = <SeedPlantingPlantNameProposal> await Util.get(Util.getServiceUrl('seed_plantings' + '/' + oSeedPlanting.id + '/plant_name_proposal'));
		const oResult = await Util.get(Util.getServiceUrl('images/last_image_upload_timestamp'));
		this._oStatusModel.setProperty('/lastImageUploadTimeStamp', oResult.timestamp);
		this._oStatusModel.setProperty('/lastImageUploadTimeStamp_tmp', "2025-07-19T05:04:07Z");  // todo remove, only for testing
	}

	private _keywordValidator(args: any){
		// validator function for Keywords MultiInput
		var text = args.text;
		return new Token({ key: text, text: text });
	}

	uploadPhotosToServer(oEvent: Button$PressEvent) {
		//triggered by upload-button in fragment after selecting files
		if (!this._oFileUploader.getValue()) {
			MessageToast.show("Choose a file first");
			return;
		}
		Util.startBusyDialog('Uploading...', 'Image File(s)');
		var sUrl = Util.getServiceUrl('images/');
		this._oFileUploader.setUploadUrl(sUrl);

		// the images may be tagged with plants already upon uploading
		var aSelectedTokens = this._oMultiInputPlants.getTokens();
		var aSelectedPlantIds = <int[]>[];
		if (aSelectedTokens.length > 0) {
			for (var i = 0; i < aSelectedTokens.length; i++) {
				aSelectedPlantIds.push(aSelectedTokens[i].getProperty('key'));
			}
		} 

		// same applies to tagging with keywords
		var aSelectedKeywordTokens = this._oMultiInputKeywords.getTokens();
		var aSelectedKeywords = <string[]>[];
		if (aSelectedKeywordTokens.length > 0) {
			for (i = 0; i < aSelectedKeywordTokens.length; i++) {
				aSelectedKeywords.push(aSelectedKeywordTokens[i].getProperty('key'));
			}
		} 

		var oAdditionalData = <UploadedImageMetadata>{
			'plants': aSelectedPlantIds,
			'keywords': aSelectedKeywords
		};
		// set even if empty (may be filled from earlier run)
		//the file uploader control can only send strings
		this._oFileUploader.setAdditionalData(JSON.stringify(oAdditionalData));
		this._oFileUploader.upload();
	}

	handleUploadComplete(oEvent: FileUploader$UploadCompleteEvent) {
		// handle message, show error if required
		// note: backend sends a UploadImagesResponse object, which we don't get from the FileUploader
		var sResponse = oEvent.getParameter('responseRaw');
		if (!sResponse) {
			var sMsg = "Upload complete, but can't determine status. No response received.";
			MessageHandler.getInstance().addMessage(MessageType.Warning, sMsg, undefined);
			Util.stopBusyDialog();
			return;
		}
		var oResponse = JSON.parse(sResponse);
		if (!oResponse) {
			sMsg = "Upload complete, but can't determine status. Can't parse Response.";
			MessageHandler.getInstance().addMessage(MessageType.Warning, sMsg, undefined);
			Util.stopBusyDialog();
			return;
		}

		MessageHandler.getInstance().addMessageFromBackend(oResponse.message);
		// add to images registry and refresh current plant's images
		if (oResponse.images.length > 0) {
			const aImages: ImageRead[] = oResponse.images;
			// ModelsHelper.getInstance().addToImagesRegistry(oResponse.images);
			const oImageRegistryHandler = ImageRegistryHandler.getInstance();
			oImageRegistryHandler.addImageToImagesRegistry(aImages);
			ChangeTracker.getInstance().addOriginalImages(aImages);

			// plant's images model and untagged images model might need to be refreshed
			// this.resetImagesCurrentPlant(this._currentPlantId);
			oImageRegistryHandler.resetImagesForPlant(this._iCurrentPlantId);
			this._oImagesModel.updateBindings(false);

			// this.resetUntaggedImages();
			// this.oComponent.resetUntaggedImages();
			new UntaggedImagesHandler(this._oUntaggedImagesModel).resetUntaggedImages();
			this._oUntaggedImagesModel.updateBindings(false);
		}

		Util.stopBusyDialog();
		MessageToast.show(oResponse.message.message);
		this._oUploadImagesDialog.close();
	}

	onIconPressAssignDetailsPlant(oEvent: Button$PressEvent) {
		// triggered by assign-to-current-plant button in image upload dialog
		// add current plant to plants multicombobox
		var plant = this._oPlantLookup.getPlantById(this._iCurrentPlantId);
		if (!plant) {
			return;
		}

		// add to multicombobox if not a duplicate
		if (!this._oMultiInputPlants.getTokens().find(ele => ele.getProperty('key') == plant.plant_name)) {
			var oPlantToken = new Token({
					key: (<int>plant.id).toString(),
					text: plant.plant_name
				});
            this._oMultiInputPlants.addToken(oPlantToken);
		}
	}

	onHandleTypeMissmatch(oEvent: FileUploader$TypeMissmatchEvent) {
		// handle file type missmatch for image upload
		// note: there's a same-nemed method in detail controller handling uploads there
		const oFileUpload = <FileUploader>oEvent.getSource();
		const sFiletype = oEvent.getParameter("fileType")

		var aFileTypes = oFileUpload.getFileType().map(ele => "*." + ele)
		var sSupportedFileTypes = aFileTypes.join(", ");
		MessageToast.show("The file type *." + sFiletype +
								" is not supported. Choose one of the following types: " +
								sSupportedFileTypes);		
	}

	onAfterCloseUploadPhotoseDialog(oEvent: Dialog$AfterCloseEvent) {
		this._oUploadImagesDialog.destroy();
	}
    
	onCancelUploadImagesDialog(oEvent: Button$PressEvent) {
		this._oUploadImagesDialog.close();
	}

	formatDateTime(sDate: Date): string {
		// Note: the preferred formatting option simply fails to work, for whatever reason; i tried very hard to get it working, don't ever try this again! just stick to the workaround!
		// text="{ 
		//     path: 'status>/lastImageUploadTimeStamp', 
		//     type: 'sap.ui.model.type.DateTime', 
		//     formatOptions: { timeZone: 'Europe/Berlin' } 
		//   }" 
		if (!sDate) return "";

		const oDate: Date = sDate instanceof Date ? sDate : new Date(sDate);
		
		// @ts-ignore
		const oDateFormat = DateFormat.getDateTimeInstance({  
			pattern: "yyyy-MM-dd HH:mm",
			timeZone: "Europe/Berlin"
		});

		return oDateFormat.format(oDate);

	}

}