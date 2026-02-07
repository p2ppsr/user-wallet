import { useContext, useMemo } from 'react'
import {
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Divider,
  Box,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip
} from '@mui/material'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CustomDialog from '../CustomDialog'
import AppChip from '../AppChip'
import CounterpartyChip from '../CounterpartyChip'
import ProtoChip from '../ProtoChip'
import deterministicColor from '../../utils/deterministicColor'
import { WalletContext } from '../../WalletContext'
import { UserContext } from '../../UserContext'

const CounterpartyPermissionHandler = () => {
  const { counterpartyPermissionRequests, advanceCounterpartyPermissionQueue, managers } = useContext(WalletContext)
  const { counterpartyPermissionModalOpen } = useContext(UserContext)

  const currentRequest = counterpartyPermissionRequests[0]

  const capabilityLines = useMemo(() => {
    if (!currentRequest?.permissions?.protocols?.length) return []
    return currentRequest.permissions.protocols.map(p => p.description || p.protocolID?.[1] || 'Protocol access')
  }, [currentRequest])

  const handleDeny = async () => {
    if (currentRequest?.requestID) {
      try {
        await (managers.permissionsManager as any)?.denyCounterpartyPermission?.(currentRequest.requestID)
      } catch (e) {
        console.error('Error denying counterparty permissions:', e)
      }
    }
    advanceCounterpartyPermissionQueue()
  }

  const handleGrant = async () => {
    if (currentRequest?.requestID) {
      try {
        await (managers.permissionsManager as any)?.grantCounterpartyPermission?.({
          requestID: currentRequest.requestID,
          granted: {
            protocols: currentRequest.permissions?.protocols || []
          },
          expiry: 0
        })

        try {
          const { originator, counterparty } = currentRequest
          const normOriginator = originator ? originator.replace(/^https?:\/\//, '') : originator
          window.dispatchEvent(new CustomEvent('protocol-permissions-changed', {
            detail: {
              op: 'grant-counterparty',
              originator: normOriginator,
              counterparty
            }
          }))
        } catch {
        }
      } catch (e) {
        console.error('Error granting counterparty permissions:', e)
      }
    }
    advanceCounterpartyPermissionQueue()
  }

  if (!counterpartyPermissionModalOpen || !currentRequest) return null

  const { originator, counterparty, counterpartyLabel } = currentRequest

  return (
    <CustomDialog
      open={counterpartyPermissionModalOpen}
      title="New Counterparty Permission Request"
      onClose={handleDeny}
    >
      <DialogContent>
        <Stack spacing={2}>
          <Box sx={{ textAlign: 'center' }}>
            <AppChip size={2} showDomain label={originator || 'unknown'} clickable={false} />
          </Box>

          <Divider />

          <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
            You&apos;re interacting with a new person through this app.
          </Typography>

          <CounterpartyChip counterparty={counterparty} label={counterpartyLabel || 'Counterparty'} layout="compact" />

          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            This person will be able to:
          </Typography>

          <List>
            {capabilityLines.map((item, i) => (
              <ListItem key={i} sx={{ py: 1 }}>
                <ListItemIcon>
                  <CheckCircleOutlineIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>

          {Array.isArray(currentRequest.permissions?.protocols) && currentRequest.permissions.protocols.length > 0 && (
            <>
              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Level 2 protocols granted at once:
              </Typography>
              <Stack spacing={1}>
                {currentRequest.permissions.protocols.map((p, i) => (
                  <ProtoChip
                    key={i}
                    securityLevel={p.protocolID[0]}
                    protocolID={p.protocolID[1]}
                    counterparty={counterparty}
                    originator={originator}
                    clickable={false}
                    canRevoke={false}
                    layout="compact"
                  />
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>

      <Tooltip title="Unique visual signature for this request" placement="top">
        <Box sx={{ mb: 3, py: 0.5, background: deterministicColor(JSON.stringify(currentRequest)) }} />
      </Tooltip>

      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button onClick={handleDeny} variant="outlined" color="inherit">
          Deny
        </Button>
        <Button onClick={handleGrant} variant="contained" color="primary">
          Allow & Trust
        </Button>
      </DialogActions>
    </CustomDialog>
  )
}

export default CounterpartyPermissionHandler
