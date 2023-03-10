
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

export interface BConfirmation {
  action: string;
  message: BMessage;
}
export interface BMessage {
  type: BMessageType;
  message: string;
  description?: string;
}
export interface BSaveConfirmation {
  resource: FBMajorResource;
  message: BMessage;
}