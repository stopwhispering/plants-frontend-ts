import ManagedObject from "sap/ui/base/ManagedObject";

/**
 * @namespace plants.ui.definitions
 */
export interface PPropertyValue {
    type: string;
    property_value: string;
    property_value_id?: number;
}

export interface PPropertiesInCategory {
    category_name: string;
    category_id: number;
    sort?: number;
    properties: PProperty[];
    property_value?: string;
}

export interface PProperty {
    property_name: string;
    property_name_id?: number;
    property_values: PPropertyValue[];
    property_value?: string;
    property_value_id?: number;
}

export interface PPropertyName {
    property_name_id?: number;
    property_name: string;
    countPlants: number;
}

export interface PropertiesTaxonModelData {
    propertiesTaxon: CategoryToPropertiesInCategoryMap;
}

export interface PropertiesPlantsModelData {
    propertiesPlants: any;
}

export interface CategoryToPropertiesInCategoryMap {
    [category_id: number]: PPropertiesInCategory;
}

export interface PlantIdToPropertyCollectionMap {
    [plant_id: number]: PPropertyCollectionPlant[];
}

export interface PPropertyCollectionPlant {
    categories: PPropertiesInCategory[];
  }

  export interface PPropertyCollectionTaxon {
    categories: {
      [k: string]: PPropertiesInCategory;
    };
  }

  export interface PlantPropertiesRequest{
    taxon_id?: number;
  }
  
  export interface PResultsPropertiesForPlant {
    action: string;
    resource: string;
    message: PMessage;
    propertyCollections: PPropertyCollectionPlant;
    plant_id: number;
    propertyCollectionsTaxon: PPropertyCollectionTaxon;
    taxon_id?: number;
  }

  export interface TemporaryAvailableProperties{
    blocked_plant: boolean;
    blocked_taxon: boolean;
    property_name: string;
    property_name_id?: int;
    selected_plant: boolean;
    selected_taxon: boolean;
  }