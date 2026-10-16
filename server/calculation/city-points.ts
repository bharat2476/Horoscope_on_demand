import { CITIES, type CityId } from '@/modules/places/index';

/**
 * Provisional WGS84 centroids. Elevation is 0 because no gazetteer elevation is pinned.
 * These points are not stored on the public city list.
 */
export const CITY_POINTS: Record<CityId, { latitude: number; longitude: number }> = {
  'an-sri-vijaya-puram': { latitude: 11.6234, longitude: 92.7265 },
  'ap-amaravati': { latitude: 16.541, longitude: 80.515 },
  'ap-visakhapatnam': { latitude: 17.6868, longitude: 83.2185 },
  'ap-vijayawada': { latitude: 16.5062, longitude: 80.648 },
  'ar-itanagar': { latitude: 27.0844, longitude: 93.6053 },
  'as-dispur': { latitude: 26.1433, longitude: 91.7898 },
  'as-guwahati': { latitude: 26.1445, longitude: 91.7362 },
  'br-patna': { latitude: 25.5941, longitude: 85.1376 },
  'ch-chandigarh': { latitude: 30.7333, longitude: 76.7794 },
  'cg-raipur': { latitude: 21.2514, longitude: 81.6296 },
  'dd-daman': { latitude: 20.3974, longitude: 72.8328 },
  'dl-new-delhi': { latitude: 28.6139, longitude: 77.209 },
  'ga-panaji': { latitude: 15.4909, longitude: 73.8278 },
  'gj-gandhinagar': { latitude: 23.2156, longitude: 72.6369 },
  'gj-ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
  'gj-surat': { latitude: 21.1702, longitude: 72.8311 },
  'gj-vadodara': { latitude: 22.3072, longitude: 73.1812 },
  'gj-rajkot': { latitude: 22.3039, longitude: 70.8022 },
  'hr-gurugram': { latitude: 28.4595, longitude: 77.0266 },
  'hr-faridabad': { latitude: 28.4089, longitude: 77.3178 },
  'hp-shimla': { latitude: 31.1048, longitude: 77.1734 },
  'jk-srinagar': { latitude: 34.0837, longitude: 74.7973 },
  'jk-jammu': { latitude: 32.7266, longitude: 74.857 },
  'jh-ranchi': { latitude: 23.3441, longitude: 85.3096 },
  'ka-bengaluru': { latitude: 12.9716, longitude: 77.5946 },
  'ka-mysuru': { latitude: 12.2958, longitude: 76.6394 },
  'kl-thiruvananthapuram': { latitude: 8.5241, longitude: 76.9366 },
  'kl-kochi': { latitude: 9.9312, longitude: 76.2673 },
  'la-leh': { latitude: 34.1526, longitude: 77.5771 },
  'ld-kavaratti': { latitude: 10.5593, longitude: 72.6358 },
  'mp-bhopal': { latitude: 23.2599, longitude: 77.4126 },
  'mp-indore': { latitude: 22.7196, longitude: 75.8577 },
  'mh-mumbai': { latitude: 19.076, longitude: 72.8777 },
  'mh-pune': { latitude: 18.5204, longitude: 73.8567 },
  'mh-nagpur': { latitude: 21.1458, longitude: 79.0882 },
  'mn-imphal': { latitude: 24.817, longitude: 93.9368 },
  'ml-shillong': { latitude: 25.5788, longitude: 91.8933 },
  'mz-aizawl': { latitude: 23.7271, longitude: 92.7176 },
  'nl-kohima': { latitude: 25.6751, longitude: 94.1086 },
  'od-bhubaneswar': { latitude: 20.2961, longitude: 85.8245 },
  'py-puducherry': { latitude: 11.9416, longitude: 79.8083 },
  'pb-amritsar': { latitude: 31.634, longitude: 74.8723 },
  'pb-ludhiana': { latitude: 30.901, longitude: 75.8573 },
  'rj-jaipur': { latitude: 26.9124, longitude: 75.7873 },
  'rj-jodhpur': { latitude: 26.2389, longitude: 73.0243 },
  'rj-udaipur': { latitude: 24.5854, longitude: 73.7125 },
  'sk-gangtok': { latitude: 27.3389, longitude: 88.6065 },
  'tn-chennai': { latitude: 13.0827, longitude: 80.2707 },
  'tn-coimbatore': { latitude: 11.0168, longitude: 76.9558 },
  'tn-madurai': { latitude: 9.9252, longitude: 78.1198 },
  'ts-hyderabad': { latitude: 17.385, longitude: 78.4867 },
  'tr-agartala': { latitude: 23.8315, longitude: 91.2868 },
  'up-lucknow': { latitude: 26.8467, longitude: 80.9462 },
  'up-varanasi': { latitude: 25.3176, longitude: 82.9739 },
  'up-prayagraj': { latitude: 25.4358, longitude: 81.8463 },
  'uk-dehradun': { latitude: 30.3165, longitude: 78.0322 },
  'wb-kolkata': { latitude: 22.5726, longitude: 88.3639 },
};

export const CITY_TIME_ZONE = 'Asia/Kolkata';
export const CITY_ELEVATION_METERS = 0;

export function cityPoint(cityId: string): { latitude: number; longitude: number } | null {
  if (!CITIES.some((city) => city.id === cityId)) {
    return null;
  }
  return CITY_POINTS[cityId as CityId] ?? null;
}
