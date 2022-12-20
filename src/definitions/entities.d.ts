import ManagedObject from "sap/ui/base/ManagedObject";
import { PPlant } from "./plant_entities";

/**
 * @namespace plants.ui.definitions.entities
 */
export interface CancellationReasonChoice {
    selected: boolean;
    text: string;
    icon: string;
    state: string;
}

export interface NewPlant extends PPlant {
    id: undefined;
}

export interface ParentalPlant {
    //flowering plant or pollen donor pant
    id: int | undefined;
    plant_name: string | undefined;
    active: bool | undefined;
}

export interface PlantsCollection {
    PlantsCollection: Plant[];
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

export interface Tag {
    text: string;
    state: string;
    plant_id: int;
}

export interface BackendResultPlantCloned {
    action: str
    resource: str
    message: PMessage
    plant: Plant
}

export interface Taxon {
    id: int;
    name: string;
    is_custom: bool;
    subsp: string;
    species: string;
    subgen: string;
    genus: string;
    family: string;
    phylum: string;
    kingdom: string;
    rank: string;
    taxonomic_status: string;
    name_published_in_year: int;
    synonym: bool;
    fq_id: string;
    authors: string;
    basionym: string;
    synonyms_concat: string;
    distribution_concat: string;
    hybrid: bool;
    hybridgenus: bool;
    gbif_id: string;
    powo_id: string;
    custom_notes: string;
    ipni_id_short: string;
    distribution: any;
    images: any[];
    trait_categories: any[];
    occurrenceImages?: any[];
    latest_image: any;
    tags: any[];
}

export interface TaxonMap {
    [key: int]: Taxon;
}

export interface TaxonData {
    TaxaDict: TaxonMap;
}

// export interface PResultsUpdateCreateSoil {
//     soil: PSoil;
//     message: PMessage;
//   }
  