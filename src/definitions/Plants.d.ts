import ManagedObject from "sap/ui/base/ManagedObject";
import { PMessage } from "./entities";
import { TagState } from "./Images";

/**
 * @namespace plants.ui.definitions
 */

export type BMessageType = "Information" | "None" | "Success" | "Warning" | "Error" | "Debug";
export type FBPropagationType =
  | "seed (collected)"
  | "offset"
  | "acquired as plant"
  | "bulbil"
  | "head cutting"
  | "leaf cutting"
  | "seed (purchased)"
  | "unknown"
  | "";
export type FBCancellationReason =
  | "Winter Damage"
  | "Dried Out"
  | "Mould"
  | "Mites"
  | "Other Insects"
  | "Abandonment"
  | "Gift"
  | "Sale"
  | "Others";
export type FBTagState = "None" | "Indication01" | "Success" | "Information" | "Error" | "Warning";
export type FBMajorResource =
  | "PlantResource"
  | "ImageResource"
  | "TaxonResource"
  | "EventResource"
  | "PlantPropertyResource"
  | "TaxonPropertyResource";

export interface BMessage {
  type: BMessageType;
  message: string;
  description?: string;
}
export interface BPlant {
  id: number;
  plant_name: string;
  field_number?: string;
  geographic_origin?: string;
  nursery_source?: string;
  propagation_type?: FBPropagationType;
  active: boolean;
  cancellation_reason?: FBCancellationReason;
  cancellation_date?: string;
  generation_notes?: string;
  taxon_id?: number;
  taxon_authors?: string;
  botanical_name?: string;
  full_botanical_html_name?: string;
  parent_plant?: FBAssociatedPlantExtractForPlant;
  parent_plant_pollen?: FBAssociatedPlantExtractForPlant;
  plant_notes?: string;
  last_update?: string;
  descendant_plants_all: FBAssociatedPlantExtractForPlant[];
  sibling_plants: FBAssociatedPlantExtractForPlant[];
  same_taxon_plants: FBAssociatedPlantExtractForPlant[];
  current_soil?: FBPlantCurrentSoil;
  latest_image?: FBPlantLatestImage;
  tags: FBPlantTag[];
}
export interface FBAssociatedPlantExtractForPlant {
  id: number;
  plant_name: string;
  active: boolean;
}
export interface FBPlantCurrentSoil {
  soil_name: string;
  date: string;
}
export interface FBPlantLatestImage {
  filename: string;
  record_date_time: string;
}
export interface FBPlantTag {
  id?: number;
  state: FBTagState;
  text: string;
  last_update?: string;
  plant_id: number;
}
export interface BPlantsRenameRequest {
  plant_id: int;
  old_plant_name: string;
  new_plant_name: string;
}
export interface BResultsPlantCloned {
  action: string;
  message: BMessage;
  plant: BPlant;
}
export interface BResultsPlants {
  action: string;
  message: BMessage;
  PlantsCollection: BPlant[];
}
export interface BResultsPlantsUpdate {
  action: string;
  resource: FBMajorResource;
  message: BMessage;
  plants: BPlant[];
}
export interface FPlant {
  id?: number;
  plant_name: string;
  field_number?: string;
  geographic_origin?: string;
  nursery_source?: string;
  propagation_type?: FBPropagationType;
  active: boolean;
  cancellation_reason?: FBCancellationReason;
  cancellation_date?: string;
  generation_notes?: string;
  taxon_id?: number;
  // taxon_authors?: string;
  // botanical_name?: string;
  parent_plant?: FBAssociatedPlantExtractForPlant;
  parent_plant_pollen?: FBAssociatedPlantExtractForPlant;
  plant_notes?: string;
  // last_update?: string;
  // descendant_plants_all: FBAssociatedPlantExtractForPlant[];
  // sibling_plants: FBAssociatedPlantExtractForPlant[];
  // same_taxon_plants: FBAssociatedPlantExtractForPlant[];
  // current_soil?: FBPlantCurrentSoil;
  // latest_image?: FBPlantLatestImage;
  tags: FBPlantTag[];
}

export interface FPlantsUpdateRequest {
  PlantsCollection: FPlant[];
}
export interface BResultsProposeSubsequentPlantName {
  original_plant_name: string;
  subsequent_plant_name: string;
}
export interface PlantRead {
  plant_name: string;
  field_number?: string;
  geographic_origin?: string;
  nursery_source?: string;
  propagation_type?: FBPropagationType;
  active: boolean;
  cancellation_reason?: FBCancellationReason;
  cancellation_date?: string;
  generation_notes?: string;
  taxon_id?: number;
  parent_plant?: ShortPlant;
  parent_plant_pollen?: ShortPlant;
  plant_notes?: string;
  preview_image_id?: number;
  tags: FBPlantTag[];
  id: number;
  taxon_authors?: string;
  botanical_name?: string;
  full_botanical_html_name?: string;
  created_at: string;
  last_update?: string;
  descendant_plants_all: ShortPlant[];
  sibling_plants: ShortPlant[];
  same_taxon_plants: ShortPlant[];
  current_soil?: PlantCurrentSoil;
  latest_image?: PlantLatestImage;
}