import * as Util from "plants/ui/customClasses/Util";
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import { FBImage } from "../definitions/Images";
import { LImageMap } from "../definitions/ImageLocal";
import ChangeTracker from "./ChangeTracker";

/**
 * @namespace plants.ui.customClasses
 */
// export default class ImageRegistryHandler extends ManagedObject {
export default class ImageRegistryHandler extends ManagedObject {

	private static _instance: ImageRegistryHandler;
	private _oImagesModel: JSONModel;
	private _oImageRegistry: LImageMap;

	public static createInstance(oImagesModel: JSONModel, oImageRegistry: LImageMap): void {
		if (ImageRegistryHandler._instance)
			throw new Error('ImageRegistryHandler instance already created');
		ImageRegistryHandler._instance = new ImageRegistryHandler(oImagesModel, oImageRegistry);
	}

	public static getInstance(): ImageRegistryHandler {
		if (!ImageRegistryHandler._instance) {
			throw new Error('ImageRegistryHandler instance not created yet');
		}
		return ImageRegistryHandler._instance;
	}

	private constructor(oImagesModel: JSONModel, oImageRegistry: LImageMap) {
		super();
		this._oImagesModel = oImagesModel;
		this._oImageRegistry = oImageRegistry;
	}

	public resetImagesCurrentPlant(iPlantId: int): void {
		// todo rename to resetImagesForPlant
		// @ts-ignore // typescript doesn't like Object.entries
		const aPhotosArr = <[string, FBImage][]>Object.entries(this._oImageRegistry).filter(t => (t[1].plants.filter(p => p.plant_id === iPlantId)).length == 1);
		var aPhotos = <FBImage[]>aPhotosArr.map(p => p[1]);
		this._oImagesModel.setProperty('/ImagesCollection', aPhotos);
		Util.stopBusyDialog(); // had been started in details onPatternMatched
	}

	public addPhotosToRegistry(aPhotos: FBImage[]) {
		///////////////TODOOOOOOOOo why is there a method with same name in the component????///////////7
		// add photos loaded for a plant to the registry if not already loaded with other plant
		// plus add a copy of the photo to a clone registry for getting changed photos when saving 
		const oChangeTracker = ChangeTracker.getInstance();
		aPhotos.forEach((photo: FBImage) => {
			if (!(photo.filename in this._oImageRegistry)) {
				this._oImageRegistry[photo.filename] = photo;
				// this._oImageRegistryClone[photo.filename] = Util.getClonedObject(photo);
				oChangeTracker.addOriginalImage(photo);
			}
		});
	}
}