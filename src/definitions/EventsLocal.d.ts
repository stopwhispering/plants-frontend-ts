import ManagedObject from "sap/ui/base/ManagedObject";
import { FBSoil, FBObservation, FBPot, FBEvent } from "./Events";

/**
 * @namespace plants.ui.definitions.entities
 */

export interface EventEditDataSegments{
    observation: boolean;
    pot: boolean;
	soil: boolean;
}

export interface EventInEventsModel extends Omit<FBEvent, "id">{
    // only difference in comparison to PEvent from backend: id is optional
    // to allow for new events
    id?: number;
}

export interface PlantIdToEventsMap {
    [key: int]: FBEvent[];  //plant_it to Events array
}

export interface EventEditData{
    // for new event or editing existing event
    // might have no id, yet; has additional fields for dialog control
    // missing fields: observation_id, pot_id
    id?: number;  // undefined for new event, exists for edited plant

    date: string;
    event_notes?: string;
    observation?: FBObservation;
    soil?: FBSoil;
    plant_id: number;
    pot?: FBPot;

    segments : EventEditDataSegments;
    mode: 'new' | 'edit'
    oldEvent: FBEvent;
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

export interface PlantsEventsDict{
    [key: int]: FBEvent[];
}

export interface EventsModelData {
    PlantsEventsDict: PlantsEventsDict;
}

export interface InitialSoil extends Omit<FBSoil, "id" | "soil_name">{
// for initially opening the dialog before selecting a soil
    id?: number;
    soil_name?: string;
  }