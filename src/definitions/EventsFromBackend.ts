
/**
 * @namespace plants.ui.definitions
 */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

import { PMessage } from "./MessagesFromBackend";

export type ShapeTop = "square" | "round" | "oval" | "hexagonal";
export type ShapeSide = "very flat" | "flat" | "high" | "very high";
export type PEvents = PEvent[];
/**
 * message types processed by error/success handlers in ui5 web frontend
 */
export type MessageType = "Information" | "None" | "Success" | "Warning" | "Error" | "Debug";

export interface PEvent {
  id: number;
  date: string;
  event_notes?: string;
  observation?: PObservation;
  // pot_id?: number;
  // pot_event_type?: string;
  soil?: PSoil;
  // soil_event_type?: string;
  plant_id: number;
  pot?: PPot;
  images?: PImage[];
}
export interface PObservation {
  id?: number;
  diseases?: string;
  stem_max_diameter?: number;
  height?: number;
  observation_notes?: string;
}
export interface PSoil {
  id?: number;
  soil_name: string;
  mix: string;
  description?: string;
}
export interface PPot {
  id?: number;
  material: string;
  shape_top: ShapeTop;
  shape_side: ShapeSide;
  diameter_width?: number;
}
export interface PImage {
  id?: number;
  filename: string;
}
export interface PEventCreateOrUpdate {
  id?: number;
  date: string;
  event_notes?: string;
  observation?: PObservation;
  // pot_id?: number;
  // pot_event_type?: string;
  soil?: PSoil;
  // soil_event_type?: string;
  plant_id: number;
  pot?: PPot;
  images?: PImage[];
}
export interface PEventCreateOrUpdateRequest {
  plants_to_events: {
    [k: string]: PEventCreateOrUpdate[];
  };
}
export interface PImageDelete {
  filename: string;
}
export interface PImagesDelete {
  images: PImageDelete[];
}

export interface PResultsEventResource {
  events: PEvents;
  message: PMessage;
}
export interface PResultsSoilsResource {
  SoilsCollection: PSoilWithCount[];
}
export interface PSoilWithCount {
  id: number;
  soil_name: string;
  mix: string;
  description?: string;
  plants_count: number;
}
export interface PResultsUpdateCreateSoil {
  soil: PSoil;
  message: PMessage;
}
export interface PSoilCreate {
  id?: number;
  soil_name: string;
  mix: string;
  description?: string;
}