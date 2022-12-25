import ManagedObject from "sap/ui/base/ManagedObject";
import { BTaxonTreeNode } from "./Selection";

/**
 * @namespace plants.ui.definitions.entities
 */

  export interface LTaxonTreeNodeInFilterDialog extends BTaxonTreeNode {
    selected: boolean
    nodes?: TaxonTreeNodeInFilterDialog[];
  }  