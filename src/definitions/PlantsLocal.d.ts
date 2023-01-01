import ManagedObject from "sap/ui/base/ManagedObject";
import { PMessage } from "./entities";
import { TagState } from "./Images";

/**
 * @namespace plants.ui.definitions.plant_entities
 */
export type LFilterHiddenChoice =
  "only_active"
  | "both"
  | "only_hidden";

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

      autoNameDescendantPlantName: boolean;
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

export interface LCurrentPlant{
  plant_id: int | undefined;  // id of current plant, available immediately from url hash
  plant_index: int| undefined;  // index of current plant in plants model
  plant: BPlant| undefined;
}
		
export interface LNewPlantInputData{
  newPlantName: string | undefined;
}

export interface LRenamePlantInputData{
  newPlantName: string;
}

export interface LClonePlantInputData{
  plantName: string;
}

export interface LCancelPlantInputData{
  cancellationDate: Date;
}

interface LSearchSpeciesInputData{
  searchPattern: string;
  additionalName: string;
  includeExternalApis: boolean;
  genusNotSpecies: boolean;
  customName: string;
  additionalNameEditable: boolean;
  searchResultName?: string;
}