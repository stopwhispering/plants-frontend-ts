
import ManagedObject from "sap/ui/base/ManagedObject";
/**
 * @namespace plants.ui.definitions
 */
export type BMessageType = "Information" | "None" | "Success" | "Warning" | "Error" | "Debug";

export interface BConfirmation {
  action: string;
  resource: string;
  message: BMessage;
}
export interface BMessage {
  type: BMessageType;
  message: string;
  additionalText?: string;
  description?: string;
}