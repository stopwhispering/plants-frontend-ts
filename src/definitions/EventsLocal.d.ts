import ManagedObject from "sap/ui/base/ManagedObject";
import { FBSoil, FBObservation, FBPot, FBEvent } from "./Events";

/**
 * @namespace plants.ui.definitions.entities
 */

export interface LEventEditDataSegments{
    observation: boolean;
    pot: boolean;
	soil: boolean;
}

export interface LEventInEventsModel extends Omit<FBEvent, "id">{
    // only difference in comparison to PEvent from backend: id is optional
    // to allow for new events  // todo replace everywhere with FBEvent|FCreateOrUpdateEvent
    id?: number;
}

export interface LPlantIdToEventsMap {
    [key: int]: FBEvent[];  //plant_it to Events array
}

export interface LPotHeightOptions{
    very_flat: boolean;
    flat: boolean;
    high: boolean;  // default
    very_high: boolean;
}

export interface LPotShapeOptions{
    square: boolean;  // default
    round: boolean;
    oval: boolean;
    hexagonal: boolean;
}

export interface LEventEditData{
    // for new event or editing existing event
    // might have no id, yet; has additional fields for dialog control
    // missing fields: observation_id, pot_id
    id?: number;  // undefined for new event, exists for edited plant

    date: string;
    event_notes?: string;
    observation?: FBObservation;
    soil?: FBSoil | LInitialSoil;
    plant_id: number;
    pot?: FBPot;

    potHeightOptions: LPotHeightOptions;
    potShapeOptions: LPotShapeOptions;
    segments: EventEditDataSegments;
    mode: 'new' | 'edit'
    oldEvent?: FBEvent;
}


export interface LSoilEditData {
    // for new soil or editing existing soil
    dialog_title: string,
    btn_text: string;
    new: boolean;
    id?: int;  // undefined for new soil
    soil_name: string;
    description: string;
    mix: string;
}

export interface LPlantsEventsDict{
    [key: int]: FBEvent[];
}

export interface LEventsModelData {
    PlantsEventsDict: PlantsEventsDict;
}

export interface LInitialSoil extends Omit<FBSoil, "id" | "soil_name">{
// for initially opening the dialog before selecting a soil
    id?: number;
    soil_name?: string;
  }