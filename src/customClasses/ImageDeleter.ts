import * as Util from "plants/ui/customClasses/Util";
import MessageBox from "sap/m/MessageBox";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { FImageDelete, FImagesToDelete } from "../definitions/Events";
import { LImageMap } from "../definitions/ImageLocal";
import { FBImage } from "../definitions/Images";
import { BConfirmation } from "../definitions/Messages";
import ModelsHelper from "../model/ModelsHelper";
import ChangeTracker from "./ChangeTracker";

/**
 * @namespace plants.ui.customClasses
 */
export default class ImageDeleter extends ManagedObject {

	private _oImagesModel: JSONModel;
	private _oUntaggedImagesModel: JSONModel;
	private fnOnAjaxSimpleSuccess: Function;
	private	_oImageRegistry: LImageMap;

	public constructor(
		oImagesModel: JSONModel, 
		oUntaggedImagesModel: JSONModel, 
		oImageRegistry: LImageMap,
		fnOnAjaxSimpleSuccess: Function) {

		super();
		this._oImagesModel = oImagesModel;
		this._oUntaggedImagesModel = oUntaggedImagesModel;
		this._oImageRegistry = oImageRegistry;
		this.fnOnAjaxSimpleSuccess = fnOnAjaxSimpleSuccess;  // todo find a better way to do this
	}	

	public askToDeleteImage(oImage: FBImage, bCompact: boolean): void {
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

	public askToDeleteMultipleImages(aImages: FBImage[], bCompact: boolean, cbResetSelection: Function): void{
		MessageBox.confirm(
			"Delete " + aImages.length + " images?", {
			title: "Delete",
			onClose: this._cbConfirmDelete.bind(this, aImages, cbResetSelection),
			actions: ['Delete', 'Cancel'],
			styleClass: bCompact ? "sapUiSizeCompact" : ""
		}
		);
	}

	private _cbConfirmDelete(aImages: FBImage[], cbCallback: Function | undefined, sAction: string) {
		if (sAction !== 'Delete') {
			return;
		}

		const oPayload = <FImagesToDelete>{
			images: aImages.map((oImage) => (<FImageDelete>{
				id: oImage.id,
				filename: oImage.filename
			}))
		};

		$.ajax({
			url: Util.getServiceUrl('images/'),
			type: 'DELETE',
			contentType: "application/json",
			data: JSON.stringify(oPayload),
			context: this
		})
			.done(this._onAjaxDeletedImagesSuccess.bind(this, aImages, cbCallback))
			.fail(ModelsHelper.getInstance().onReceiveErrorGeneric.bind(this, 'Image(s) (DELETE)'));
	}

	private _onAjaxDeletedImagesSuccess(aDeletedImages: FBImage[], cbCallback: Function | undefined, data: BConfirmation, textStats: any, jqXHR: any): void {
		//show default success message after successfully deleting image in backend (either from untagged or detail view)
		this.fnOnAjaxSimpleSuccess(data, textStats, jqXHR);  // todo find a better way to do this

		// delete image in models...
		var aDataImages = <FBImage[]>this._oImagesModel.getData().ImagesCollection;
		var aDataUntagged = <FBImage[]>this._oUntaggedImagesModel.getData().ImagesCollection;

		var that = this;  // for the closure
		aDeletedImages.forEach(function (image: FBImage) {

			var iPosImages = aDataImages.indexOf(image);
			if (iPosImages >= 0) {
				aDataImages.splice(iPosImages, 1);
			}

			var iPosImages = aDataUntagged.indexOf(image);
			if (iPosImages >= 0) {
				aDataUntagged.splice(iPosImages, 1);
			}

			//... and deleted image in images registry
			delete that._oImageRegistry[image.filename];  // todo create imageregistry class to handle this
			// delete that._oImageRegistryClone[image.filename]
			ChangeTracker.getInstance().removeOriginalImage(image.filename);

		});
		this._oImagesModel.refresh();
		this._oUntaggedImagesModel.refresh();

		if (!!cbCallback) {
			cbCallback();
		}
	}

}