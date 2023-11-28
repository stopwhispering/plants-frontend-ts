import ManagedObject from "sap/ui/base/ManagedObject";
import { ResponseContainer } from "./Images";

/**
 * @namespace plants.ui.definitions.entities
 */
export interface GetSelectionDataResponse extends ResponseContainer {
  Selection: TaxonTreeRoot;
}

export interface TaxonTreeRoot {
  TaxonTree: TaxonTreeNode[];
}

export interface TaxonTreeNode {
  key: string;
  level: number;
  count: number;
  nodes?: TaxonTreeNode[];
  plant_ids?: number[];
}
