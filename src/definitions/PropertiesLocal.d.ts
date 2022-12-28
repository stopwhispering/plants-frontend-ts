import Popover from "sap/m/Popover";
import ManagedObject from "sap/ui/base/ManagedObject";
import { FBPropertiesInCategory } from "./Properties";

/**
 * @namespace plants.ui.definitions
 */
export interface LCategoryToPropertiesInCategoryMap {
    [category_id: number]: FBPropertiesInCategory;
}

export interface LTemporaryAvailableProperties {
    blocked_plant: boolean;
    blocked_taxon: boolean;
    property_name: string;
    property_name_id?: int;
    selected_plant: boolean;
    selected_taxon: boolean;
}

export interface LTaxonToPropertyCategoryMap {
    // maps from taxon_id to property categories
    [taxon_id: number]: LCategoryToPropertiesInCategoryMap;
}

export interface LPropertiesTaxonModelData {
    // base type of the taxon model, containing all the taxa' properties
    // propertiesTaxon: LCategoryToPropertiesInCategoryMap;
    propertiesTaxon: LTaxonToPropertyCategoryMap;
}

export interface LPlantPropertiesRequest {
    taxon_id?: number;
}

export interface LPlantIdToPropertyCollectionMap {
    [plant_id: number]: PPropertyCollectionPlant[];
}

export type LTaxonToPropertiesInCategoryMap = {
    [k: string]: FBPropertiesInCategory;
  }

export interface LPopoverWithPropertiesCategory extends Popover{
    property_category: FBPropertiesInCategory
}