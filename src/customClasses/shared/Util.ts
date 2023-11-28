//static utility functions
import BusyDialog from "sap/m/BusyDialog"
import Constants from "plants/ui/Constants"
import { AnyDict, StringToNumberMap } from "plants/ui/definitions/SharedLocal";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import { SearchSpeciesCustomTaxonInputData } from "plants/ui/definitions/PlantsLocal";

/**
 * @namespace plants.ui.customClasses.shared
 */
export default class Util extends ManagedObject {


	private async http<T>(
		request: RequestInfo
	): Promise<Response> {
		let response: Response;
		try {
			response = await fetch(
				request
			);
		} catch (error) {
			// unexpected python error
			// e.g. 500 division by zero; no further information available
			console.log(error)
			let sMsg = JSON.stringify(error);
			MessageToast.show(sMsg);
			throw error;
		}

		if (!response.ok) {
			// todo use ErrorHandling.onFail()
			
			const err_body = await response.json();
			let sMsg: string;

			// pydantic validation error
			if (err_body.detail && Array.isArray(err_body.detail))
				sMsg = JSON.stringify(err_body.detail);

			// starlette httperror 
			// raise e.g. via raise HTTPException(status_code=404, detail="Item not found") or subclasses
			else if (err_body.detail && typeof err_body.detail === "string")
				sMsg = err_body.detail;
			
			else
				sMsg = JSON.stringify(err_body);

			console.log(err_body);
			MessageToast.show(sMsg);
			throw new Error(sMsg);
		}
		return await response.json();
	}

	public static async get<T>(
		path: string,
		args: RequestInit = { method: "GET" }
	): Promise<any> {
		return await Util.prototype.http<T>(new Request(path, args));
	}

	public static async delete_<T>(
		path: string,
		body?: any,
		args: RequestInit = { method: "DELETE", body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
	): Promise<any> {
		return await Util.prototype.http<T>(new Request(path, args));
	}

	public static parse_resource_from_url(sUrl: string) {
		var aItems = sUrl.split('/');
		var iIndex = aItems.indexOf('backend');
		var aResource = aItems.slice(iIndex + 1);
		return aResource.join('/');
	}

	public static getServiceUrl(sUrl: string) {
		return Constants.base_url + sUrl;
	}

	public static getImageIdUrl(image_id: int, size_type?: string, width?: float, height?: float) {
		if (!size_type) {
			var path = 'image/' + image_id.toString();
		} else if (size_type !== 'rem' && size_type != 'px') {
			console.log('Bad size type: ' + size_type);
			return undefined;
		} else {
			var width_px = (size_type === 'px') ? width : Math.round(width! * 16);
			var height_px = (size_type === 'px') ? height : Math.round(height! * 16);
			path = 'image/' + image_id.toString() + '?width=' + width_px + '&height=' + height_px;
		}

		return this.getServiceUrl(path);
	}

	public static getClonedObject(oOriginal: any) {
		// create a clone, not a reference
		// there's no better way in js...
		return JSON.parse(JSON.stringify(oOriginal));
	}

	public static startBusyDialog(title?: string, text?: string) {
		var oBusyDialog4 = <BusyDialog>(sap.ui.getCore().byId("busy4")) ? sap.ui.getCore().byId("busy4") : new BusyDialog('busy4', {
			text: text,
			title: title,
			// busyIndicatorDelay: 500
		});
		//@ts-ignore
		<BusyDialog>oBusyDialog4!.open();
	}

	public static stopBusyDialog() {
		var oBusyDialog4 = <BusyDialog>sap.ui.getCore().byId("busy4");
		if (oBusyDialog4) {
			oBusyDialog4.close();
		}
	}

	public static getToday(): string {
		const today = new Date();
		const dd = String(today.getDate()).padStart(2, '0');
		const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
		const yyyy = today.getFullYear();
		const today_s = yyyy + '-' + mm + '-' + dd;
		return today_s;
	}

	public static assertCorrectDate(sdate: string): void {
		// validate date via regex (must match "YYYY-MM-DD")
		if (!/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/.test(sdate)) {
			MessageToast.show('Invalid date. Date must have Format "YYYY-MM-DD"');
			throw new Error('Invalid date. Date must have Format "YYYY-MM-DD"');
		}
	}

	public static formatDate(date: Date): string {
		//var today = new Date();
		var dd = date.getDate().toString();
		var mm = (date.getMonth() + 1).toString(); //January is 0!

		var yyyy = date.getFullYear();
		if (Number(dd) < 10) {
			dd = '0' + dd;
		}
		if (Number(mm) < 10) {
			mm = '0' + mm;
		}
		var date_str = yyyy + '-' + mm + '-' + dd;
		return date_str;
	}

	public static getDaysFromToday(sDate: string): int {
		// input format: yyyy-mm-dd (as string)
		var iDate: int = Date.parse(sDate);  // returns number of milliseconds since January 1, 1970, 00:00:00 UTC
		var iToday: int = new Date().getTime();  // same here
		var iDay: int = 1000 * 60 * 60 * 24;  // milliseconds in a day
		var iDiff: int = iToday - iDate;
		return Math.round(iDiff / iDay);
	}

	public static objectsEqualManually(dict1: any, dict2: any) {
		var dict1_copy = this.getClonedObject(dict1);
		var dict2_copy = this.getClonedObject(dict2);

		// array
		// loop at array objects and check if equal
		if (Array.isArray(dict1_copy) && Array.isArray(dict2_copy)) {
			dict1_copy.sort();
			dict2_copy.sort();
			if (dict1_copy.length !== dict2_copy.length) {
				return false;
			}
			for (var i = 0; i < dict1_copy.length; i++) {
				if (!this.objectsEqualManually.call(this, dict1_copy[i], dict2_copy[i])) {
					return false;
				}
			}
			return true;
		}

		// objects
		// easy case: differing properties
		var keys1 = Object.keys(dict1_copy);
		keys1.sort();
		var keys2 = Object.keys(dict2_copy);
		keys2.sort();
		if (JSON.stringify(keys1) !== JSON.stringify(keys2)) {
			return false;
		}

		// compare object property values
		for (var j = 0; j < keys1.length; j++) {
			var key = keys1[j];
			if (this._isObject(dict1_copy[key]) && this._isObject(dict2_copy[key])) {
				if (!this.objectsEqualManually.call(this, dict1_copy[key], dict2_copy[key])) {
					return false;
				}
			} else if (this._isObject(dict1_copy[key]) || this._isObject(dict2_copy[key])) {
				return false;
			} else {
				// primitives
				if (dict1_copy[key] !== dict2_copy[key]) {
					return false;
				}
			}
		}
		return true;
	}

	private static _isObject(val: any) {
		if (val === null) { return false; }
		return ((typeof val === 'function') || (typeof val === 'object'));
	}

	public static dictsAreEqual(dict1: AnyDict, dict2: AnyDict) {
		return JSON.stringify(dict1) === JSON.stringify(dict2);
	}


	// public static isDictKeyInArray(dict: AnyDict, aDicts: AnyDict[]) {
	// 	var oFound = aDicts.find(function (element: AnyDict) {
	// 		return element.key === dict.key;
	// 	});
	// 	if (!!oFound) {
	// 		return true;
	// 	} else {
	// 		return false;
	// 	}
	// }

	public static romanize(num: number) {
		if (isNaN(num))
			return NaN;
		var digits = String(+num).split(""),
			key = ["", "C", "CC", "CCC", "CD", "D", "DC", "DCC", "DCCC", "CM",
				"", "X", "XX", "XXX", "XL", "L", "LX", "LXX", "LXXX", "XC",
				"", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"],
			roman = "",
			i = 3;
		while (i--)
			roman = (key[+digits.pop()! + (i * 10)] || "") + roman;
		return Array(+digits.join("") + 1).join("M") + roman;
	}

	public static arabize(romanNum: string) {
		const roman = <StringToNumberMap>{ I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
		let num = 0;
		for (let i = 0; i < romanNum.length; i++) {
			const currArab = <string>romanNum[i];
			const curr = roman[currArab];
			const next = roman[romanNum[i + 1]];
			(curr < next) ? (num -= curr) : (num += curr);
		}
		return num;
	}

	public static extract_custom_rank(oCustomTaxonInputData: SearchSpeciesCustomTaxonInputData): string|undefined{
		let custom_rank;
        if (oCustomTaxonInputData.customRankNone)
            return undefined;
        else if (oCustomTaxonInputData.customRankVariety)
			return 'var.';
        else if (oCustomTaxonInputData.customRankSubspecies)
			return 'subsp.';
        else if (oCustomTaxonInputData.customRankForma)
			return 'forma';
        else
            throw new Error('Invalid custom rank')
	}

	public static shorten_plant_name_for_tag(sName: string): string {
		if (!sName) {
			return '';
		} else if (sName.length <= Constants.LENGTH_SHORTENED_PLANT_NAME_FOR_TAG) {
			return sName;
		} else {
			return sName.slice(0, Constants.LENGTH_SHORTENED_PLANT_NAME_FOR_TAG - 3) + '...';
		}
	}
}
