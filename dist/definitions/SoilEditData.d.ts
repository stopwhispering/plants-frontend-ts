
export interface SoilEditData {
    // for new soil or editing existing soil
    dialog_title: string;
    btn_text: string;
    new: boolean;
    id?: int; // undefined for new soil
    soil_name: string;
    description: string;
    mix: string;
}
