import ManagedObject from "sap/ui/base/ManagedObject";
import { PPlant } from "./plant_entities";

/**
 * @namespace plants.ui.definitions.entities
 */
export interface PMessage {
    type: MessageType;
    message: string;
    additionalText: string;
    description?: string;
}

export interface PConfirmation{
    action: string;
    resource: string;
    message: PMessage;
}

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

export type ShapeTop = "square" | "round" | "oval" | "hexagonal";
export type ShapeSide = "very flat" | "flat" | "high" | "very high";

export interface PPot {
    id?: number;
    material: string;
    shape_top: ShapeTop;
    shape_side: ShapeSide;
    diameter_width?: number;
}

export interface PObservation {
    id?: number;
    diseases?: string;
    stem_max_diameter?: number;
    height?: number;
    observation_notes?: string;
}
export interface PSoil {
    id?: number;  // undefined only initially when creating the dialog
    soil_name: string;
    mix: string;
    description?: string;
}

export interface PEvent {
    id: number;
    date: string;
    event_notes?: string;
    observation_id?: number;
    observation?: PObservation;
    pot_id?: number;
    pot_event_type?: 'cancel' | 'Repotting';
    soil_id?: number;
    soil?: PSoil;
    soil_event_type?: 'cancel' | 'Changing Soil';
    plant_id: number;
    pot?: PPot;
    images?: PImage[];
  }

export interface PlantIdToEventsMap {
    [key: int]: PEvent[];  //plant_it to Events array
}

export interface PEventCreateOrUpdate {
    id?: number;  // only difference to PEvent
    date: string;
    event_notes?: string;
    observation_id?: number;
    observation?: PObservation;
    pot_id?: number;
    pot_event_type?: 'cancel' | 'Repotting';
    soil_id?: number;
    soil?: PSoil;
    pot_event_type?: 'cancel' | 'Repotting';
    plant_id: number;
    pot?: PPot;
    images?: PImage[];
}

export interface PEvents extends Array<PEvent|PEventCreateOrUpdate> { }

export interface PEventCreateOrUpdateRequest {
    plants_to_events: {
      [k: string]: PEventCreateOrUpdate[];
    };
  }

export interface IdToFragmentMap {
    [key: string]: string;  // e.g. dialogRenamePlant: "plants.ui.view.fragments.DetailRename"
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

export interface EventEditDataSegments{
    observation: 'cancel' | 'status';
    pot?: 'cancel' | 'Repotting';
	soil?: 'cancel' | 'Changing Soil';
}

export interface EventEditData {
    // for new event or editing existing event
    date: any;
    event_notes?: string;
    pot?: PPot;
    observation?: PObservation;
    soil?: PSoil;
    segments? : EventEditDataSegments;  // deleted before saving to backend
    mode?: 'new' | 'edit' | undefined;
    old_event?: EventEditData;
    plant_id: int;
    pot_event_type?: 'cancel' | 'Repotting'
    soil_event_type?: 'cancel' | 'Changing Soil'
}

export interface SoilEditData {
    // for new soil or editing existing soil
    dialog_title: string,
    btn_text: string;
    new: boolean;
    id?: int;  // undefined for new soil
    soil_name: string;
    description: string;
    mix: string;
}

export interface PResultsUpdateCreateSoil {
    soil: PSoil;
    message: PMessage;
  }
  