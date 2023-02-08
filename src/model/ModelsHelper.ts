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
		
		
		const _parseFastAPILegacyError = function(error: JQueryXHR): string | undefined {
			//fastapi manually thrown exceptions via throw_exception()	todo remove once all fastapi exceptions are migrated to HTTPException
			if ((!!error) && (!!error.responseJSON) && (!!error.responseJSON.detail) && (!!error.responseJSON.detail.type)){
				console.log('fastapi legacy error');
				return error.responseJSON.detail.type + ': ' + error.responseJSON.detail.message;
			}
		}
	
		const _parseFastAPIHttpError = function(error: JQueryXHR): string | undefined {
			// raise e.g. via raise HTTPException(status_code=404, detail="Item not found") or subclasses
			console.log('fastapi http error');
			return undefined //todo
		}
	
		const _parseServerNotReachableError = function(error: JQueryXHR): string | undefined {
			//server not reachable
			const oErrorEvent: Event = <unknown>error as Event;
			if (!!oErrorEvent.getParameter && oErrorEvent.getParameter('message')){
				console.log('server not reachable');
				return 'Could not reach Server (Error: ' + error.status + ' ' + error.statusText + ')'
			}
		}
	
		const _parsePydanticInputValidationError = function(error: JQueryXHR): string | undefined {
			//422 pydantic input validation error
			if (error && error.responseJSON && error.responseJSON.detail && Array.isArray(error.responseJSON.detail)){
				console.log('pydantic input validation error');
				return JSON.stringify(error.responseJSON.detail);
			}
		}
	
		const _anyPythonError = function(error: JQueryXHR): string | undefined {
			//e.g. unexpected ValueError, TypeError, etc.
			if (error && !error.responseJSON && error.statusText === 'error'){
				console.log('Unexpected Python Error');
				return 'Unexpected Python Error';
			}
		}
		
		//trying to catch different kinds of error callback returns
		//always declare similar to: .fail(this.ModelsHelper.getInstance()._onReceiveErrorGeneric.bind(thisOrOtherContext,'EventsResource'));
		Util.stopBusyDialog();

		console.log(error);
		const sMsg = (_parseFastAPILegacyError(error) || _parseFastAPIHttpError(error) || _parseServerNotReachableError(error) || 
				_parsePydanticInputValidationError(error) || _anyPythonError(error) || 'Unknown Error. See onReceiveErrorGeneric and handle.');
		MessageToast.show(sMsg);
	}

	public static onGenericSuccessWithMessage(oConfirmation: BConfirmation, sStatus: string, oReturnData: object): void {
		//toast and create message
		//requires pre-defined message from backend
		MessageToast.show(oConfirmation.message.message);
		MessageHandler.getInstance().addMessageFromBackend(oConfirmation.message);
	}

}