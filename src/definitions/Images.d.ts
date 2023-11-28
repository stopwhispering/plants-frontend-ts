import ManagedObject from "sap/ui/base/ManagedObject";
import { BackendMessage } from "./Messages";

/**
 * @namespace plants.ui.definitions
 */
export type BMessageType = "Information" | "None" | "Success" | "Warning" | "Error" | "Debug";

export interface UpdateImageRequest {
  ImagesCollection: ImageRead[];
}
export interface Keyword {
  keyword: string;
}
export interface ImagePlantTag {
  plant_id?: number;
  plant_name: string;
  plant_name_short: string;
}
export interface DeleteImagesResponse extends ResponseContainer {
}

export interface ResponseContainer {
  action?: string;
  message: BackendMessage;
}
export interface GetUntaggedImagesResponse extends ResponseContainer{
  ImagesCollection: ImageRead[];
}
export interface UploadImagesResponse extends ResponseContainer {
  images: ImageRead[];
}
export interface UploadedImageMetadata {
  plants: number[];
  keywords: string[];
}

export interface ImageRead {
  id: number;
  filename: string;
  keywords: Keyword[];
  plants: ImagePlantTag[];
  description?: string;
  record_date_time?: string;
}