import ManagedObject from "sap/ui/base/ManagedObject";
import { PTaxonTreeNode } from "./SelectionFromBackend";

/**
 * @namespace plants.ui.definitions.entities
 */

  export interface LTaxonTreeNodeInFilterDialog extends PTaxonTreeNode {
    selected: boolean
    nodes?: TaxonTreeNodeInFilterDialog[];
  }  