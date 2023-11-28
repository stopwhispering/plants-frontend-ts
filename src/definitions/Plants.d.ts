import ManagedObject from "sap/ui/base/ManagedObject";
import { PMessage } from "./entities";
import { ResponseContainer, TagState } from "./Images";

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

export interface GetPlantsResponse extends ResponseContainer {
  PlantsCollection: PlantRead[];
}

export interface PlantRead extends PlantBase{
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

  taxon_tags: TaxonTag[];

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

export interface TagBase {
  id?: number;
  state: FBTagState;
  text: string;
  last_update?: string;
}

export interface PlantTag extends TagBase {
  plant_id: number;
}

export interface TaxonTag extends TagBase{
  taxon_id: number;
}

export interface PlantRenameRequest {
  new_plant_name: string;
}
export interface ClonePlantResponse extends ResponseContainer {
  plant: PlantRead;
}
export interface CreatePlantResponse extends ResponseContainer {
  resource: FBMajorResource;
  plant: PlantRead;
}
export interface UpdatePlantsResponse extends ResponseContainer {
  resource: FBMajorResource;
}
export interface PlantCreate {
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
  parent_plant?: FBAssociatedPlantExtractForPlant;
  parent_plant_pollen?: FBAssociatedPlantExtractForPlant;
  plant_notes?: string;
  tags: PlantTag[];
  seed_planting_id?: number;
}
export interface PlantUpdate {
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
  tags: PlantTag[];
  seed_planting_id?: number;
}

export interface UpdatePlantsRequest {
  PlantsCollection: PlantUpdate[];
}
export interface ProposeSubsequentPlantNameResponse {
  original_plant_name: string;
  subsequent_plant_name: string;
}
export interface PlantBase {
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
  
  tags: PlantTag[];
  seed_planting_id?: number;
}
