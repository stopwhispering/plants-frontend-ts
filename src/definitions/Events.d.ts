
import ManagedObject from "sap/ui/base/ManagedObject";
import { BMessage } from "./Messages";

/**
 * @namespace plants.ui.definitions
 */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/
export type FBShapeTop = "square" | "round" | "oval" | "hexagonal";
export type FBShapeSide = "very flat" | "flat" | "high" | "very high";
export type BEvents = FBEvent[];
export type BMessageType = "Information" | "None" | "Success" | "Warning" | "Error" | "Debug";

export interface FBEvent {
  id: number;
  plant_id: number;
  date: string;
  event_notes?: string;
  observation?: FBObservation;
  soil?: FBSoil;
  pot?: FBPot;
  images?: ImageAssignedToEvent[];
}
export interface FBObservation {
  id?: number;
  diseases?: string;
  stem_max_diameter?: number;  // in cm
  height?: number;  // in cm
  observation_notes?: string;
}
export interface FBSoil {
  id: number;
  soil_name: string;
  mix?: string;
  description?: string;
}
export interface FBPot {
  id?: number;
  material: string;
  shape_top: FBShapeTop;
  shape_side: FBShapeSide;
  diameter_width: number;  // in cm (decimal) 
}
export interface ImageAssignedToEvent {
  id: number;
}
export interface BPResultsUpdateCreateSoil {
  soil: FBSoil;
  message: BMessage;
}
export interface BResultsEventResource {
  events: BEvents;
  message: BMessage;
}
export interface BResultsSoilsResource {
  SoilsCollection: BSoilWithCount[];
}
export interface BSoilWithCount {
  id: number;
  soil_name: string;
  mix?: string;
  description?: string;
  plants_count: number;
}
export interface FCreateOrUpdateEvent {
  id?: number;
  plant_id: number;
  date: string;
  event_notes?: string;
  observation?: FBObservation;
  soil?: FBSoil;
  pot?: FBPot;
  images: FBImage[];
}
export interface FImageDelete {
  id: number;
}
export interface FImagesToDelete {
  images: FImageDelete[];
}
export interface FRequestCreateOrUpdateEvent {
  plants_to_events: {
    [k: string]: FCreateOrUpdateEvent[];
  };
}
export interface FSoilCreate {
  id?: number;
  soil_name: string;
  mix?: string;
  description?: string;
}
export interface FSoil {
  id: number;
  soil_name: string;
  mix?: string;
  description?: string;
}