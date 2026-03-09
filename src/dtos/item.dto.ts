export interface CreateItemRequestBodyDTO {
  name: string;
  description?: string;
}

export interface UpdateItemRequestBodyDTO {
  name?: string;
  description?: string;
}

interface ItemResponseDTO {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateItemResponseDTO = ItemResponseDTO;
export type GetItemResponseDTO = ItemResponseDTO;
export type UpdateItemResponseDTO = ItemResponseDTO;
export type DeleteItemResponseDTO = ItemResponseDTO;
