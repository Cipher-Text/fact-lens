import { cropSchema, type Crop } from '@fact-lens/contracts';

export function validateCrop(crop: Crop): boolean {
  return cropSchema.safeParse(crop).success;
}

export function headlineDefault(title: string | null | undefined): string {
  return title?.trim() ?? '';
}
