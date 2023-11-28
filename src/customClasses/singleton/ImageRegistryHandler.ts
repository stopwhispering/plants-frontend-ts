import Util from "plants/ui/customClasses/shared/Util";
import JSONModel from "sap/ui/model/json/JSONModel"
import ManagedObject from "sap/ui/base/ManagedObject"
import { ImageRead } from "plants/ui/definitions/Images";
import { LImageIdMap } from "plants/ui/definitions/ImageLocal";

/**
 * @namespace plants.ui.customClasses.singleton
 */
// export default class ImageRegistryHandler extends ManagedObject {
export default class ImageRegistryHandler extends ManagedObject {

	private static _instance: ImageRegistryHandler;
	private _oImagesModel: JSONModel;
	private _oImageIdRegistry: LImageIdMap;
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
		
		this._oImageIdRegistry = <LImageIdMap>{};
		this._oSetImagesPlantsLoaded = <Set<int>>new Set();
	}

	public resetImagesForPlant(iPlantId: int): void {
		// reset data in images model to image data in image registy for supplied plant
		// @ts-ignore // typescript doesn't like Object.entries
		const aImagesArr = <[string, ImageRead][]>Object.entries(this._oImageIdRegistry).filter(t => (t[1].plants.filter(p => p.plant_id === iPlantId)).length == 1);
		var aImages = <ImageRead[]>aImagesArr.map(p => p[1]);
		this._oImagesModel.setProperty('/ImagesCollection', aImages);
		Util.stopBusyDialog(); // had been started in details onPatternMatched
	}

	public resetImageRegistry(): void {
		this._oImageIdRegistry = {};
	}

	public addImageToImagesRegistry(aImages: ImageRead[]) {
		// add photos loaded for a plant to the registry if not already loaded with other plant
		// note: to avoid cross dependency, we don't add a copy of the photo to a clone registry
		//       caller needs to do that separately 
		aImages.forEach(oImage => {
			if (!(this.isImageIdInRegistry(oImage.id))) {
				this._oImageIdRegistry[oImage.id] = oImage;
			}
		});
	}

	public addImageToRegistry(oImage: ImageRead): void {
		this._oImageIdRegistry[oImage.id] = oImage;
	}	

	public removeImageIdFromRegistry(iImageId: int): void {
		delete this._oImageIdRegistry[iImageId];
	}

	public getIdsInImageRegistry(): int[] {
		const sKeys = Object.keys(this._oImageIdRegistry);
		return sKeys.map(s => parseInt(s));
	}

	public getImageInRegistryById(iImageId: int): ImageRead {
		return this._oImageIdRegistry[iImageId];
	}

	public getImageIdRegistry(): LImageIdMap {
		return this._oImageIdRegistry;
	}

	public isImageIdInRegistry(iImageId: int): boolean {
		return iImageId in this._oImageIdRegistry;
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