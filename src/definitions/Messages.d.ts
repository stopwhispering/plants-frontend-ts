
import ManagedObject from "sap/ui/base/ManagedObject";
/**
 * @namespace plants.ui.definitions
 */
export type BMessageType = "Information" | "None" | "Success" | "Warning" | "Error" | "Debug";
export type FBMajorResource =
  | "PlantResource"
  | "ImageResource"
  | "TaxonResource"
  | "EventResource"
  | "PlantPropertyResource"
  | "TaxonPropertyResource";

export interface BackendConfirmation {
  action?: string;
  message: BackendMessage;
}
export interface BackendMessage {
  type: BMessageType;
  message: string;
  description?: string;
}
export interface BackendSaveConfirmation {
  resource: FBMajorResource;
  message: BackendMessage;
}