import ManagedObject from "sap/ui/base/ManagedObject";
import { BMessage } from "./Messages";

/**
 * @namespace plants.ui.definitions
 */
export type FBImages = FBImage[];
export type BMessageType = "Information" | "None" | "Success" | "Warning" | "Error" | "Debug";

export interface BImageUpdated {
  ImagesCollection: FBImages;
}
export interface FBImage {
  id: number;
  filename: string;
  keywords: FBKeyword[];
  plants: FBImagePlantTag[];
  description?: string;
  record_date_time?: string;
}
export interface FBKeyword {
  keyword: string;
}
export interface FBImagePlantTag {
  plant_id?: number;
  plant_name: string;
  plant_name_short: string;
  // key: string;
  // text: string;
}
export interface BResultsImageDeleted {
  action: string;
  resource: string;
  message: BMessage;
}
export interface BResultsImageResource {
  ImagesCollection: FBImages;
  message: BMessage;
}
export interface BResultsImagesUploaded {
  action: string;
  resource: string;
  message: BMessage;
  images: FBImages;
}
export interface FImageUploadedMetadata {
  plants: number[];
  keywords: string[];
}

export interface ImageRead {
  id: number;
  filename: string;
  keywords: FBKeyword[];
  plants: FBImagePlantTag[];
  description?: string;
  record_date_time?: string;
}