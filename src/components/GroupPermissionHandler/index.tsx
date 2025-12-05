import { useState, useEffect, useContext, useMemo } from 'react'
import {
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CustomDialog from '../CustomDialog'
import { WalletContext, WalletContextValue } from '../../WalletContext'
import { UserContext, UserContextValue } from '../../UserContext'
import AmountDisplay from '../AmountDisplay'
import type { GroupedPermissions } from '@bsv/wallet-toolbox-client'
import { PermissionHeader, RequestCard, InfoRow, Surface } from '../permissions/PermissionScaffold'
import { getRegistryClient } from '../../utils/clientFactories'

// Local type definitions for group permissions
type ProtocolPermission = {
  protocolID: [number, string]
  counterparty?: string
  description?: string
}

type BasketAccess = {
  basket: string
  description?: string
}

type CertificateAccess = {
  type: string
  fields?: string[]
  verifierPublicKey?: string
  description?: string
}

type SpendingAuthorization = {
  amount: number
  description?: string
}

// We use the structure of requests from the wallet context
// Each request contains requestID, originator and groupPermissions

const GroupPermissionHandler = () => {
  const {
    groupPermissionRequests,
    advanceGroupQueue,
    managers,
    settings,
    clients
  } = useContext<WalletContextValue>(WalletContext)

  const {
    groupPermissionModalOpen
  } = useContext<UserContextValue>(UserContext)

  const [originator, setOriginator] = useState('')
  const [requestID, setRequestID] = useState<string | null>(null)
  const [spendingAuthorization, setSpendingAuthorization] = useState<SpendingAuthorization | undefined>(undefined)
  const [protocolPermissions, setProtocolPermissions] = useState<ProtocolPermission[]>([])
  const [basketAccess, setBasketAccess] = useState<BasketAccess[]>([])
  const [certificateAccess, setCertificateAccess] = useState<CertificateAccess[]>([])
  const [isGranting, setIsGranting] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [protocolNames, setProtocolNames] = useState<Record<string, string>>({})
  const [basketNames, setBasketNames] = useState<Record<string, string>>({})
  const [certificateNames, setCertificateNames] = useState<Record<string, string>>({})
  const [counterpartyNames, setCounterpartyNames] = useState<Record<string, string>>({})

  const registry = useMemo(
    () => getRegistryClient(managers?.permissionsManager),
    [managers?.permissionsManager]
  )

  const handleCancel = async () => {
    // Deny the current group permission request
    if (requestID) {
      try {
        await managers?.permissionsManager.denyGroupedPermission(requestID)
      } catch (error) {
        console.error('Error denying group permission:', error)
      }
    }

    advanceGroupQueue()
  }

  const handleGrant = async () => {
    setIsGranting(true)
    try {
      // Grant ALL permissions - no selective granting
      const granted: Partial<GroupedPermissions> = {
        protocolPermissions: protocolPermissions as any,
        basketAccess: basketAccess as any,
        certificateAccess: certificateAccess as any
      }

      if (spendingAuthorization) {
        granted.spendingAuthorization = spendingAuthorization as any
      }

      if (requestID) {
        try {
          await managers?.permissionsManager.grantGroupedPermission({
            requestID,
            granted: granted as GroupedPermissions,
            expiry: 0 // Never expires
          })
        } catch (error) {
          console.error('Error granting group permission:', error)
        }
      }

      advanceGroupQueue()
    } finally {
      setIsGranting(false)
    }
  }

useEffect(() => {
    let cancelled = false
    // Monitor the group permission requests from the wallet context
    if (groupPermissionRequests && groupPermissionRequests.length > 0) {
      // Get the first group permission request
      const currentRequest = groupPermissionRequests[0]

      // Process the current request
      const processRequest = async () => {
        try {
          // Ensure we have proper typing for the current request
          const { requestID, originator, permissions } = currentRequest
          // Use the permissions property from the request as our groupPermissions
          const groupPermissions = permissions || {
            protocolPermissions: [],
            basketAccess: [],
            certificateAccess: []
          }

          // Set the request ID
          setRequestID(requestID)

          // Set the originator
          setOriginator(originator || '')

          // Reset details visibility for new request
          setShowDetails(false)

          // Set protocol permissions
          setProtocolPermissions(
            (groupPermissions?.protocolPermissions) || []
          )

          // Set basket access permissions
          setBasketAccess(
            (groupPermissions?.basketAccess) || []
          )

          // Set certificate access permissions
          setCertificateAccess(
            (groupPermissions?.certificateAccess)
              ? groupPermissions.certificateAccess.map(x => ({
                ...x,
                fields: Array.isArray(x.fields)
                  ? x.fields
                  : x.fields
                    ? Object.keys(x.fields)
                    : []
              }))
              : []
          )

          // Set spending authorization
          setSpendingAuthorization(groupPermissions?.spendingAuthorization)
        } catch (e) {
          console.error('Error processing group permission request:', e)
        }
      }

      processRequest()
      // Resolve registry/identity names for current request
      const resolveMetadata = async () => {
        // Protocol names
        if (registry && settings?.trustSettings && currentRequest.permissions?.protocolPermissions?.length) {
          const trusted = settings.trustSettings.trustedCertifiers.map(x => x.identityKey)
          const entries = currentRequest.permissions.protocolPermissions
          const updates: Record<string, string> = {}
          for (const p of entries) {
            const key = `${p.protocolID[0]}|${p.protocolID[1]}`
            if (protocolNames[key]) continue
            try {
              const results = await registry.resolve('protocol', {
                protocolID: [p.protocolID[0] as any, p.protocolID[1]],
                registryOperators: trusted
              })
              if (results && results.length) {
                let best = 0
                let idx = 0
                for (let i = 0; i < results.length; i++) {
                  const trust = settings.trustSettings.trustedCertifiers.find(x => x.identityKey === results[i].registryOperator)?.trust || 0
                  if (trust > best) {
                    best = trust
                    idx = i
                  }
                }
                updates[key] = results[idx]?.name || p.protocolID[1]
              }
            } catch (err) {
              // ignore resolution failure
            }
          }
          if (!cancelled && Object.keys(updates).length) {
            setProtocolNames(prev => ({ ...prev, ...updates }))
          }
        }

        // Basket names
        if (registry && settings?.trustSettings && currentRequest.permissions?.basketAccess?.length) {
          const trusted = settings.trustSettings.trustedCertifiers.map(x => x.identityKey)
          const updates: Record<string, string> = {}
          for (const b of currentRequest.permissions.basketAccess) {
            if (basketNames[b.basket]) continue
            try {
              const results = await registry.resolve('basket', {
                basketID: b.basket,
                registryOperators: trusted
              })
              if (results && results.length) {
                let best = 0
                let idx = 0
                for (let i = 0; i < results.length; i++) {
                  const trust = settings.trustSettings.trustedCertifiers.find(x => x.identityKey === results[i].registryOperator)?.trust || 0
                  if (trust > best) {
                    best = trust
                    idx = i
                  }
                }
                updates[b.basket] = results[idx]?.name || b.basket
              }
            } catch (err) {
              // ignore
            }
          }
          if (!cancelled && Object.keys(updates).length) {
            setBasketNames(prev => ({ ...prev, ...updates }))
          }
        }

        // Certificate names
        if (registry && settings?.trustSettings && currentRequest.permissions?.certificateAccess?.length) {
          const trusted = settings.trustSettings.trustedCertifiers.map(x => x.identityKey)
          const updates: Record<string, string> = {}
          for (const c of currentRequest.permissions.certificateAccess) {
            if (certificateNames[c.type]) continue
            try {
              const results = await registry.resolve('certificate', {
                type: c.type,
                registryOperators: trusted
              })
              if (results && results.length) {
                let best = 0
                let idx = 0
                for (let i = 0; i < results.length; i++) {
                  const trust = settings.trustSettings.trustedCertifiers.find(x => x.identityKey === results[i].registryOperator)?.trust || 0
                  if (trust > best) {
                    best = trust
                    idx = i
                  }
                }
                updates[c.type] = results[idx]?.name || c.type
              }
            } catch (err) {
              // ignore
            }
          }
          if (!cancelled && Object.keys(updates).length) {
            setCertificateNames(prev => ({ ...prev, ...updates }))
          }
        }

        // Counterparty names (identity)
        if (clients?.identityClient && currentRequest.permissions?.protocolPermissions?.length) {
          const updates: Record<string, string> = {}
          for (const p of currentRequest.permissions.protocolPermissions) {
            const key = p.counterparty
            if (!key || counterpartyNames[key]) continue
            try {
              const results = await clients.identityClient.resolveByIdentityKey({ identityKey: key })
              if (results && results.length) {
                updates[key] = results[0]?.name || key
              }
            } catch (err) {
              // ignore
            }
          }
          if (!cancelled && Object.keys(updates).length) {
            setCounterpartyNames(prev => ({ ...prev, ...updates }))
          }
        }

      }
      resolveMetadata()
    } else {
      // Reset the dialog when there are no requests
      setOriginator('')
      setRequestID(null)
      setSpendingAuthorization(undefined)
      setProtocolPermissions([])
      setBasketAccess([])
      setCertificateAccess([])
      setShowDetails(false)
    }
    return () => { cancelled = true }
  }, [groupPermissionRequests, advanceGroupQueue, registry, settings?.trustSettings, protocolNames, basketNames, certificateNames, counterpartyNames, clients?.identityClient])

  // Helper to generate permission summary text
  const getPermissionSummary = () => {
    const items: string[] = []
    if (protocolPermissions.length > 0) items.push('Use your wallet identity to sign and encrypt data')
    if (basketAccess.length > 0) items.push('Store and access data in your wallet')
    if (certificateAccess.length > 0) items.push('View your identity credentials')
    if (spendingAuthorization) items.push(`Spend up to ${spendingAuthorization.amount}`)
    return items
  }

  // Generate app-specific context message
  const getContextMessage = () => {
    const appName = originator || 'This app'
    return `${appName} wants to use your wallet to manage identity, data, and transactions.`
  }

  return (
    <CustomDialog
      open={groupPermissionModalOpen && groupPermissionRequests.length > 0}
      onClose={handleCancel}
      maxWidth='md'
      fullWidth
      title='Permission needed'
    >
      <DialogContent>
        <Stack spacing={2}>
          <PermissionHeader
            appDomain={originator || 'Unknown app'}
            contextLine="wants broad access to your wallet"
          />

          <RequestCard
            title="What this app is asking for"
            body={getContextMessage()}
          />

          <Surface>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
              This allows it to:
            </Typography>

            <List sx={{ mb: 0, py: 0 }}>
              {getPermissionSummary().map((item, i) => (
                <ListItem key={i} sx={{ py: 1 }}>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item}
                    primaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              ))}
            </List>
          </Surface>

          {spendingAuthorization && (
            <Surface sx={{ bgcolor: 'action.hover' }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Spending without prompts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Spend up to <AmountDisplay abbreviate>{spendingAuthorization.amount}</AmountDisplay> without additional confirmation.
              </Typography>
            </Surface>
          )}

          {(protocolPermissions.length > 0 || certificateAccess.length > 0 || basketAccess.length > 0) && (
            <>
              <Divider sx={{ my: 1 }} />
              <Button
                onClick={() => setShowDetails(!showDetails)}
                size="small"
                sx={{ textTransform: 'none', alignSelf: 'flex-start' }}
              >
                {showDetails ? 'Hide details' : 'Show what exactly will be shared'}
              </Button>
            </>
          )}

          {showDetails && (
            <Stack spacing={2}>
              {protocolPermissions.length > 0 && (
                <Surface>
                  <Typography variant="subtitle2" gutterBottom>
                    Protocol access ({protocolPermissions.length})
                  </Typography>
                  <Stack spacing={1}>
                    {protocolPermissions.map((x, i) => {
                      const key = `${x.protocolID[0]}|${x.protocolID[1]}`
                      const protocolLabel = protocolNames[key] || x.protocolID[1]
                      const counterpartyLabel = x.counterparty ? (counterpartyNames[x.counterparty] || x.counterparty) : null
                      return (
                        <InfoRow
                          key={i}
                          label={x.description || 'Protocol'}
                          value={`${protocolLabel} • security ${x.protocolID[0]}${counterpartyLabel ? ` • ${counterpartyLabel}` : ''}`}
                        />
                      )
                    })}
                  </Stack>
                </Surface>
              )}

              {certificateAccess.length > 0 && (
                <Surface>
                  <Typography variant="subtitle2" gutterBottom>
                    Certificate access ({certificateAccess.length})
                  </Typography>
                  <Stack spacing={1}>
                    {certificateAccess.map((x, i) => (
                      <InfoRow
                        key={i}
                        label={certificateNames[x.type] || x.type}
                        value={x.description || 'Will read this credential'}
                      />
                    ))}
                  </Stack>
                </Surface>
              )}

              {basketAccess.length > 0 && (
                <Surface>
                  <Typography variant="subtitle2" gutterBottom>
                    Basket access ({basketAccess.length})
                  </Typography>
                  <Stack spacing={1}>
                    {basketAccess.map((x, i) => (
                      <InfoRow
                        key={i}
                        label={basketNames[x.basket] || x.basket}
                        value={x.description || 'Read and write data in this basket'}
                      />
                    ))}
                  </Stack>
                </Surface>
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions
        style={{
          justifyContent: 'space-between',
          padding: '1em',
          flex: 'none'
        }}
      >
        <Button
          onClick={handleCancel}
          variant='text'
          disabled={isGranting}
          size='large'
        >
          No, keep blocked
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleGrant}
          disabled={isGranting}
          startIcon={isGranting ? <CircularProgress size={16} color='inherit' /> : undefined}
          size='large'
        >
          {isGranting ? 'Granting...' : 'Allow everything'}
        </Button>
      </DialogActions>
    </CustomDialog>
  )
}

export default GroupPermissionHandler
