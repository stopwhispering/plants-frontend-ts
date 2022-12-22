import ManagedObject from "sap/ui/base/ManagedObject";

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

export interface IdToFragmentMap {
  [key: string]: string;  // e.g. dialogRenamePlant: "plants.ui.view.fragments.DetailRename"
}
