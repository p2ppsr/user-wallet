import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Divider
} from '@mui/material'
import type { WalletInterface } from '@bsv/sdk'
import { PublicKey } from '@bsv/sdk'
import CustomDialog from './CustomDialog'
import { changellyFiatGet, changellyFiatPost } from '../utils/changellyFiat'
import { openUrl } from '../utils/openUrl'

export type FiatRampMode = 'buy' | 'sell'

type Currency = {
  ticker: string
  name: string
  symbol?: string
}

type Country = {
  code: string
  name: string
  states?: { code: string; name: string }[]
}

type OfferOption = {
  id: string
  providerCode: string
  providerName: string
  method?: string
  methodName?: string
  amountFrom: string
  amountExpectedTo: string
  fee?: string
  rate?: string
}

type OrderSummary = {
  orderId: string
  redirectUrl: string
  providerCode: string
  amountFrom: string
  currencyFrom: string
  currencyTo: string
  paymentMethod?: string
  createdAt?: string
}

const ORDER_HISTORY_KEY = 'bgo_changelly_fiat_orders_v1'

const storeOrder = (order: OrderSummary) => {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(ORDER_HISTORY_KEY)
    const existing = raw ? JSON.parse(raw) : []
    const next = [{ ...order, savedAt: Date.now() }, ...(Array.isArray(existing) ? existing : [])]
    window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(next.slice(0, 50)))
  } catch {
    // ignore
  }
}

const formatOption = (offer: OfferOption, payIn: string, payout: string) => {
  const methodLabel = offer.methodName ?? offer.method ?? 'Standard'
  return `${offer.providerName} · ${methodLabel} · ${offer.amountExpectedTo} ${payout} for ${offer.amountFrom} ${payIn}`
}

const normalizeCurrencies = (payload: any): Currency[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.currencies)) return payload.currencies
  return []
}

const normalizeCountries = (payload: any): Country[] => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.countries)) return payload.countries
  return []
}

const getAddressForWallet = async (wallet: WalletInterface, network: 'mainnet' | 'testnet') => {
  const { publicKey } = await wallet.getPublicKey({ identityKey: true })
  const address = PublicKey.fromString(publicKey).toAddress(network === 'testnet' ? 'testnet' : 'mainnet')
  return address
}

export type FiatRampDialogProps = {
  open: boolean
  mode: FiatRampMode | null
  onClose: () => void
  wallet: WalletInterface | null
  network: 'mainnet' | 'testnet'
}

export default function FiatRampDialog({ open, mode, onClose, wallet, network }: FiatRampDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fiatCurrencies, setFiatCurrencies] = useState<Currency[]>([])
  const [cryptoCurrencies, setCryptoCurrencies] = useState<Currency[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [countryCode, setCountryCode] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [fiatTicker, setFiatTicker] = useState('USD')
  const [amount, setAmount] = useState('')
  const [offers, setOffers] = useState<OfferOption[]>([])
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [kycAccepted, setKycAccepted] = useState(false)
  const [order, setOrder] = useState<OrderSummary | null>(null)

  const selectedCountry = useMemo(() => countries.find((c) => c.code === countryCode) ?? null, [countries, countryCode])
  const selectedOffer = useMemo(() => offers.find((o) => o.id === selectedOfferId) ?? null, [offers, selectedOfferId])
  const isBuy = mode === 'buy'

  const resetState = useCallback(() => {
    setError(null)
    setOffers([])
    setSelectedOfferId(null)
    setKycAccepted(false)
    setOrder(null)
    setAmount('')
  }, [])

  useEffect(() => {
    if (!open || !mode) return
    resetState()
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const supportedFlow = mode === 'buy' ? 'buy' : 'sell'
        const [countriesRes, fiatRes, cryptoRes] = await Promise.all([
          changellyFiatGet('/v1/available-countries', { supportedFlow }),
          changellyFiatGet('/v1/currencies', { type: 'fiat', supportedFlow }),
          changellyFiatGet('/v1/currencies', { type: 'crypto', supportedFlow })
        ])
        const nextCountries = normalizeCountries(countriesRes)
        const nextFiat = normalizeCurrencies(fiatRes)
        const nextCrypto = normalizeCurrencies(cryptoRes)

        setCountries(nextCountries)
        setFiatCurrencies(nextFiat)
        setCryptoCurrencies(nextCrypto)

        const defaultCountry = nextCountries.find((c) => c.code === 'US') ?? nextCountries[0]
        if (defaultCountry) {
          setCountryCode(defaultCountry.code)
          setStateCode(defaultCountry.states?.[0]?.code ?? '')
        }
        if (nextFiat.length > 0) {
          const usd = nextFiat.find((c) => c.ticker === 'USD')
          setFiatTicker((usd?.ticker ?? nextFiat[0].ticker) || 'USD')
        }
      } catch (err) {
        setError((err as Error)?.message ?? 'Unable to load fiat ramp configuration.')
      } finally {
        setLoading(false)
      }
    }
    void fetchData()
  }, [open, mode, resetState])

  useEffect(() => {
    if (!open) return
    setOffers([])
    setSelectedOfferId(null)
    setOrder(null)
    setKycAccepted(false)
  }, [open, countryCode, stateCode, fiatTicker, mode])

  const bsvSupported = useMemo(() => cryptoCurrencies.some((c) => c.ticker?.toUpperCase() === 'BSV'), [cryptoCurrencies])

  const loadOffers = async () => {
    if (!mode) return
    setError(null)
    setLoadingOffers(true)
    try {
      const numericAmount = Number(amount)
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error('Enter a valid amount.')
      }
      if (!countryCode) {
        throw new Error('Select a country.')
      }
      if (!bsvSupported) {
        throw new Error('BSV is not available for this flow in the selected region.')
      }
      if (countryCode === 'US' && !stateCode) {
        throw new Error('Select a state for United States transactions.')
      }

      const query = {
        currencyFrom: isBuy ? fiatTicker : 'BSV',
        currencyTo: isBuy ? 'BSV' : fiatTicker,
        amountFrom: String(numericAmount),
        country: countryCode,
        ...(stateCode ? { state: stateCode } : {})
      }

      const endpoint = isBuy ? '/v1/offers' : '/v1/sell/offers'
      const response = await changellyFiatGet(endpoint, query)
      const rawOffers = Array.isArray(response) ? response : (response as any)?.offers ?? []

      const mapped: OfferOption[] = rawOffers.flatMap((offer: any) => {
        const providerName = offer.providerName ?? offer.providerCode
        const amountFrom = offer.amountFrom ?? String(numericAmount)
        const paymentMethods = Array.isArray(offer.paymentMethodOffer)
          ? offer.paymentMethodOffer
          : Array.isArray(offer.paymentMethods)
            ? offer.paymentMethods
            : []
        if (paymentMethods.length === 0) {
          return [{
            id: `${offer.providerCode}-${amountFrom}`,
            providerCode: offer.providerCode,
            providerName,
            amountFrom,
            amountExpectedTo: offer.amountExpectedTo ?? offer.amountTo ?? '0',
            fee: offer.fee,
            rate: offer.rate
          }]
        }
        return paymentMethods.map((method: any) => {
          const methodCode = method.method ?? method.paymentMethod ?? method.code
          return {
          id: `${offer.providerCode}-${methodCode ?? 'standard'}-${method.amountExpectedTo ?? offer.amountExpectedTo}`,
          providerCode: offer.providerCode,
          providerName,
          method: methodCode,
          methodName: method.methodName ?? method.name,
          amountFrom,
          amountExpectedTo: method.amountExpectedTo ?? offer.amountExpectedTo ?? '0',
          fee: method.fee ?? offer.fee,
          rate: method.rate ?? offer.rate
        }
        })
      })

      if (mapped.length === 0) {
        throw new Error('No offers available for the selected amount and region.')
      }
      setOffers(mapped)
      setSelectedOfferId(mapped[0].id)
    } catch (err) {
      setError((err as Error)?.message ?? 'Unable to load offers.')
    } finally {
      setLoadingOffers(false)
    }
  }

  const createOrder = async () => {
    if (!mode || !selectedOffer || !wallet) return
    setError(null)
    try {
      if (!kycAccepted) {
        throw new Error('Please confirm you are ready for KYC/AML verification.')
      }

      const walletAddress = await getAddressForWallet(wallet, network)
      await changellyFiatPost('/v1/validate-address', { currency: 'BSV', walletAddress })

      const amountFromValue = isBuy ? amount : Number(amount)
      const basePayload = {
        externalOrderId: crypto.randomUUID(),
        externalUserId: crypto.randomUUID(),
        providerCode: selectedOffer.providerCode,
        currencyFrom: isBuy ? fiatTicker : 'BSV',
        currencyTo: isBuy ? 'BSV' : fiatTicker,
        amountFrom: amountFromValue,
        country: countryCode,
        ...(stateCode ? { state: stateCode } : {}),
        ...(selectedOffer.method ? { paymentMethod: selectedOffer.method } : {})
      }

      const returnBase = typeof window !== 'undefined' ? window.location.origin : ''
      const response = isBuy
        ? await changellyFiatPost('/v1/orders', {
          ...basePayload,
          walletAddress,
          ...(returnBase ? {
            returnSuccessUrl: `${returnBase}/fiat-ramp/success`,
            returnFailedUrl: `${returnBase}/fiat-ramp/failed`
          } : {})
        })
        : await changellyFiatPost('/v1/sell/orders', {
          ...basePayload,
          refundAddress: walletAddress
        })

      if (!response?.redirectUrl) {
        throw new Error('Provider did not return a checkout URL.')
      }

      const summary: OrderSummary = {
        orderId: response.orderId ?? response.id ?? 'unknown',
        redirectUrl: response.redirectUrl,
        providerCode: response.providerCode,
        amountFrom: response.amountFrom ?? selectedOffer.amountFrom,
        currencyFrom: response.currencyFrom,
        currencyTo: response.currencyTo,
        paymentMethod: response.paymentMethod,
        createdAt: response.createdAt
      }
      setOrder(summary)
      storeOrder(summary)
    } catch (err) {
      setError((err as Error)?.message ?? 'Unable to create order.')
    }
  }

  const title = mode === 'buy' ? 'Buy BSV' : 'Sell BSV'
  const fiatLabel = fiatCurrencies.find((c) => c.ticker === fiatTicker)?.name ?? fiatTicker

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="md"
      fullWidth
    >
      <Stack spacing={3} sx={{ pt: 1 }}>
        {loading ? (
          <Stack alignItems="center" spacing={2} sx={{ py: 6 }}>
            <CircularProgress />
            <Typography variant="body2">Loading providers…</Typography>
          </Stack>
        ) : (
          <>
            {!bsvSupported && (
              <Alert severity="warning">
                BSV is currently unavailable for this flow in the selected region. Try another country or check again later.
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Stack spacing={2}>
              <Typography variant="body1" fontWeight={600}>
                {isBuy ? 'Buy BSV with fiat' : 'Sell BSV for fiat'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Country"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  {countries.map((country) => (
                    <MenuItem key={country.code} value={country.code}>
                      {country.name}
                    </MenuItem>
                  ))}
                </TextField>
                {selectedCountry?.states?.length ? (
                  <TextField
                    select
                    fullWidth
                    label="State / Region"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                  >
                    {selectedCountry.states?.map((state) => (
                      <MenuItem key={state.code} value={state.code}>
                        {state.name}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : null}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  select
                  fullWidth
                  label="Fiat currency"
                  value={fiatTicker}
                  onChange={(e) => setFiatTicker(e.target.value)}
                >
                  {fiatCurrencies.map((currency) => (
                    <MenuItem key={currency.ticker} value={currency.ticker}>
                      {currency.ticker} · {currency.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label={isBuy ? `Pay in ${fiatLabel}` : 'Sell amount (BSV)'}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={isBuy ? '100' : '0.25'}
                />
              </Stack>

              <Button
                variant="contained"
                onClick={loadOffers}
                disabled={loadingOffers || !amount || !countryCode || !bsvSupported}
              >
                {loadingOffers ? 'Fetching offers…' : 'Get offers'}
              </Button>
            </Stack>

            {offers.length > 0 && (
              <>
                <Divider />
                <Stack spacing={2}>
                  <Typography variant="body1" fontWeight={600}>
                    Choose a provider
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={selectedOfferId ?? ''}
                    onChange={(e) => setSelectedOfferId(e.target.value)}
                  >
                    {offers.map((offer) => (
                      <MenuItem key={offer.id} value={offer.id}>
                        {formatOption(offer, isBuy ? fiatTicker : 'BSV', isBuy ? 'BSV' : fiatTicker)}
                      </MenuItem>
                    ))}
                  </TextField>
                  {selectedOffer && (
                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary">
                        Estimated {isBuy ? 'BSV to receive' : `${fiatTicker} to receive`}: {selectedOffer.amountExpectedTo}
                      </Typography>
                      {selectedOffer.fee && (
                        <Typography variant="body2" color="text.secondary">
                          Estimated fee: {selectedOffer.fee} {fiatTicker}
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>
              </>
            )}

            {offers.length > 0 && (
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Checkbox checked={kycAccepted} onChange={(e) => setKycAccepted(e.target.checked)} />}
                  label="I understand I will complete KYC/AML verification with the provider inside this wallet."
                />
                <Button
                  variant="contained"
                  onClick={createOrder}
                  disabled={!selectedOffer || !kycAccepted || !wallet}
                >
                  Continue to {isBuy ? 'Buy' : 'Sell'}
                </Button>
              </Stack>
            )}

            {order && (
              <Stack spacing={2}>
                <Divider />
                <Typography variant="body1" fontWeight={600}>Complete checkout</Typography>
                <Typography variant="body2" color="text.secondary">
                  Provider checkout will open below. If it does not load, use the button to open in a new window.
                </Typography>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    height: { xs: 360, md: 480 }
                  }}
                >
                  <iframe
                    title="Changelly Checkout"
                    src={order.redirectUrl}
                    style={{ border: 0, width: '100%', height: '100%' }}
                  />
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button variant="outlined" onClick={() => openUrl(order.redirectUrl)}>
                    Open checkout in new window
                  </Button>
                  <Button variant="text" onClick={onClose}>Close</Button>
                </Stack>
              </Stack>
            )}
          </>
        )}
      </Stack>
    </CustomDialog>
  )
}
