// todo remove and distribute to other files
import ManagedObject from "sap/ui/base/ManagedObject";
import { PPlant } from "./PlantsFromBackend";
import { PTaxon } from "./TaxonFromBackend";

/**
 * @namespace plants.ui.definitions.entities
 */
export interface NewPlant extends PPlant {
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
}