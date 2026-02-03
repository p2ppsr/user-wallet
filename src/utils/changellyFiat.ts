import { invoke } from '@tauri-apps/api/core'

export type ChangellyFiatRequest = {
  method: 'GET' | 'POST'
  path: string
  query?: Record<string, string>
  body?: Record<string, unknown>
}

export type ChangellyFiatResponse<T = unknown> = {
  status: number
  body: T
}

const isTauri = (): boolean => {
  if (typeof window === 'undefined') return false
  return Boolean((window as any).__TAURI__)
}

export async function changellyFiatRequest<T = unknown>(request: ChangellyFiatRequest): Promise<ChangellyFiatResponse<T>> {
  if (!isTauri()) {
    throw new Error('Changelly Fiat API is only available in the desktop wallet build.')
  }

  const response = await invoke<ChangellyFiatResponse<T>>('changelly_fiat_request', { request })
  return response
}

export async function changellyFiatGet<T = unknown>(path: string, query?: Record<string, string>): Promise<T> {
  const response = await changellyFiatRequest<T>({ method: 'GET', path, query })
  if (response.status >= 400) {
    throw new Error((response.body as any)?.message ?? `Changelly request failed (${response.status})`)
  }
  return response.body
}

export async function changellyFiatPost<T = unknown>(path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await changellyFiatRequest<T>({ method: 'POST', path, body })
  if (response.status >= 400) {
    throw new Error((response.body as any)?.message ?? `Changelly request failed (${response.status})`)
  }
  return response.body
}
