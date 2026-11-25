import { apiClient } from '../../../shared/lib/api/client'
import { normalizePublicPlayer } from '../lib/normalizeProfile'
import type { PublicPlayer, UpdatePasswordPayload, UpdateProfilePayload } from '../types'

export async function fetchPublicPlayer(handle: string, signal?: AbortSignal): Promise<PublicPlayer | null> {
  return normalizePublicPlayer(
    await apiClient.get<unknown>(`/api/players/${encodeURIComponent(handle)}`, signal),
  )
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<void> {
  await apiClient.patch<unknown>('/api/me/profile', payload)
}

export async function updatePassword(payload: UpdatePasswordPayload): Promise<void> {
  await apiClient.patch<unknown>('/api/me/password', payload)
}

export async function uploadAvatar(file: File): Promise<void> {
  const formData = new FormData()
  formData.append('avatar', file)
  await apiClient.upload<unknown>('/api/me/avatar', formData)
}

export async function deleteAvatar(): Promise<void> {
  await apiClient.delete<unknown>('/api/me/avatar')
}
