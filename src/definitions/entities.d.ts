// todo remove and distribute to other files
import ManagedObject from "sap/ui/base/ManagedObject";
import { FBPlant, FBTagState } from "./Plants";
import { FBTaxon } from "./Taxon";

/**
 * @namespace plants.ui.definitions.entities
 */
export interface NewPlant extends FBPlant {
    id: undefined;
}

export interface LTagInputStatus {
    selected: boolean;
    text: string;
    state: FBTagState;
}

export interface LTagInput {
    TagStatusCollection: LTagInputStatus[];
    Value: string;
}

export interface LRouteMatchedArguments{
    plant_id: number;
}

export interface LBeforeRouteMatchedArguments{
    layout: string;
}