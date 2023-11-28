import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject"
import JSONModel from "sap/ui/model/json/JSONModel";
import { ImageRead, Keyword } from "plants/ui/definitions/Images";

/**
 * @namespace plants.ui.customClasses.images
 */
export default class ImageKeywordTagger extends ManagedObject {
	private _oAnyImageModel: JSONModel;

	public constructor(oAnyImageModel: JSONModel) {
		// supply either images model or untaggedImages model
		super();
		this._oAnyImageModel = oAnyImageModel;
	}

	public addKeywordToImage(sKeyword: string, oImage: ImageRead): void {
		let aKeywords: Keyword[] = oImage.keywords;
		if (aKeywords.find(ele => ele.keyword === sKeyword)) {
			MessageToast.show('Keyword already in list');
			return;
		}

		//add to current image keywords in images model
		aKeywords.push(<Keyword>{
			keyword: sKeyword
		});
		this._oAnyImageModel.updateBindings(false);
	}

	public removeKeywordFromImage(sKeyword: string, oImage: ImageRead){
		// find keyword in the image's corresponding array and delete
		// triggered upon changes of image's keywords assignments
		// either in untagged view or in detail view ==> oModel can be either images or untagged_images model		
		const aKeywordTags = <Keyword[]>oImage.keywords;
		const iIndex: int = aKeywordTags.findIndex(ele=>ele.keyword === sKeyword);
		if (iIndex < 0) throw new Error("Keyword not found in image's keywords tags.");
		aKeywordTags.splice(iIndex, 1);
		this._oAnyImageModel.updateBindings(false);
	}	
}