import ManagedObject from "sap/ui/base/ManagedObject";
import { ResponseContainer } from "./Images";
import { BackendMessage } from "./Messages";

/**
 * @namespace plants.ui.definitions.TaxonFromBackend
 */
export type TaxonSearchResultSource =
  | "Local DB"
  | "Plants of the World"
  | "International Plant Names Index + Plants of the World";

  export interface KewSearchResultEntry {
    id?: number;
    in_db: boolean;
    count: number;
    count_inactive: number;
    synonym: boolean;
    authors: string;
    family: string;
    name: string;
    rank: string;
    taxonomic_status: string;
    lsid: string;
    genus: string;
    species?: string;
    infraspecies?: string;
    is_custom: boolean;
    custom_rank?: FBRank;
    custom_infraspecies?: string;
    cultivar?: string;
    affinis?: string;
    custom_suffix?: string;
    hybrid: boolean;
    hybridgenus: boolean;
    name_published_in_year: number;
    basionym?: string;
    // phylum: string;
    synonyms_concat?: string;
    distribution_concat?: string;
  }
  
export interface FetchTaxonOccurrenceImagesResponse extends ResponseContainer {
  occurrence_images: TaxonOccurrenceImage[];
}
export interface TaxonOccurrenceImage {
  occurrence_id: number;
  img_no: number;
  gbif_id: number;
  scientific_name: string;
  basis_of_record: string;
  verbatim_locality?: string;
  photographed_at: string;
  creator_identifier: string;
  publisher_dataset?: string;
  references?: string;
  href: string;
}
export interface GetTaxonResponse extends ResponseContainer {
  taxon: TaxonRead;
}
export interface TaxonRead {
  id: number;
  name: string;
  is_custom: boolean;
  subsp?: string;
  species?: string;
  subgen?: string;
  genus: string;
  family: string;
  // phylum?: string;
  kingdom?: string;
  rank: string;
  taxonomic_status?: string;
  name_published_in_year?: number;
  synonym: boolean;
  lsid?: string;
  authors?: string;
  basionym?: string;
  synonyms_concat?: string;
  distribution_concat?: string;
  hybrid: boolean;
  hybridgenus: boolean;
  gbif_id?: int;
  custom_notes?: string;
  distribution: DistributionRead;
  images: TaxonImageRead[];
  occurrence_images: TaxonOccurrenceImage[];
}
export interface DistributionRead {
  native: string[];
  introduced: string[];
}
export interface TaxonImageRead {
  id: number;
  description?: string;
}
export interface SearchTaxaResponse {
  action: string;
  message: BackendMessage;
  ResultsCollection: KewSearchResultEntry[];
}
export interface FetchTaxonOccurrenceImagesRequest {
  gbif_id: number;
}
export interface UpdateTaxaRequest {
  ModifiedTaxaCollection: TaxonUpdate[];
}
export interface TaxonUpdate {
  id: number;
  name: string;
  is_custom: boolean;
  subsp?: string;
  species?: string;
  subgen?: string;
  genus: string;
  family: string;
  // phylum?: string;
  kingdom?: string;
  rank: string;
  taxonomic_status?: string;
  name_published_in_year?: number;
  synonym: boolean;
  lsid?: string;
  authors?: string;
  basionym?: string;
  synonyms_concat?: string;
  distribution_concat?: string;
  hybrid: boolean;
  hybridgenus: boolean;
  gbif_id?: int;
  custom_notes?: string;
  distribution?: DistributionRead;
  images?: TaxonImageUpdate[];
}
export interface TaxonImageUpdate {
  id: number;
  description?: string;
}
export interface FTaxonOccurrenceImage {
  occurrence_id: number;
  img_no: number;
  gbif_id: number;
  scientific_name: string;
  basis_of_record: string;
  verbatim_locality?: string;
  photographed_at: string;
  creator_identifier: string;
  publisher_dataset?: string;
  references?: string;
  href: string;
}
export interface SearchTaxaRequest {
  include_external_apis: boolean;
  taxon_name_pattern: string;
  search_for_genus_not_species: boolean;
}

export interface CreateBotanicalNameResponse {
  full_html_name: string;
  name: string;
}

export interface CreateBotanicalNameRequest {
  rank: string;
  genus: string;
  species?: string;
  infraspecies?: string;
  hybrid: boolean;
  hybridgenus: boolean;
  authors?: string;
  name_published_in_year?: number;

  is_custom: boolean;
  cultivar?: string;
  affinis?: string;
  custom_rank?: string;
  custom_infraspecies?: string;
  custom_suffix?: string;
}

export interface CreateTaxonResponse extends ResponseContainer{
  new_taxon: TaxonRead;
}

export interface FNewTaxon {
  id?: number;
  rank: string;
  family: string;
  genus: string;
  species?: string;
  infraspecies?: string;
  lsid: string;
  taxonomic_status: string;
  synonym: boolean;
  authors: string;
  name_published_in_year?: number;
  basionym?: string;
  hybrid: boolean;
  hybridgenus: boolean;
  synonyms_concat?: string;
  distribution_concat?: string;
  is_custom: boolean;
  custom_rank?: FBRank;
  custom_infraspecies?: string;
  cultivar?: string;
  affinis?: string;
  custom_suffix?: string;
}