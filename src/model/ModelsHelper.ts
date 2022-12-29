import MessageHandler from "plants/ui/customClasses/singleton/MessageHandler";
import Util from "plants/ui/customClasses/shared/Util";
import MessageToast from "sap/m/MessageToast";
import ManagedObject from "sap/ui/base/ManagedObject";
import { MessageType } from "sap/ui/core/library";
import Event from "sap/ui/base/Event";
import { BConfirmation } from "../definitions/Messages";

/**
 * @namespace plants.ui.model
 */
export default class ModelsHelper extends ManagedObject {

	public static onReceiveErrorGeneric(sCaller: string, error: JQueryXHR, sTypeOfError: null|"timeout"|"error"|"abort"|"parsererror", oExceptionObject?: any): void {
		//trying to catch different kinds of error callback returns
		//always declare similar to: .fail(this.ModelsHelper.getInstance()._onReceiveErrorGeneric.bind(thisOrOtherContext,'EventsResource'));
		Util.stopBusyDialog();

		//fastapi manually thrown exceptions (default)
		if ((!!error) && (!!error.responseJSON) && (!!error.responseJSON.detail) && (!!error.responseJSON.detail.type)) {
			MessageHandler.getInstance().addMessageFromBackend(error.responseJSON.detail);
			MessageToast.show(error.responseJSON.detail.type + ': ' + error.responseJSON.detail.message);
			return;
		};

		//server not reachable
		const oErrorEvent: Event = <unknown>error as Event;
		if (!!oErrorEvent.getParameter && oErrorEvent.getParameter('message')){
			const sMsg = 'Error at ' + sCaller + ' - Could not reach Server (Error: ' + error.status + ' ' + error.statusText + ')'
			MessageHandler.getInstance().addMessage(MessageType.Error, sMsg);
			MessageToast.show(sMsg);
			return;
		};

		//fastapi unexpected error (e.g. pydantic validation error)
		if (!!error && !error.responseJSON){
			const sMsg = 'Error at ' + sCaller + ' - Unexpected Backend Error (Error: ' + error.status + ' ' + error.statusText + ')'
			MessageHandler.getInstance().addMessage(MessageType.Error, sMsg);
			MessageToast.show(sMsg);
			return;
		}

		MessageToast.show('Unknown Error. See onReceiveErrorGeneric and handle.');
	}

	public static onGenericSuccessWithMessage(oConfirmation: BConfirmation, sStatus: string, oReturnData: object): void {
		//toast and create message
		//requires pre-defined message from backend
		MessageToast.show(oConfirmation.message.message);
		MessageHandler.getInstance().addMessageFromBackend(oConfirmation.message);
	}

}