export const STATES = [
  { id: 'an', name: 'Andaman and Nicobar Islands' },
  { id: 'ap', name: 'Andhra Pradesh' },
  { id: 'ar', name: 'Arunachal Pradesh' },
  { id: 'as', name: 'Assam' },
  { id: 'br', name: 'Bihar' },
  { id: 'ch', name: 'Chandigarh' },
  { id: 'cg', name: 'Chhattisgarh' },
  { id: 'dd', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { id: 'dl', name: 'Delhi' },
  { id: 'ga', name: 'Goa' },
  { id: 'gj', name: 'Gujarat' },
  { id: 'hr', name: 'Haryana' },
  { id: 'hp', name: 'Himachal Pradesh' },
  { id: 'jk', name: 'Jammu and Kashmir' },
  { id: 'jh', name: 'Jharkhand' },
  { id: 'ka', name: 'Karnataka' },
  { id: 'kl', name: 'Kerala' },
  { id: 'la', name: 'Ladakh' },
  { id: 'ld', name: 'Lakshadweep' },
  { id: 'mp', name: 'Madhya Pradesh' },
  { id: 'mh', name: 'Maharashtra' },
  { id: 'mn', name: 'Manipur' },
  { id: 'ml', name: 'Meghalaya' },
  { id: 'mz', name: 'Mizoram' },
  { id: 'nl', name: 'Nagaland' },
  { id: 'od', name: 'Odisha' },
  { id: 'py', name: 'Puducherry' },
  { id: 'pb', name: 'Punjab' },
  { id: 'rj', name: 'Rajasthan' },
  { id: 'sk', name: 'Sikkim' },
  { id: 'tn', name: 'Tamil Nadu' },
  { id: 'ts', name: 'Telangana' },
  { id: 'tr', name: 'Tripura' },
  { id: 'up', name: 'Uttar Pradesh' },
  { id: 'uk', name: 'Uttarakhand' },
  { id: 'wb', name: 'West Bengal' },
] as const;

export const CITIES = [
  { id: 'an-sri-vijaya-puram', stateId: 'an', name: 'Sri Vijaya Puram (Port Blair)' },
  { id: 'ap-amaravati', stateId: 'ap', name: 'Amaravati' },
  { id: 'ap-visakhapatnam', stateId: 'ap', name: 'Visakhapatnam' },
  { id: 'ap-vijayawada', stateId: 'ap', name: 'Vijayawada' },
  { id: 'ar-itanagar', stateId: 'ar', name: 'Itanagar' },
  { id: 'as-dispur', stateId: 'as', name: 'Dispur' },
  { id: 'as-guwahati', stateId: 'as', name: 'Guwahati' },
  { id: 'br-patna', stateId: 'br', name: 'Patna' },
  { id: 'ch-chandigarh', stateId: 'ch', name: 'Chandigarh' },
  { id: 'cg-raipur', stateId: 'cg', name: 'Raipur' },
  { id: 'dd-daman', stateId: 'dd', name: 'Daman' },
  { id: 'dl-new-delhi', stateId: 'dl', name: 'New Delhi' },
  { id: 'ga-panaji', stateId: 'ga', name: 'Panaji' },
  { id: 'gj-gandhinagar', stateId: 'gj', name: 'Gandhinagar' },
  { id: 'gj-ahmedabad', stateId: 'gj', name: 'Ahmedabad' },
  { id: 'gj-surat', stateId: 'gj', name: 'Surat' },
  { id: 'gj-vadodara', stateId: 'gj', name: 'Vadodara' },
  { id: 'gj-rajkot', stateId: 'gj', name: 'Rajkot' },
  { id: 'hr-gurugram', stateId: 'hr', name: 'Gurugram' },
  { id: 'hr-faridabad', stateId: 'hr', name: 'Faridabad' },
  { id: 'hp-shimla', stateId: 'hp', name: 'Shimla' },
  { id: 'jk-srinagar', stateId: 'jk', name: 'Srinagar' },
  { id: 'jk-jammu', stateId: 'jk', name: 'Jammu' },
  { id: 'jh-ranchi', stateId: 'jh', name: 'Ranchi' },
  { id: 'ka-bengaluru', stateId: 'ka', name: 'Bengaluru' },
  { id: 'ka-mysuru', stateId: 'ka', name: 'Mysuru' },
  { id: 'kl-thiruvananthapuram', stateId: 'kl', name: 'Thiruvananthapuram' },
  { id: 'kl-kochi', stateId: 'kl', name: 'Kochi' },
  { id: 'la-leh', stateId: 'la', name: 'Leh' },
  { id: 'ld-kavaratti', stateId: 'ld', name: 'Kavaratti' },
  { id: 'mp-bhopal', stateId: 'mp', name: 'Bhopal' },
  { id: 'mp-indore', stateId: 'mp', name: 'Indore' },
  { id: 'mh-mumbai', stateId: 'mh', name: 'Mumbai' },
  { id: 'mh-pune', stateId: 'mh', name: 'Pune' },
  { id: 'mh-nagpur', stateId: 'mh', name: 'Nagpur' },
  { id: 'mn-imphal', stateId: 'mn', name: 'Imphal' },
  { id: 'ml-shillong', stateId: 'ml', name: 'Shillong' },
  { id: 'mz-aizawl', stateId: 'mz', name: 'Aizawl' },
  { id: 'nl-kohima', stateId: 'nl', name: 'Kohima' },
  { id: 'od-bhubaneswar', stateId: 'od', name: 'Bhubaneswar' },
  { id: 'py-puducherry', stateId: 'py', name: 'Puducherry' },
  { id: 'pb-amritsar', stateId: 'pb', name: 'Amritsar' },
  { id: 'pb-ludhiana', stateId: 'pb', name: 'Ludhiana' },
  { id: 'rj-jaipur', stateId: 'rj', name: 'Jaipur' },
  { id: 'rj-jodhpur', stateId: 'rj', name: 'Jodhpur' },
  { id: 'rj-udaipur', stateId: 'rj', name: 'Udaipur' },
  { id: 'sk-gangtok', stateId: 'sk', name: 'Gangtok' },
  { id: 'tn-chennai', stateId: 'tn', name: 'Chennai' },
  { id: 'tn-coimbatore', stateId: 'tn', name: 'Coimbatore' },
  { id: 'tn-madurai', stateId: 'tn', name: 'Madurai' },
  { id: 'ts-hyderabad', stateId: 'ts', name: 'Hyderabad' },
  { id: 'tr-agartala', stateId: 'tr', name: 'Agartala' },
  { id: 'up-lucknow', stateId: 'up', name: 'Lucknow' },
  { id: 'up-varanasi', stateId: 'up', name: 'Varanasi' },
  { id: 'up-prayagraj', stateId: 'up', name: 'Prayagraj' },
  { id: 'uk-dehradun', stateId: 'uk', name: 'Dehradun' },
  { id: 'wb-kolkata', stateId: 'wb', name: 'Kolkata' },
] as const;

export type StateId = (typeof STATES)[number]['id'];
export type CityId = (typeof CITIES)[number]['id'];

const STATE_IDS = new Set<string>(STATES.map((state) => state.id));
const CITY_IDS = new Set<string>(CITIES.map((city) => city.id));

export function isStateId(value: unknown): value is StateId {
  return typeof value === 'string' && STATE_IDS.has(value);
}

export function isCityId(value: unknown): value is CityId {
  return typeof value === 'string' && CITY_IDS.has(value);
}

export function stateIdForCity(cityId: string | null): StateId | null {
  if (!isCityId(cityId)) {
    return null;
  }
  return CITIES.find((city) => city.id === cityId)?.stateId ?? null;
}

export function citiesInState(stateId: string | null): readonly (typeof CITIES)[number][] {
  if (!isStateId(stateId)) {
    return [];
  }
  return CITIES.filter((city) => city.stateId === stateId);
}

export function cityName(cityId: string | null): string | null {
  if (!isCityId(cityId)) {
    return null;
  }
  return CITIES.find((city) => city.id === cityId)?.name ?? null;
}
