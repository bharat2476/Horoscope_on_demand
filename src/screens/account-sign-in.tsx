import { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { ChoiceRow } from '@/components/choice-row';
import { ThemedText } from '@/components/themed-text';
import { space } from '@/design/tokens';
import {
  deleteSignedInAccount,
  requestAccountRecovery,
  signIn,
  signOut,
  syncSignedInPreferences,
  type AuthGateway,
} from '@/modules/authentication';
import { type MessageKey } from '@/modules/localization';
import { type AppPreferences } from '@/modules/preferences';

type AccountSignInProps = {
  gateway: AuthGateway;
  preferences: AppPreferences;
  onPreferences: (next: AppPreferences) => void;
  t: (key: MessageKey) => string;
};

export function AccountSignIn({ gateway, preferences, onPreferences, t }: AccountSignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signedIn, setSignedIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.getSession().then((session) => {
      if (active) {
        setSignedIn(session !== null);
      }
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  return (
    <>
      <TextInput
        accessibilityLabel={t('settings.email')}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.field}
      />
      <TextInput
        accessibilityLabel={t('settings.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.field}
      />
      <ChoiceRow
        label={t('settings.signIn')}
        selected={false}
        onPress={() => {
          void signIn(gateway, email, password).then((result) => {
            setSignedIn(result.ok);
            setMessage(result.ok ? null : result.reason);
          });
        }}
      />
      <ChoiceRow
        label={t('settings.forgotPassword')}
        selected={false}
        onPress={() => {
          void requestAccountRecovery(gateway, email).then((result) => {
            setMessage(result.ok ? null : result.reason);
          });
        }}
      />
      <ChoiceRow
        label={t('settings.signOut')}
        selected={false}
        onPress={() => {
          void signOut(gateway).then(() => setSignedIn(false));
        }}
      />
      <ThemedText type="section">{t('settings.migrationTitle')}</ThemedText>
      <ChoiceRow
        label={t('settings.migrationCopy')}
        selected={false}
        onPress={() => {
          void syncSignedInPreferences(gateway, preferences, {
            understood: true,
            choice: 'copy-this-device-to-account',
          }).then((result) => {
            if (result.ok) {
              onPreferences(result.value);
            }
            setMessage(result.ok ? null : result.reason);
          });
        }}
      />
      <ThemedText type="caption">{t('settings.deleteAccountNote')}</ThemedText>
      <ChoiceRow
        label={t('settings.deleteAccount')}
        selected={false}
        onPress={() => {
          if (!signedIn) {
            setMessage('not-signed-in');
            return;
          }
          void deleteSignedInAccount(gateway, { understood: true, clearDevice: false }).then(
            (result) => {
              if (result.ok) {
                setSignedIn(false);
              }
              setMessage(result.ok ? null : result.reason);
            },
          );
        }}
      />
      {message ? <ThemedText type="caption">{message}</ThemedText> : null}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: space.sm,
    marginBottom: space.sm,
  },
});
