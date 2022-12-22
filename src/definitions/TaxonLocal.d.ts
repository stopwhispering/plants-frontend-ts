// todo remove and distribute to other files
import ManagedObject from "sap/ui/base/ManagedObject";
import { PPlant } from "./PlantsFromBackend";
import { PTaxon } from "./TaxonFromBackend";

/**
 * @namespace plants.ui.definitions.TaxonLocal
 */
export interface LTaxonMap {
    [key: int]: PTaxon;
}

export interface LTaxonData {
    TaxaDict: TaxonMap;
}