import Util from "plants/ui/customClasses/shared/Util";
import MessageBox from "sap/m/MessageBox";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { ImageToDelete, DeleteImagesRequest } from "plants/ui/definitions/Events";
import { DeleteImagesResponse, ImageRead } from "plants/ui/definitions/Images";
import ChangeTracker from "plants/ui/customClasses/singleton/ChangeTracker";
import ImageRegistryHandler from "plants/ui/customClasses/singleton/ImageRegistryHandler";
import ModelsHelper from "plants/ui/model/ModelsHelper";

/**
 * @namespace plants.ui.customClasses.images
 */
export default class ImageDeleter extends ManagedObject {

	private _oImagesModel: JSONModel;
	private _oUntaggedImagesModel: JSONModel;

	public constructor(
		oImagesModel: JSONModel, 
		oUntaggedImagesModel: JSONModel) {

		super();
		this._oImagesModel = oImagesModel;
		this._oUntaggedImagesModel = oUntaggedImagesModel;
	}	

	public askToDeleteImage(oImage: ImageRead, bCompact: boolean): void {
		//ask to confirm deletion of image from detail or untagged view
		MessageBox.confirm(
			"Delete this image?", {
			title: "Delete",
			onClose: this._cbConfirmDelete.bind(this, [oImage], undefined),
			actions: ['Delete', 'Cancel'],
			styleClass: bCompact ? "sapUiSizeCompact" : ""
		}
		);
	}

	public askToDeleteMultipleImages(aImages: ImageRead[], bCompact: boolean, cbResetSelection: Function): void{
		MessageBox.confirm(
			"Delete " + aImages.length + " images?", {
			title: "Delete",
			onClose: this._cbConfirmDelete.bind(this, aImages, cbResetSelection),
			actions: ['Delete', 'Cancel'],
			styleClass: bCompact ? "sapUiSizeCompact" : ""
		}
		);
	}

	private async _cbConfirmDelete(aImages: ImageRead[], cbCallback: Function | undefined, sAction: string) {
		if (sAction !== 'Delete')
			return;

		const oPayload = <DeleteImagesRequest>{
			images: aImages.map((oImage) => (<ImageToDelete>{
				id: oImage.id,
			}))
		};

		const oResult: DeleteImagesResponse = await Util.delete_(Util.getServiceUrl('images/'), oPayload);

		ModelsHelper.onGenericSuccessWithMessage(oResult);
		this._deleteImagesInModels(aImages);
		if (!!cbCallback) {
			cbCallback();
		}

	}

	private _deleteImagesInModels(aDeletedImages: ImageRead[]): void {
		// delete image in models...
		var aDataImages = <ImageRead[]>this._oImagesModel.getData().ImagesCollection;
		var aDataUntagged = <ImageRead[]>this._oUntaggedImagesModel.getData().ImagesCollection;

		aDeletedImages.forEach(function (image: ImageRead) {

			var iPosImages = aDataImages.indexOf(image);
			if (iPosImages >= 0) {
				aDataImages.splice(iPosImages, 1);
			}

			var iPosImages = aDataUntagged.indexOf(image);
			if (iPosImages >= 0) {
				aDataUntagged.splice(iPosImages, 1);
			}

			//... and deleted image in images registry
			ImageRegistryHandler.getInstance().removeImageIdFromRegistry(image.id);
			ChangeTracker.getInstance().removeOriginalImage(image.id);

		});
		this._oImagesModel.refresh();
		this._oUntaggedImagesModel.refresh();		
		// make sure the number of untagged images in the top right corner is updated
		this._oUntaggedImagesModel.updateBindings(true);
	}

}