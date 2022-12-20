import ManagedObject from "sap/ui/base/ManagedObject";
import { PSoil, PObservation, PPot, PEvent } from "./EventsFromBackend";
import { PImage } from "./image_entities";

/**
 * @namespace plants.ui.definitions.entities
 */

export interface EventEditDataSegments{
    observation: boolean;
    pot: boolean;
	soil: boolean;
}

export interface EventInEventsModel extends Omit<PEvent, "id">{
    // only difference in comparison to PEvent from backend: id is optional
    // to allow for new events
    id?: number;
}

export interface PlantIdToEventsMap {
    [key: int]: PEvent[];  //plant_it to Events array
}

// export interface EventEditData {
//     // for new event or editing existing event
//     date: any;
//     event_notes?: string;
//     observation?: PObservation;
//     mode?: 'new' | 'edit' | undefined;
//     oldEvent?: EventEditData;
//     segments : EventEditDataSegments;  // deleted before saving to backend
//     soil?: PSoil;
//     plant_id: int;
//     pot?: PPot;
//     // pot_event_type?: 'cancel' | 'Repotting'
//     // soil_event_type?: 'cancel' | 'Changing Soil'
// }

export interface EventEditData{
    // for new event or editing existing event
    // might have no id, yet; has additional fields for dialog control
    // missing fields: observation_id, pot_id
    id?: number;  // undefined for new event, exists for edited plant

    date: string;
    event_notes?: string;
    observation?: PObservation;
    soil?: PSoil;
    plant_id: number;
    pot?: PPot;

    segments : EventEditDataSegments;
    mode: 'new' | 'edit'
    oldEvent: PEvent;
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
    [key: int]: PEvent[];
}

export interface EventsModelData {
    PlantsEventsDict: PlantsEventsDict;
}