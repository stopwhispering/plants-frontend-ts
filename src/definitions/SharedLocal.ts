import ManagedObject from "sap/ui/base/ManagedObject";
import { BResultsRetrieveTaxonDetailsRequest } from "./Taxon";

/**
 * @namespace plants.ui.definitions.entities
 */
export type StringToNumberMap = {
  [key: string]: number;
};

export type AnyDict = {
  [key: string]: any;
};

export type ResponseStatus =
  "success"
  | "nocontent"
  | "notmodified";

export interface LIdToFragmentMap {
  [key: string]: string;  // e.g. dialogRenamePlant: "plants.ui.view.fragments.DetailRename"
}

export interface LStatusModelData {
  preview_image: string;
  filterBarVisible: boolean;
  filterBarLabel: string;
}