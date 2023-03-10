import ManagedObject from "sap/ui/base/ManagedObject";

/**
 * @namespace plants.ui.definitions.entities
 */
export interface BResultsSelection {
  action: string;
  resource: string;
  message: BMessage;
  Selection: BTaxonTreeRoot;
}

export interface BTaxonTreeRoot {
  TaxonTree: BTaxonTreeNode[];
}

export interface BTaxonTreeNode {
  key: string;
  level: number;
  count: number;
  nodes?: BTaxonTreeNode[];
  plant_ids?: number[];
}
