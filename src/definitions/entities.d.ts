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

export type LTagType = "Plant" | "Taxon";

export interface LTagInputStatus {
    selected: boolean;
    text: string;
    state: FBTagState;
}

export interface LTagInput {
    TagStatusCollection: LTagInputStatus[];
    Value: string;
    TagPlant: boolean;
    TagTaxon: boolean;
    DisplayTaxonOption: boolean;
}

export interface LRouteMatchedArguments{
    plant_id: string;
}

export interface LBeforeRouteMatchedArguments{
    layout: string;
}