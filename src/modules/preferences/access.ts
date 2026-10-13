export type PreferenceActor = {
  userId: string | null;
};

export function canReadPublicContent(_actor: PreferenceActor): true {
  return true;
}

export function canReadPrivatePreferences(actor: PreferenceActor, ownerId: string): boolean {
  return actor.userId !== null && actor.userId === ownerId;
}

export function canWritePrivatePreferences(actor: PreferenceActor, ownerId: string): boolean {
  return canReadPrivatePreferences(actor, ownerId);
}
