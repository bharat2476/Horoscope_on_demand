import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FilterBar } from '@/components/filter-bar';
import { ThemedText } from '@/components/themed-text';
import { space } from '@/design/tokens';
import {
  STATES,
  citiesInState,
  isCityId,
  stateIdForCity,
  type CityId,
  type StateId,
} from '@/modules/places';

const ALL = 'all';

type PlacePickerProps = {
  cityId: string | null;
  onChangeCity: (cityId: CityId | null) => void;
  allowAll?: boolean;
  stateLabel: string;
  cityLabel: string;
  allLabel: string;
  emptyCityLabel: string;
};

export function PlacePicker({
  cityId,
  onChangeCity,
  allowAll = false,
  stateLabel,
  cityLabel,
  allLabel,
  emptyCityLabel,
}: PlacePickerProps) {
  const [pickedState, setPickedState] = useState<StateId | typeof ALL | null>(() =>
    stateIdForCity(cityId),
  );
  const [seenCityId, setSeenCityId] = useState(cityId);

  if (cityId !== seenCityId) {
    setSeenCityId(cityId);
    const nextState = stateIdForCity(cityId);
    if (nextState) {
      setPickedState(nextState);
    }
  }

  const selectedState = pickedState ?? (allowAll ? ALL : '');
  const stateOptions = [
    ...(allowAll ? [{ id: ALL, label: allLabel }] : []),
    ...STATES.map((state) => ({ id: state.id, label: state.name })),
  ];
  const cities = citiesInState(selectedState === ALL ? null : selectedState);

  return (
    <View style={styles.group}>
      <FilterBar
        label={stateLabel}
        options={stateOptions}
        selectedId={selectedState}
        onSelect={(id) => {
          if (id === ALL) {
            setPickedState(ALL);
            onChangeCity(null);
            return;
          }
          setPickedState(id as StateId);
          if (stateIdForCity(cityId) !== id) {
            onChangeCity(null);
          }
        }}
      />
      {cities.length > 0 ? (
        <FilterBar
          label={cityLabel}
          options={cities.map((city) => ({ id: city.id, label: city.name }))}
          selectedId={cityId && isCityId(cityId) ? cityId : ''}
          onSelect={(id) => {
            if (isCityId(id)) {
              onChangeCity(id);
            }
          }}
        />
      ) : (
        <View style={styles.emptyCity}>
          <ThemedText type="label">{cityLabel}</ThemedText>
          <ThemedText type="caption">{emptyCityLabel}</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: space.md,
  },
  emptyCity: {
    gap: space.xs,
  },
});
