// todo remove and distribute to other files
import ManagedObject from "sap/ui/base/ManagedObject";
import { FBPlant } from "./Plants";
import { FBTaxon } from "./Taxon";

/**
 * @namespace plants.ui.definitions.entities
 */
export interface NewPlant extends FBPlant {
    id: undefined;
}

export interface ObjectStatusData {
    // ObjectStatus is reserved word
    selected: boolean;
    text: string;
    state: string;
}

export interface ObjectStatusCollection {
    ObjectStatusCollection: ObjectStatusData[];
    Value: string;
}