import ManagedObject from "sap/ui/base/ManagedObject";
import Event from "sap/ui/base/Event";
import MessageToast from "sap/m/MessageToast";

/**
 * @namespace pollination.ui.controller.custom
 */

enum ErrorType {
    FASTAPILEGACYERROR = 'FastAPILegacyError',
    FASTAPIHTTPERROR = 'FastAPIHttpError',
    SERVERNOTREACHABLEERROR = 'ServerNotReachableError',
    PYDANTICINPUTVALIDATIONERROR = 'PydanticInputValidationError',
    ANYPYTHONERROR = 'AnyPythonError',
    UNKNOWN = 'Unknown',
}

export default class ErrorHandling extends ManagedObject {

    private static _parseFastAPILegacyError(error: JQueryXHR): string {
        //fastapi manually thrown exceptions via throw_exception()	todo remove once all fastapi exceptions are migrated to HTTPException
        return error.responseJSON.detail.type + ': ' + error.responseJSON.detail.message;
    }

    private static _parseFastAPIHttpError(error: JQueryXHR): string {
        // raise e.g. via raise HTTPException(status_code=404, detail="Item not found") or subclasses
        return error.responseJSON.detail;
    }

    private static _parseServerNotReachableError(error: JQueryXHR): string {
        return 'Could not reach Server (Error: ' + error.status + ' ' + error.statusText + ')'
    }

    private static _parsePydanticInputValidationError(error: JQueryXHR): string {
        //422 pydantic input validation error
        return JSON.stringify(error.responseJSON.detail);
    }

    private static _parseAnyPythonError(error: JQueryXHR): string {
        //e.g. unexpected ValueError, TypeError, etc.
        return 'Unexpected Python Error';
    }

    private static _getErrorType(error: JQueryXHR): ErrorType {
        if ((!!error) && (!!error.responseJSON) && (!!error.responseJSON.detail) && (!!error.responseJSON.detail.type))
            return ErrorType.FASTAPILEGACYERROR;
        else if ((!!error) && (error.responseJSON) && (error.responseJSON.detail) && (!error.responseJSON.detail.type))
            return ErrorType.FASTAPIHTTPERROR;
        else if (!!(<Event><unknown>error).getParameter && (<Event><unknown>error).getParameter('message'))
            return ErrorType.SERVERNOTREACHABLEERROR;
        else if (error && error.responseJSON && error.responseJSON.detail && Array.isArray(error.responseJSON.detail))
            return ErrorType.PYDANTICINPUTVALIDATIONERROR;
        else if (error && !error.responseJSON && error.statusText === 'error')
            return ErrorType.ANYPYTHONERROR;
        return ErrorType.UNKNOWN;
    }


    public static onFail(
        sCaller: string,
        error: JQueryXHR,
        sTypeOfError: null | "timeout" | "error" | "abort" | "parsererror",
        oExceptionObject?: any): void {

        // onFail is called with bind() to supply sCaller, so we can't access 
        // methods with this.
        const eErrorType: ErrorType = ErrorHandling._getErrorType(error);
        console.log(error);

        let sMsg: string;
        switch (eErrorType) {
            case ErrorType.FASTAPILEGACYERROR: {
                sMsg = ErrorHandling._parseFastAPILegacyError(error);
                break;
            }
            case ErrorType.FASTAPIHTTPERROR: {
                sMsg = ErrorHandling._parseFastAPIHttpError(error);
                break;
            }
            case ErrorType.SERVERNOTREACHABLEERROR: {
                sMsg = ErrorHandling._parseServerNotReachableError(error);
                break;
            }
            case ErrorType.PYDANTICINPUTVALIDATIONERROR: {
                sMsg = ErrorHandling._parsePydanticInputValidationError(error);
                break;
            }
            case ErrorType.ANYPYTHONERROR: {
                sMsg = ErrorHandling._parseAnyPythonError(error);
                break;
            }
            case ErrorType.UNKNOWN: {
                sMsg = 'Unknown Error. See onFail in ErrorHandling.';
                break;
            }
        }

        MessageToast.show(eErrorType + ' at ' + sCaller + ': ' + sMsg);

    }

}