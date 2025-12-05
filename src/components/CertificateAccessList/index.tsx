import { useState, useEffect, useCallback, useContext, useMemo, type MouseEvent } from 'react'
import {
  List,
  ListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  Button,
  Paper,
  ListSubheader,
  CircularProgress,
  Stack,
  Box,
  Alert
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { WalletContext } from '../../WalletContext'

// Simple cache for certificate permissions
const CERT_CACHE = new Map<string, GrantItem[]>();
import CertificateChip from '../CertificateChip'
import AppChip from '../AppChip'
import sortPermissions from './sortPermissions'
import { toast } from 'react-toastify'
import { PermissionToken } from '@bsv/wallet-toolbox-client'

interface AppGrant {
  originator: string
  permissions: PermissionToken[]
}

// When the list is not displayed as apps, we assume that the grant is simply a Permission.
type GrantItem = AppGrant | PermissionToken

const isAppGrant = (grant: GrantItem): grant is AppGrant =>
  Array.isArray((grant as AppGrant).permissions)

// Props for the CertificateAccessList component.
interface CertificateAccessListProps {
  app?: string
  itemsDisplayed?: 'certificates' | 'apps'
  counterparty?: string
  type?: string
  certTypeFilter?: string
  limit?: number
  displayCount?: boolean
  listHeaderTitle?: string
  showEmptyList?: boolean
  canRevoke?: boolean
  onEmptyList?: () => void
}

const CertificateAccessList = ({
  app,
  itemsDisplayed = 'certificates',
  counterparty = '',
  type = 'certificate',
  certTypeFilter,
  limit,
  canRevoke = false,
  displayCount = true,
  listHeaderTitle,
  showEmptyList = false,
  onEmptyList = () => { }
}: CertificateAccessListProps) => {
  const navigate = useNavigate()
  // Build stable query key
  const queryKey = useMemo(
    () => JSON.stringify({ app, itemsDisplayed, counterparty, type, certTypeFilter }),
    [app, itemsDisplayed, counterparty, type, certTypeFilter]
  );
  const [grants, setGrants] = useState<GrantItem[]>([])
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [currentAccessGrant, setCurrentAccessGrant] = useState<PermissionToken | null>(null)
  const [currentApp, setCurrentApp] = useState<AppGrant | null>(null)
  const [dialogLoading, setDialogLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const { managers } = useContext(WalletContext)
  const normalizedApp = useMemo(() => app ? app.replace(/^https?:\/\//, '') : undefined, [app])
  const refreshGrants = useCallback(async (force: boolean = false) => {
    try {
      setError(null)
      if (!managers?.permissionsManager) return

      if (!force && CERT_CACHE.has(queryKey)) {
        setGrants(CERT_CACHE.get(queryKey)!);
        return;
      }

      // invalidate cache for this key when forcing
      if (force) {
        CERT_CACHE.delete(queryKey)
      }
      const permissions: PermissionToken[] = await managers.permissionsManager.listCertificateAccess({
        originator: normalizedApp
      })
      let filtered = counterparty
        ? permissions.filter(perm => perm.counterparty === counterparty)
        : permissions
      if (certTypeFilter) {
        filtered = filtered.filter(perm => perm.certType === certTypeFilter)
      }
      if (itemsDisplayed === 'apps') {
        const results = sortPermissions(filtered)
        setGrants(results)
        CERT_CACHE.set(queryKey, results)
      } else {
        setGrants(filtered)
        CERT_CACHE.set(queryKey, filtered)
      }

      if (filtered.length === 0) {
        onEmptyList()
      }
    } catch (error) {
      console.error(error)
      const message = error instanceof Error ? error.message : 'Unable to load certificate access.'
      setError(message)
    }
  }, [app, counterparty, type, certTypeFilter, limit, itemsDisplayed, onEmptyList, managers?.permissionsManager, queryKey])

  const revokeAccess = async (grant: PermissionToken) => {
    setCurrentAccessGrant(grant)
    setDialogOpen(true)
  }

  const revokeAllAccess = async (appGrant: AppGrant) => {
    setCurrentApp(appGrant)
    setDialogOpen(true)
  }

  // Handle revoke dialog confirmation
  const handleConfirm = async () => {
    try {
      setDialogLoading(true)

      if (currentAccessGrant) {
        await managers.permissionsManager.revokePermission(currentAccessGrant)
      } else {
        if (!currentApp || !currentApp.permissions) {
          throw new Error('Unable to revoke permissions!')
        }
        for (const permission of currentApp.permissions) {
          try {
            await managers.permissionsManager.revokePermission(permission)
          } catch (error) {
            console.error(error)
          }
        }
        setCurrentApp(null)
      }

      setCurrentAccessGrant(null)
      await refreshGrants(true)

      setDialogOpen(false)
      setDialogLoading(false)
    } catch (e: any) {
      toast.error('Certificate access grant may not have been revoked: ' + e.message)
      await refreshGrants(true) // still try to refresh
      setCurrentAccessGrant(null)
      setCurrentApp(null)
      setDialogOpen(false)
      setDialogLoading(false)
    }
  }

  const handleDialogClose = () => {
    if (dialogLoading) return // prevent closing while in-flight
    setCurrentAccessGrant(null)
    setCurrentApp(null)
    setDialogOpen(false)
  }

  useEffect(() => {
    refreshGrants()
  }, [refreshGrants])

  
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<any>).detail || {}
      if (detail.originator && detail.originator !== app) return
      refreshGrants(true)
    }

  window.addEventListener('cert-access-changed', handler as EventListener)
  return () => window.removeEventListener('cert-access-changed', handler as EventListener)
}, [app, refreshGrants])

  if (grants.length === 0 && !showEmptyList) {
    return <></>
  }

  return (
    <>
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Revoke Access?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You can re-authorize this certificate access grant next time you use this app.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="primary" disabled={dialogLoading} onClick={handleDialogClose}>
            Cancel
          </Button>
          <Button color="primary" disabled={dialogLoading} onClick={handleConfirm} startIcon={dialogLoading ? <CircularProgress size={16} /> : null}>
            Revoke
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Box pb={2}>
          <Alert severity="warning">{error}</Alert>
        </Box>
      )}

      <List disablePadding sx={{ width: '100%' }}>
        {listHeaderTitle && <ListSubheader>{listHeaderTitle}</ListSubheader>}
        {grants.map((grant, i) => {
          if (itemsDisplayed === 'apps' && isAppGrant(grant)) {
            return (
              <ListItem key={`cert-app-${grant.originator}-${i}`} disableGutters sx={{ px: 0, py: 1 }}>
                <Paper elevation={1} sx={{ width: '100%', p: 2 }}>
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <AppChip
                          label={grant.originator}
                          showDomain
                          onClick={(e: MouseEvent) => {
                            e.stopPropagation()
                            navigate(`/dashboard/app/${encodeURIComponent(grant.originator)}`, {
                              state: { domain: grant.originator }
                            })
                          }}
                        />
                      </Box>

                      {canRevoke && (
                        <Button
                          onClick={() => revokeAllAccess(grant)}
                          color="secondary"
                          sx={{ textTransform: 'none' }}
                        >
                          {grant.permissions.length > 1 ? 'Revoke All' : 'Revoke'}
                        </Button>
                      )}
                    </Stack>

                    <Stack spacing={1}>
                      {grant.permissions.map(permission => (
                        <CertificateChip
                          key={`${permission.txid}-${permission.certType}`}
                          certType={permission.certType}
                          expiry={permission.expiry}
                          canRevoke={canRevoke}
                          onRevokeClick={() => revokeAccess(permission)}
                          certVerifier={permission.verifier}
                          clickable
                          size={1.1}
                        />
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              </ListItem>
            )
          }

          if (itemsDisplayed !== 'apps') {
            const permission = grant as PermissionToken
            return (
              <ListItem key={`cert-permission-${permission.txid}-${i}`} disableGutters sx={{ px: 0, py: 1 }}>
                <Paper elevation={1} sx={{ width: '100%', p: 2 }}>
                  <CertificateChip
                    certType={permission.certType}
                    expiry={permission.expiry}
                    canRevoke={canRevoke}
                    onRevokeClick={() => revokeAccess(permission)}
                    certVerifier={permission.verifier}
                    clickable
                    size={1.1}
                  />
                </Paper>
              </ListItem>
            )
          }

          return null
        })}
      </List>

      {displayCount && (
        <center>
          <Typography color="textSecondary">
            <i>Total Certificate Access Grants: {grants.length} {limit && `limit: ${limit}`}</i>
          </Typography>
        </center>
      )}
    </>
  )
}

export default CertificateAccessList
