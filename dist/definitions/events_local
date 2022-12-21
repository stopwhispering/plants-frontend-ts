import ManagedObject from "sap/ui/base/ManagedObject";
import { PObservation, PPot } from "./entities";
import { PPlant } from "./plant_entities";

/**
 * @namespace plants.ui.definitions.entities
 */

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