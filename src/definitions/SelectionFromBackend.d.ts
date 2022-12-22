import ManagedObject from "sap/ui/base/ManagedObject";

/**
 * @namespace plants.ui.definitions.entities
 */
export interface PTaxonTreeNode {
    //recursive!
    key: string;
    level: number;
    count: number;
    nodes?: PTaxonTreeNode[];
    plant_ids?: number[];
  }