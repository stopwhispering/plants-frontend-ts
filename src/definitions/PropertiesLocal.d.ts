import ManagedObject from "sap/ui/base/ManagedObject";

/**
 * @namespace plants.ui.definitions
 */
export interface LCategoryToPropertiesInCategoryMap {
    [category_id: number]: PPropertiesInCategory;
}

export interface LTemporaryAvailableProperties {
    blocked_plant: boolean;
    blocked_taxon: boolean;
    property_name: string;
    property_name_id?: int;
    selected_plant: boolean;
    selected_taxon: boolean;
}

export interface LPropertiesTaxonModelData {
    propertiesTaxon: CategoryToPropertiesInCategoryMap;
}

export interface LPlantPropertiesRequest {
    taxon_id?: number;
}

export interface LPlantIdToPropertyCollectionMap {
    [plant_id: number]: PPropertyCollectionPlant[];
}
