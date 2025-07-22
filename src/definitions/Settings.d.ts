import ManagedObject from "sap/ui/base/ManagedObject";
import { BackendMessage } from "./Messages";

/**
 * @namespace plants.ui.definitions
 */
export type BMessageType = "Information" | "None" | "Success" | "Warning" | "Error" | "Debug";

export interface ResponseContainer {
  action?: string;
  message: BackendMessage;
}

export interface SettingsBase{
  last_image_warning_after_n_days: number;
}

export interface SettingsRead extends SettingsBase {
  last_updated_at: string;
}

export interface GetSettingsResponse extends ResponseContainer {
    settings: SettingsRead;
}

export interface UpdateSettingsResponse extends ResponseContainer {
    settings: SettingsRead;
}
