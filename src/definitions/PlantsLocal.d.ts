import ManagedObject from "sap/ui/base/ManagedObject";
import { PMessage } from "./entities";
import { TagState } from "./ImageFromBackend";

/**
 * @namespace plants.ui.definitions.plant_entities
 */
export interface LPropagationTypeData{
    //Local JSON Model, see suggestions.json
    key: string;
    text: string;
    hasParentPlant: boolean;
    hasParentPlantPollen: boolean;
  }

  export interface LCancellationReason{
    //Local JSON Model, see suggestions.json
    selected: boolean;
    text: string;
    icon: icon;
    state: TagState;
  }

  export interface LEventAction{
    //Local JSON Model, see suggestions.json
    name: string;
  }

  export interface LPotMaterial{
    //Local JSON Model, see suggestions.json
    name: string;
  }

  export interface LSuggestions{
    //Local JSON Model, see suggestions.json
    potMaterialCollection: LPotMaterial[];
    eventActionCollection: LEventAction[];
    cancellationReasonCollection: LCancellationReason[];
    propagationTypeCollection: LPropagationType[];
  }

  export interface LDescendantPlantInput{
      descendantPlantName?: string;
      propagationType: string;
      parentPlant: string;
      parentPlantPollen?: string;
  }

  export interface LCancellationReasonChoice {
    // for dialog to set plant inactive
    selected: boolean;
    text: string;
    icon: string;
    state: string;
}

export interface LParentalPlantInitial extends Omit(PAssociatedPlantExtractForPlant, "id" | "plant_name" | "active") {
  // dummy flowering plant or pollen donor pant at early loading stage
  id: int | undefined;
  plant_name: string | undefined;
  active: bool | undefined;
}