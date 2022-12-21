import ManagedObject from "sap/ui/base/ManagedObject";
import { PMessage } from "./entities";
import { TagState } from "./image_entities";

/**
 * @namespace plants.ui.definitions.plant_entities
 */
export type PropagationType =
    | "seed (collected)"
    | "offset"
    | "acquired as plant"
    | "bulbil"
    | "head cutting"
    | "leaf cutting"
    | "seed (purchased)"
    | "unknown"
    | "";

export type CancellationReason =
    | "Winter Damage"
    | "Dried Out"
    | "Mould"
    | "Mites"
    | "Other Insects"
    | "Abandonment"
    | "Gift"
    | "Sale"
    | "Others";

export interface PPlantTag {
    id?: number;
    text: string;
    state: TagState;
    last_update?: string;
    plant_id: number;
    }

export interface PAssociatedPlantExtractForPlant {
    id: number;
    plant_name: string;
    active: boolean;
}
export interface PAssociatedPlantExtractForPlantOptional {
    id?: number;
    plant_name?: string;
    active?: boolean;
}

export interface PPlantCurrentSoil {
    soil_name: string;
    date: string;
}

export interface PPlantLatestImage {
    path: string;
    date: string;
}
export interface PPlant {
    id?: number;
    plant_name: string;
    field_number?: string;
    geographic_origin?: string;
    nursery_source?: string;
    propagation_type?: PropagationType;
    active: boolean;
    cancellation_reason?: CancellationReason;
    cancellation_date?: string;
    generation_notes?: string;
    taxon_id?: number;
    taxon_authors?: string;
    botanical_name?: string;
    parent_plant?: PAssociatedPlantExtractForPlantOptional;
    parent_plant_pollen?: PAssociatedPlantExtractForPlantOptional;
    plant_notes?: string;
    filename_previewimage?: string;
    hide?: boolean;
    last_update?: string;
    descendant_plants_all: PAssociatedPlantExtractForPlant[];
    sibling_plants: PAssociatedPlantExtractForPlant[];
    same_taxon_plants: PAssociatedPlantExtractForPlant[];
    url_preview?: string;
    current_soil?: PPlantCurrentSoil;
    latest_image?: PPlantLatestImage;
    tags: PPlantTag[];
}

export interface PResultsPlantsUpdate {
    action: string;
    resource: string;
    message: PMessage;
    plants: PPlant[];
  }

  export interface LPropagationType{
    //Local JSON Model, see suggestions.json
    key: string;
    text: string;
    hasParentPlant: boolean;
    hasParentPlantPollen: boolean;
  }

  export interface LCancellationReason{
    //Local JSON Model, see suggestions.json
    selected: boolean;
    text: string;
    icon: icon;
    state: TagState;
  }

  export interface LEventAction{
    //Local JSON Model, see suggestions.json
    name: string;
  }

  export interface LPotMaterial{
    //Local JSON Model, see suggestions.json
    name: string;
  }

  export interface LSuggestions{
    //Local JSON Model, see suggestions.json
    potMaterialCollection: LPotMaterial[];
    eventActionCollection: LEventAction[];
    cancellationReasonCollection: LCancellationReason[];
    propagationTypeCollection: LPropagationType[];
  }

  export interface DescendantPlantInput{
      descendantPlantName?: string;
      propagationType: string;
      parentPlant: string;
      parentPlantPollen?: string;
  }