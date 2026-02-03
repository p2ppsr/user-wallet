import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  Divider,
  MenuItem
} from '@mui/material'
import type { WalletInterface } from '@bsv/sdk'
import { PublicKey } from '@bsv/sdk'
import CustomDialog from './CustomDialog'
import { openUrl } from '../utils/openUrl'

export type GuardarianRampMode = 'buy' | 'sell'

type PaymentOption = {
  label: string
  url: string
}

const BUY_OPTIONS: PaymentOption[] = [
  { label: 'Card', url: 'https://guardarian.com/buy-bsv-with-card' },
  { label: 'SEPA', url: 'https://guardarian.com/buy-bsv-with-sepa' },
  { label: 'Open Banking', url: 'https://guardarian.com/buy-bsv-with-open-banking' },
  { label: 'Apple Pay', url: 'https://guardarian.com/buy-bsv-with-apple-pay' },
  { label: 'SPEI', url: 'https://guardarian.com/buy-bsv-with-spei' },
  { label: 'PIX', url: 'https://guardarian.com/buy-bsv-with-pix' }
]

const SELL_OPTIONS: PaymentOption[] = [
  { label: 'Sell BSV', url: 'https://guardarian.com/sell-bsv' }
]

const getAddressForWallet = async (wallet: WalletInterface, network: 'mainnet' | 'testnet') => {
  const { publicKey } = await wallet.getPublicKey({ identityKey: true })
  const address = PublicKey.fromString(publicKey).toAddress(network === 'testnet' ? 'testnet' : 'mainnet')
  return address
}

export type GuardarianRampDialogProps = {
  open: boolean
  mode: GuardarianRampMode | null
  onClose: () => void
  wallet: WalletInterface | null
  network: 'mainnet' | 'testnet'
}

export default function GuardarianRampDialog({ open, mode, onClose, wallet, network }: GuardarianRampDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState('')
  const [copied, setCopied] = useState(false)
  const [paymentLabel, setPaymentLabel] = useState(BUY_OPTIONS[0].label)

  const isBuy = mode === 'buy'
  const options = useMemo(() => (isBuy ? BUY_OPTIONS : SELL_OPTIONS), [isBuy])

  const selectedOption = useMemo(() => {
    return options.find((option) => option.label === paymentLabel) ?? options[0]
  }, [options, paymentLabel])

  const loadAddress = useCallback(async () => {
    if (!wallet) return
    setLoading(true)
    setError(null)
    try {
      const walletAddress = await getAddressForWallet(wallet, network)
      setAddress(walletAddress)
    } catch (err) {
      setError((err as Error)?.message ?? 'Unable to load wallet address.')
    } finally {
      setLoading(false)
    }
  }, [wallet, network])

  useEffect(() => {
    if (!open || !mode) return
    setCopied(false)
    setError(null)
    setAddress('')
    if (mode === 'buy') {
      setPaymentLabel(BUY_OPTIONS[0].label)
    } else {
      setPaymentLabel(SELL_OPTIONS[0].label)
    }
    void loadAddress()
  }, [open, mode, loadAddress])

  const handleCopy = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
    } catch (err) {
      setError('Unable to copy address. Please copy it manually.')
    }
  }

  const handleOpenGuardarian = async () => {
    if (!selectedOption?.url) return
    await openUrl(selectedOption.url)
  }

  const title = isBuy ? 'Buy BSV (Guardarian)' : 'Sell BSV (Guardarian)'

  return (
    <CustomDialog open={open} onClose={onClose} title={title} maxWidth="md" fullWidth>
      <Stack spacing={3} sx={{ pt: 1 }}>
        {loading ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
            <CircularProgress />
            <Typography variant="body2">Loading wallet address…</Typography>
          </Stack>
        ) : (
          <>
            {error && <Alert severity="error">{error}</Alert>}

            <Typography variant="body1" fontWeight={600}>
              {isBuy
                ? 'Purchase BSV directly through Guardarian.'
                : 'Sell BSV through Guardarian and receive fiat to your bank.'}
            </Typography>

            <Alert severity="info">
              You will complete KYC and payment directly with Guardarian. We do not store your personal information.
            </Alert>

            {isBuy && (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  Copy your wallet receive address and paste it into Guardarian when prompted.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="stretch">
                  <TextField
                    label="Your BSV address"
                    value={address}
                    fullWidth
                    InputProps={{ readOnly: true }}
                  />
                  <Button variant="outlined" onClick={handleCopy} disabled={!address}>
                    {copied ? 'Copied' : 'Copy address'}
                  </Button>
                </Stack>
              </Stack>
            )}

            <Divider />

            <Stack spacing={2}>
              <TextField
                select
                label={isBuy ? 'Payment method' : 'Sell flow'}
                value={paymentLabel}
                onChange={(event) => setPaymentLabel(event.target.value)}
              >
                {options.map((option) => (
                  <MenuItem key={option.label} value={option.label}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button variant="contained" onClick={handleOpenGuardarian}>
                Open Guardarian
              </Button>
            </Stack>

            {isBuy ? (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  After checkout, your BSV will arrive in this wallet address.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Guardarian will provide a deposit address and instructions for sending BSV from your wallet.
                </Typography>
              </Box>
            )}
          </>
        )}
      </Stack>
    </CustomDialog>
  )
}
