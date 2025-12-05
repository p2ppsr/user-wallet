/**
 * Sorts and groups an array of permissions by domain and counterparty.
 *
 * This function takes an array of permission objects and organizes them into a nested structure
 * based on the domain and counterparty values. It groups permissions by domain and then by
 * counterparty within each domain, ensuring that each counterparty is listed only once per domain.
 *
 * This allows permissions to be revoked on a per-counterparty basis.
 *
 * @param {Array} permissions - An array of permission objects to be sorted and grouped.
 *
 * @returns {Array} An array of objects, each representing a domain with its unique permissions
 */
import { PermissionToken } from '@bsv/wallet-toolbox-client'

type PermissionWithDomain = PermissionToken & {
  domain?: string
  originator?: string
}

export interface PermissionGroup {
  originator: string
  permissions: PermissionToken[]
}

type PermissionAccumulator = Record<string, PermissionToken[]>

const sortPermissions = (permissions: PermissionWithDomain[]): PermissionGroup[] => {
  const groupedPermissions = permissions.reduce<PermissionAccumulator>((acc, curr) => {
    const key = curr.domain ?? curr.originator ?? 'unknown'
    if (!acc[key]) {
      acc[key] = [curr]
    } else {
      const exists = acc[key].some(entry => entry.originator === curr.originator)
      if (!exists) {
        acc[key].push(curr)
      }
    }
    return acc
  }, {})

  return Object.entries(groupedPermissions).map(([originator, grouped]) => ({
    originator,
    permissions: grouped
  }))
}

export default sortPermissions
