// todo remove and distribute to other files
import ManagedObject from "sap/ui/base/ManagedObject";
import { FBPlant } from "./Plants";
import { ResponseStatus } from "./SharedLocal";
import { FBTaxon } from "./Taxon";

/**
 * @namespace plants.ui.definitions.TaxonLocal
 */
export interface LTaxonMap {
    [key: int]: FBTaxon;
}

export interface LTaxonData {
    TaxaDict: LTaxonMap;
}

export type LAjaxLoadDetailsForSpeciesDoneCallback = (data: BCreatedTaxonResponse, sStatus: ResponseStatus, oResponse: JQueryXHR) => void;