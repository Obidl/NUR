import type { UserDocument } from './user.model.js';
import type { PublicUser, UserRole } from './auth.types.js';

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role as UserRole,
    preferences: {
      theme: user.preferences?.theme ?? 'system',
      quranFontSize: user.preferences?.quranFontSize ?? 22,
      reduceMotion: user.preferences?.reduceMotion ?? false,
      language: user.preferences?.language ?? 'uz',
    },
  };
}

export function toAuthUser(user: UserDocument) {
  const publicUser = toPublicUser(user);
  return {
    id: publicUser.id,
    email: publicUser.email,
    displayName: publicUser.displayName,
    role: publicUser.role,
  };
}
