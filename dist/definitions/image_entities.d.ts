import { PMessage } from "./entities";

/**
 * @namespace plants.ui.definitions
 */
export interface PKeyword {
    keyword: string;
}

export interface PImagePlantTag {
  plant_id?: number;
  key: string;
  text: string;
}

export type TagState = "None" | "Indication01" | "Success" | "Information" | "Error" | "Warning" | "Indication06" | "Indication07";

export interface PImage {
    filename: string;
    keywords: PKeyword[];
    plants: PPlantTag[];
    description?: string;
    record_date_time?: string;
}

export interface ImageMap{
    [key: string]: PImage;  // filenae to PImage
}

export interface PResultsImageResource {
    ImagesCollection: PImage[];
    message: PMessage;
  }

  export interface PImageUploadedMetadata {
    plants: number[];
    keywords: string[];
  }