import { PMessage } from "./entities";

/**
 * @namespace plants.ui.definitions
 */
export type LTagState = "None" | "Indication01" | "Success" | "Information" | "Error" | "Warning" | "Indication06" | "Indication07";

export interface LImageMap{
    [key: string]: PImage;  // filenae to PImage
}
