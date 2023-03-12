import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import { BConfirmation } from "../definitions/Messages";

/**
 * @namespace plants.ui.model
 */
export default class ModelsHelper extends ManagedObject {

	public static onGenericSuccessWithMessage(oConfirmation: BConfirmation, sStatus: string, oReturnData: object): void {
		//toast and create message
		//requires pre-defined message from backend
		MessageToast.show(oConfirmation.message.message);
		MessageHandler.getInstance().addMessageFromBackend(oConfirmation.message);
	}

}