
import ManagedObject from "sap/ui/base/ManagedObject";
import { BackendMessage } from "./Messages";
import { ResponseContainer } from "./Images";

/**
 * @namespace plants.ui.definitions
 */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/
export type FBShapeTop = "square" | "round" | "oval" | "hexagonal";
export type FBShapeSide = "very flat" | "flat" | "high" | "very high";
export type BEvents = EventRead[];
export type BMessageType = "Information" | "None" | "Success" | "Warning" | "Error" | "Debug";
export type BFloweringState = "inflorescence_growing" | "flowering" | "seeds_ripening" | "not_flowering" | "not_available";

// backend supplies either BFloweringState (usually until current month) or flowering_probability (usually for future months)
export type PlantFlowerMonth = {
  flowering_state?: BFloweringState;
  flowering_probability?: number; 
}

export type PlantFlowerYear = {
  year: number;
  month_01: PlantFlowerMonth;
  month_02: PlantFlowerMonth;
  month_03: PlantFlowerMonth;
  month_04: PlantFlowerMonth;
  month_05: PlantFlowerMonth;
  month_06: PlantFlowerMonth;
  month_07: PlantFlowerMonth;
  month_08: PlantFlowerMonth;
  month_09: PlantFlowerMonth;
  month_10: PlantFlowerMonth;
  month_11: PlantFlowerMonth;
  month_12: PlantFlowerMonth;
}

export interface EventBase{
  plant_id: int
  date: string;
  event_notes?: string;
  images?: ImageAssignedToEvent[];
}

export interface EventRead extends EventBase{
  id: number;
  observation?: ObservationRead;  // todo create
  soil?: SoilRead;
  pot?: PotRead;
}

export interface ObservationCreateUpdate {
  id?: number;
  diseases?: string;
  // stem_max_diameter?: number;  // in cm
  // height?: number;  // in cm
  observation_notes?: string;
}

export interface SoilBase {
  id: number;
  soil_name: string;
  mix: string;
  description?: string;
}

export interface SoilRead extends SoilBase {
}

export interface SoilCreate extends SoilBase{
  id?: number;
}

export interface SoilUpdate extends SoilBase {
}

export interface SoilWithCount extends SoilBase {
  plants_count: number;
}

export interface PotBase {
  material: string;
  shape_top: FBShapeTop;
  shape_side: FBShapeSide;
  diameter_width: number;  // in cm (decimal) 
}

export interface PotCreateUpdate extends PotBase{
  id?: int;
}

export interface PotRead extends PotBase{
  id: int;
}

export interface ImageAssignedToEvent {
  id: number;
}
export interface CreateOrUpdateSoilResponse extends ResponseContainer {
  soil: SoilRead;
}
export interface GetEventsResponse extends ResponseContainer{
  events: EventRead[];
  flower_history: PlantFlowerYear[];
}
export interface GetSoilsResponse {
  SoilsCollection: SoilWithCount[];
}
export interface EventCreateUpdate {
  id?: number;
  plant_id: number;
  date: string;
  event_notes?: string;
  observation?: ObservationCreateUpdate;
  soil?: SoilUpdate;
  pot?: PotCreateUpdate;
  images: ImageRead[];
}
export interface ImageToDelete {
  id: number;
}
export interface DeleteImagesRequest {
  images: ImageToDelete[];
}
export interface CreateOrUpdateEventRequest {
  plants_to_events: {
    [k: int]: EventCreateUpdate[];
  };
}