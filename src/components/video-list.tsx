import * as Linking from 'expo-linking';

import { ChoiceRow } from '@/components/choice-row';
import { ThemedText } from '@/components/themed-text';
import { type VideoRecord } from '@/modules/videos';

type VideoListProps = {
  videos: readonly VideoRecord[];
  empty: string;
  note: string;
  openLabel: string;
};

export function VideoList({ videos, empty, note, openLabel }: VideoListProps) {
  return (
    <>
      <ThemedText type="caption">{note}</ThemedText>
      {videos.length === 0 ? <ThemedText>{empty}</ThemedText> : null}
      {videos.map((video) => (
        <ChoiceRow
          key={video.id}
          label={`${openLabel}: ${video.title}`}
          selected={false}
          onPress={() => {
            void Linking.openURL(video.watchUrl);
          }}
        />
      ))}
    </>
  );
}
