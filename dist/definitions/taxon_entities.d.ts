import ManagedObject from "sap/ui/base/ManagedObject";
import { PMessage } from "./entities";

/**
 * @namespace plants.ui.definitions
 */
export interface PDistribution {
    native: string[];
    introduced: string[];
}

export interface PTaxonImage {
    id?: number;
    filename: string;
    description?: string;
}

export interface PTraitCategoryWithTraits {
    id?: number;
    category_name: string;
    sort_flag?: number;
    traits: PTraitWithStatus[];
}
export interface PTraitWithStatus {
    id?: number;
    trait: string;
    status: string;
}

export interface PTaxon {
    id: number;
    name: string;
    is_custom: boolean;
    subsp?: string;
    species?: string;
    subgen?: string;
    genus: string;
    family: string;
    phylum?: string;
    kingdom?: string;
    rank: string;
    taxonomic_status?: string;
    name_published_in_year?: number;
    synonym: boolean;
    fq_id?: string;
    authors?: string;
    basionym?: string;
    synonyms_concat?: string;
    distribution_concat?: string;
    hybrid: boolean;
    hybridgenus: boolean;
    gbif_id?: string;
    powo_id?: string;
    custom_notes?: string;
    ipni_id_short: string;
    distribution?: PDistribution;
    images?: PTaxonImage[];
    trait_categories?: PTraitCategoryWithTraits[];
    occurrenceImages?: PTaxonOccurrenceImage[];
}
export interface PTaxonOccurrenceImage {
    occurrence_id: number;
    img_no: number;
    gbif_id: number;
    scientific_name: string;
    basis_of_record: string;
    verbatim_locality?: string;
    date: string;
    creator_identifier: string;
    publisher_dataset?: string;
    references?: string;
    href: string;
    filename_thumbnail: string;
}

export interface PKewSearchResultEntry {
    source: string;
    id: number;
    count: number;
    count_inactive: number;
    is_custom: boolean;
    synonym: boolean;
    authors: string;
    family: string;
    name: string;
    rank: string;
    fqId?: string;
    powo_id: string;
    genus: string;
    species?: string;
    namePublishedInYear: string;
    phylum: string;
    synonyms_concat: string;
  }

export interface PResultsTaxonInfoRequest {
    action: string;
    resource: string;
    message: PMessage;
    ResultsCollection: PKewSearchResultEntry[];
  }

  export interface PResultsFetchTaxonImages {
    action: string;
    resource: string;
    message: PMessage;
    occurrenceImages?: PTaxonOccurrenceImage[];
  }

  export interface PResultsSaveTaxonRequest {
    action: string;
    resource: string;
    message: PMessage;
    botanical_name: string;
    taxon_data: PTaxon;
  }