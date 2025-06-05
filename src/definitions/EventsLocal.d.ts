import ManagedObject from "sap/ui/base/ManagedObject";
import { SoilRead, ObservationCreateUpdate } from "./Events";

/**
 * @namespace plants.ui.definitions.entities
 */

export interface LEventEditDataSegments{
    observation: boolean;
    pot: boolean;
	soil: boolean;
}

export interface LEventInEventsModel extends Omit<EventRead, "id">{
    // only difference in comparison to PEvent from backend: id is optional
    id?: number;
}

export interface LPlantIdToEventsMap {
    [key: int]: EventRead[];  //plant_it to Events array
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

export interface LEventData{
    // for new event or editing existing event
    date: string;
    event_notes?: string;
    observation?: ObservationCreateUpdate;
    soil?: SoilRead | LInitialSoil;
    plant_id: number;
    pot?: PotCreateUpdate;

    potHeightOptions: LPotHeightOptions;
    potShapeOptions: LPotShapeOptions;
    segments: EventEditDataSegments;
}

export interface LEventEditData extends LEventData{
    // for new event or editing existing event
    // might have no id, yet; has additional fields for dialog control
    // missing fields: observation_id, pot_id
    id?: number;  // undefined for unsaved event
    oldEvent: EventRead;
    selectedSoilId?: number;  // undefined for new event
}

export interface LNewEventData extends LEventData{
    // for new event
    // has no id, yet; has additional fields for dialog control
    // missing fields: observation_id, pot_id
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
    [key: int]: EventRead[];
}

export interface PlantsFlowerHistoryDict{
    [key: int]: PlantFlowerYearRead[];
}

export interface LEventsModelData {
    PlantsEventsDict: PlantsEventsDict;
}

export interface FlowerHistoryModelData {
    PlantsFlowerHistoryDict: PlantsFlowerHistoryDict;
}

export interface LInitialSoil extends Omit<SoilRead, "id" | "soil_name">{
// for initially opening the dialog before selecting a soil
    id?: number;
    soil_name?: string;
  }