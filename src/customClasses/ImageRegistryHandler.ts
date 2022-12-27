import * as Util from "plants/ui/customClasses/Util";
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import { FBImage } from "../definitions/Images";
import { LImageMap } from "../definitions/ImageLocal";

/**
 * @namespace plants.ui.customClasses
 */
// export default class ImageRegistryHandler extends ManagedObject {
export default class ImageRegistryHandler extends ManagedObject {

	private static _instance: ImageRegistryHandler;
	private _oImagesModel: JSONModel;
	private _oImageRegistry: LImageMap;
	private _oSetImagesPlantsLoaded: Set<int>  // plant id's for which images have been loaded

	public static createInstance(oImagesModel: JSONModel): void {
		if (ImageRegistryHandler._instance)
			throw new Error('ImageRegistryHandler instance already created');
		ImageRegistryHandler._instance = new ImageRegistryHandler(oImagesModel);
	}

	public static getInstance(): ImageRegistryHandler {
		if (!ImageRegistryHandler._instance) {
			throw new Error('ImageRegistryHandler instance not created yet');
		}
		return ImageRegistryHandler._instance;
	}

	private constructor(oImagesModel: JSONModel) {
		super();
		this._oImagesModel = oImagesModel;
		
		this._oImageRegistry = <LImageMap>{};
		this._oSetImagesPlantsLoaded = <Set<int>>new Set();
	}

	public resetImagesForPlant(iPlantId: int): void {
		// reset data in images model to image data in image registy for supplied plant
		// @ts-ignore // typescript doesn't like Object.entries
		const aPhotosArr = <[string, FBImage][]>Object.entries(this._oImageRegistry).filter(t => (t[1].plants.filter(p => p.plant_id === iPlantId)).length == 1);
		var aPhotos = <FBImage[]>aPhotosArr.map(p => p[1]);
		this._oImagesModel.setProperty('/ImagesCollection', aPhotos);
		Util.stopBusyDialog(); // had been started in details onPatternMatched
	}

	public resetImageRegistry(): void {
		// Object.keys(this._component.imagesRegistry).forEach(key => delete this._component.imagesRegistry[key]);
		this._oImageRegistry = {};
	}

	public addImageToImagesRegistry(aImages: FBImage[]) {
		// add photos loaded for a plant to the registry if not already loaded with other plant
		// note: to avoid cross dependency, we don't add a copy of the photo to a clone registry
		//       caller needs to do that separately 
		aImages.forEach(oImage => {
			if (!(this.isImageInRegistry(oImage.filename))) {
				this._oImageRegistry[oImage.filename] = oImage;
			}
		});
	}

	public addImageToRegistry(oImage: FBImage): void {
		this._oImageRegistry[oImage.filename] = oImage;
	}	

	public removeImageFromRegistry(sFilename: string): void {
		delete this._oImageRegistry[sFilename];
	}

	public getFilenamesInImageRegistry(): string[] {
		return Object.keys(this._oImageRegistry);
	}

	public tempGetImagesRegistry(): LImageMap {
		//TODO REMOVE THIS WHEN CODE IS UNDERSTOOD!
		return this._oImageRegistry;
	}


	public getImageInRegistry(sFilename: string): FBImage {
		return this._oImageRegistry[sFilename];
	}

	public getImageRegistry(): LImageMap {
		return this._oImageRegistry;
	}

	public isImageInRegistry(sFilename: string): boolean {
		return sFilename in this._oImageRegistry;
	}

	public resetPlantsWithImagesLoaded(): void {
		this._oSetImagesPlantsLoaded.clear();
	}

	public addPlantToPlantsWithImagesLoaded(iPlantId: int): void {
		this._oSetImagesPlantsLoaded.add(iPlantId);
	}

	public isPlantInPlantsWithImagesLoaded(iPlantId: int): boolean { 
		return this._oSetImagesPlantsLoaded.has(iPlantId);
	}

}