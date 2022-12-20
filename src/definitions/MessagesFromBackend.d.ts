
import ManagedObject from "sap/ui/base/ManagedObject";
/**
 * @namespace plants.ui.definitions
 */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/
export type MessageType = "Information" | "None" | "Success" | "Warning" | "Error" | "Debug";

export interface PConfirmation {
  action: string;
  resource: string;
  message: PMessage;
}
export interface PMessage {
  type: MessageType;
  message: string;
  additionalText?: string;
  description?: string;
}
