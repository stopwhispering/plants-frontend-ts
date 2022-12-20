import ManagedObject from "sap/ui/base/ManagedObject";

/**
 * @namespace plants.ui.definitions.entities
 */
type StringToNumberMap {
  [key: string]: number;
};

type AnyDict = {
  [key: string]: any;
};

export type ResponseStatus =
      "success"
    | "nocontent"
    | "notmodified";
