import ManagedObject from "sap/ui/base/ManagedObject";
import { TaxonTreeNode } from "./Selection";

/**
 * @namespace plants.ui.definitions.entities
 */

  export interface LTaxonTreeNodeInFilterDialog extends TaxonTreeNode {
    selected: boolean
    nodes?: TaxonTreeNodeInFilterDialog[];
  }  