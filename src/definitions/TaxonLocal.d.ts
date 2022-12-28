// todo remove and distribute to other files
import ManagedObject from "sap/ui/base/ManagedObject";
import { FBPlant } from "./Plants";
import { ResponseStatus } from "./SharedLocal";
import { BResultsRetrieveTaxonDetailsRequest, FBTaxon } from "./Taxon";

/**
 * @namespace plants.ui.definitions.TaxonLocal
 */
export interface LTaxonMap {
    [key: int]: FBTaxon;
}

export interface LTaxonData {
    TaxaDict: LTaxonMap;
}

export type LAjaxLoadDetailsForSpeciesDoneCallback = (data: BResultsRetrieveTaxonDetailsRequest, sStatus: ResponseStatus, oResponse: JQueryXHR) => void;