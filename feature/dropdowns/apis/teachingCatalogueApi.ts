import { apiRequest, protectedRequest } from '../../../utils/api/request';

export type TeachingCatalogue = {
  version: string;
  title: string;
  description: string;
  schoolType: 'PRIMARY' | 'SECONDARY' | null;
  categories: {
    name: string;
    subjects: { name: string; aliases: string[]; skills: string[] }[];
  }[];
  sharedSkills: string[];
  keyStages: string[];
};

export function getTeachingCatalogue(schoolType?: string) {
  const query = schoolType
    ? '?schoolType=' + encodeURIComponent(schoolType)
    : '';
  return apiRequest<TeachingCatalogue>('/teaching-catalogue' + query);
}

export function getSchoolTeachingCatalogue() {
  return protectedRequest<TeachingCatalogue>('/teaching-catalogue/school');
}
