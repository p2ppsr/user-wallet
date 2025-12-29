import { WalletInterface } from '@bsv/sdk'
import { SatoshiShopClient, type StartShoppingResult } from 'satoshi-shop-client'

const IN_BROWSER =
  typeof window === 'object' &&
  typeof document === 'object' &&
  typeof document.createElement === 'function'

export interface FundingModalOptions {
  title?: string
  introText?: string
  postPurchaseText?: string
  cancelText?: string
  satoshiShopUrl?: string
  satoshiShopPubKey?: string
}

interface ResolvedFundingOptions {
  title: string
  introText: string
  postPurchaseText: string
  cancelText: string
  satoshiShopUrl: string
  satoshiShopPubKey: string
}

type ButtonShape = 'soft' | 'pill' | 'sharp'

interface DesignTokens {
  overlayColor: string
  overlayBlur: string
  cardBackground: string
  cardBorder: string
  cardShadow: string
  cardRadius: string
  fontFamily: string
  textPrimary: string
  textMuted: string
  accentBackground: string
  accentText: string
  accentHoverBackground: string
  accentHoverText: string
  accentBorder: string
  secondaryBackground: string
  secondaryText: string
  secondaryHoverBackground: string
  secondaryBorder: string
  focusRing: string
  focusGlow: string
  smallLabelColor: string
  buttonShadow: string
  buttonShape: ButtonShape
}

const DEFAULT_FUNDING: ResolvedFundingOptions = {
  title: 'Not enough sats',
  introText: 'Top up your wallet, then click “Retry” to finish the action.',
  postPurchaseText:
    'If you have bought sats, they will arrive shortly. You can then retry your action.',
  cancelText: 'Cancel',
  satoshiShopUrl: 'https://satoshi-shop.babbage.systems',
  satoshiShopPubKey:
    'pk_live_51KT9tpEUx5UhTr4kDuPQBpP5Sy8G5Xd4rsqWTQLVsXAeQGGrKhYZt8JgGCGSgi1NHnOWbxJNfCoMVh3a8F9iCYXf00U0lbWdDC'
}

const TOKENS: DesignTokens = {
  overlayColor:
    'radial-gradient(80% 120% at 15% 15%, rgba(18,38,74,0.9), rgba(2,7,18,0.95))',
  overlayBlur: 'blur(22px)',
  cardBackground: 'rgba(2,7,18,0.92)',
  cardBorder: 'rgba(114,201,255,0.32)',
  cardShadow: '0 35px 90px rgba(2,6,24,0.85)',
  cardRadius: '26px',
  fontFamily:
    '"Space Grotesk", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  textPrimary: 'rgba(255,255,255,0.96)',
  textMuted: 'rgba(228,243,255,0.82)',
  accentBackground: 'linear-gradient(135deg, #6BE7FF, #6F7DFF)',
  accentText: '#040c1b',
  accentHoverBackground: '#f4fbff',
  accentHoverText: '#021735',
  accentBorder: 'rgba(255,255,255,0.25)',
  secondaryBackground: 'rgba(255,255,255,0.08)',
  secondaryText: 'rgba(255,255,255,0.9)',
  secondaryHoverBackground: 'rgba(255,255,255,0.16)',
  secondaryBorder: 'rgba(255,255,255,0.24)',
  focusRing: '0 0 0 2px rgba(107,231,255,0.85)',
  focusGlow: '0 0 18px rgba(107,231,255,0.45)',
  smallLabelColor: 'rgba(255,255,255,0.68)',
  buttonShadow: '0 15px 35px rgba(15,100,175,0.45)',
  buttonShape: 'pill'
}

const BUTTON_RADIUS_BY_SHAPE: Record<ButtonShape, string> = {
  soft: '14px',
  pill: '999px',
  sharp: '6px'
}

function buildDesignCss(tokens: DesignTokens): string {
  const buttonRadius =
    BUTTON_RADIUS_BY_SHAPE[tokens.buttonShape] ?? BUTTON_RADIUS_BY_SHAPE.soft
  return `
.bgo-overlay {
  --bgo-font-family: ${tokens.fontFamily};
  --bgo-card-radius: ${tokens.cardRadius};
  --bgo-button-radius: ${buttonRadius};
  --bgo-overlay-bg: ${tokens.overlayColor};
  --bgo-overlay-blur: ${tokens.overlayBlur};
  --bgo-card-bg: ${tokens.cardBackground};
  --bgo-card-border: ${tokens.cardBorder};
  --bgo-card-shadow: ${tokens.cardShadow};
  --bgo-text-primary: ${tokens.textPrimary};
  --bgo-text-muted: ${tokens.textMuted};
  --bgo-accent-bg: ${tokens.accentBackground};
  --bgo-accent-text: ${tokens.accentText};
  --bgo-accent-hover-bg: ${tokens.accentHoverBackground};
  --bgo-accent-hover-text: ${tokens.accentHoverText};
  --bgo-accent-border: ${tokens.accentBorder};
  --bgo-secondary-bg: ${tokens.secondaryBackground};
  --bgo-secondary-text: ${tokens.secondaryText};
  --bgo-secondary-hover-bg: ${tokens.secondaryHoverBackground};
  --bgo-secondary-border: ${tokens.secondaryBorder};
  --bgo-focus-ring: ${tokens.focusRing};
  --bgo-focus-glow: ${tokens.focusGlow};
  --bgo-small-text: ${tokens.smallLabelColor};
  --bgo-button-shadow: ${tokens.buttonShadow};
}
.bgo-overlay {
  position: fixed;
  z-index: 2147483647;
  inset: 0;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bgo-overlay-bg);
  backdrop-filter: var(--bgo-overlay-blur);
  opacity: 0;
  transition: opacity .25s ease;
}
.bgo-overlay.bgo-open { opacity: 1; }
.bgo-card {
  width: min(92vw, 620px);
  max-height: 88vh;
  overflow: auto;
  background: var(--bgo-card-bg);
  color: var(--bgo-text-primary);
  border-radius: var(--bgo-card-radius);
  border: 1px solid var(--bgo-card-border);
  box-shadow: var(--bgo-card-shadow);
  padding: 28px 30px 24px;
  position: relative;
  font-family: var(--bgo-font-family, system-ui, -apple-system, sans-serif);
}
.bgo-close {
  position: absolute;
  top: 18px;
  right: 22px;
  background: transparent;
  border: 0;
  color: var(--bgo-text-muted);
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  transition: color .2s ease;
}
.bgo-close:hover,
.bgo-close:focus-visible {
  color: var(--bgo-text-primary);
  outline: none;
}
.bgo-title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
  color: var(--bgo-text-primary);
}
.bgo-body {
  font-size: 16px;
  line-height: 1.7;
  color: var(--bgo-text-muted);
}
.bgo-body p { margin: 0 0 10px; }
.bgo-actions {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.bgo-link,
.bgo-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 11px 18px;
  border-radius: var(--bgo-button-radius);
  font-weight: 700;
  text-decoration: none;
  border: 1px solid var(--bgo-accent-border);
  color: var(--bgo-accent-text);
  background: var(--bgo-accent-bg);
  cursor: pointer;
  transition: transform .15s ease, background .2s ease, color .2s ease;
  box-shadow: var(--bgo-button-shadow);
}
.bgo-link:hover,
.bgo-button:hover {
  transform: translateY(-1px);
  background: var(--bgo-accent-hover-bg);
  color: var(--bgo-accent-hover-text);
}
.bgo-link:focus-visible,
.bgo-button:focus-visible {
  outline: none;
  box-shadow: var(--bgo-focus-ring), var(--bgo-focus-glow);
}
.bgo-button.secondary {
  background: var(--bgo-secondary-bg);
  color: var(--bgo-secondary-text);
  border-color: var(--bgo-secondary-border);
  box-shadow: none;
}
.bgo-button.secondary:hover {
  background: var(--bgo-secondary-hover-bg);
  color: var(--bgo-secondary-text);
}
.bgo-small {
  margin-top: 12px;
  font-size: 13px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--bgo-small-text);
}
@media (max-width: 520px) {
  .bgo-card {
    padding: 22px 20px 20px;
    border-radius: calc(var(--bgo-card-radius) - 6px);
  }
  .bgo-actions {
    flex-direction: column;
  }
  .bgo-link,
  .bgo-button {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .bgo-overlay,
  .bgo-link,
  .bgo-button {
    transition: none;
  }
}
`.trim()
}

let styleElement: HTMLStyleElement | null = null
let styleInstalled = false

function ensureStyle() {
  if (!IN_BROWSER || styleInstalled) return
  const cssText = buildDesignCss(TOKENS)
  styleElement = document.createElement('style')
  styleElement.textContent = cssText
  document.head.appendChild(styleElement)
  styleInstalled = true
}

function overlayRoot(mount?: HTMLElement | null): HTMLDivElement {
  ensureStyle()
  const root = document.createElement('div') as HTMLDivElement
  root.className = 'bgo-overlay'
  ;(mount || document.body).appendChild(root)
  requestAnimationFrame(() => root.classList.add('bgo-open'))
  return root
}

function destroyOverlay(root: HTMLElement) {
  root.classList.remove('bgo-open')
  setTimeout(() => root.remove(), 200)
}

function renderCard(
  root: HTMLElement,
  title: string,
  bodyHTML: string,
  onClose?: () => void
): { body: HTMLDivElement; actions: HTMLDivElement } {
  const card = document.createElement('div')
  card.className = 'bgo-card'
  const close = document.createElement('button')
  close.className = 'bgo-close'
  close.textContent = '×'
  close.setAttribute('aria-label', 'Close')
  const h = document.createElement('h2')
  h.className = 'bgo-title'
  h.textContent = title
  const b = document.createElement('div')
  b.className = 'bgo-body'
  b.innerHTML = bodyHTML
  const acts = document.createElement('div')
  acts.className = 'bgo-actions'
  card.appendChild(close)
  card.appendChild(h)
  card.appendChild(b)
  card.appendChild(acts)
  root.appendChild(card)
  root.addEventListener('click', (ev) => {
    if (ev.target === root) destroyOverlay(root)
  })
  close.addEventListener('click', () => {
    destroyOverlay(root)
    if (onClose) onClose()
  })
  return { body: b as HTMLDivElement, actions: acts as HTMLDivElement }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function resolveFundingOptions(overrides?: FundingModalOptions): ResolvedFundingOptions {
  return {
    title: overrides?.title ?? DEFAULT_FUNDING.title,
    introText: overrides?.introText ?? DEFAULT_FUNDING.introText,
    postPurchaseText: overrides?.postPurchaseText ?? DEFAULT_FUNDING.postPurchaseText,
    cancelText: overrides?.cancelText ?? DEFAULT_FUNDING.cancelText,
    satoshiShopUrl: overrides?.satoshiShopUrl ?? DEFAULT_FUNDING.satoshiShopUrl,
    satoshiShopPubKey:
      overrides?.satoshiShopPubKey ?? DEFAULT_FUNDING.satoshiShopPubKey
  }
}

interface FundingModalContext {
  root: HTMLDivElement
  desc: string
  body: HTMLDivElement
  content: HTMLDivElement
  stripe: any
  elements: any
  setContent: (html: string) => void
  ssr: StartShoppingResult | null
  currentReference: string
  needed: number
  cancelBtn: HTMLButtonElement
  cancel: () => void
  retry: () => void
  delay: () => Promise<void>
  buyOptions: Array<{ usd: number; sats: number }>
}

export async function showSatoshiShopFundingModal(
  wallet: WalletInterface,
  satoshisNeeded: number,
  options?: FundingModalOptions,
  actionDescription?: string,
  mount?: HTMLElement | null
): Promise<'cancel' | 'retry'> {
  if (!IN_BROWSER) return 'cancel'

  const opts = resolveFundingOptions(options)
  const shopClient = new SatoshiShopClient(wallet, opts.satoshiShopUrl)

  return await new Promise<'cancel' | 'retry'>((resolve) => {
    const ctx = setupContext()

    void shop()

    function setupContext(): FundingModalContext {
      const root = overlayRoot(mount)
      const cancel = () => {
        destroyOverlay(root)
        resolve('cancel')
      }
      const retry = () => {
        destroyOverlay(root)
        resolve('retry')
      }

      const desc = actionDescription
        ? `<p class="bgo-small">Action: <strong>${escapeHtml(actionDescription)}</strong></p>`
        : ''

      const { body, actions } = renderCard(
        root,
        opts.title,
        `${desc}<div id="funding-content"></div>`,
        () => {
          resolve('cancel')
        }
      )

      const content = body.querySelector('#funding-content') as HTMLDivElement

      const cancelBtn = document.createElement('button')
      cancelBtn.className = 'bgo-button secondary'
      cancelBtn.textContent = opts.cancelText
      cancelBtn.onclick = cancel

      actions.appendChild(cancelBtn)

      root.addEventListener('click', (e) => {
        if (e.target === root) {
          destroyOverlay(root)
          resolve('cancel')
        }
      })

      const context: FundingModalContext = {
        root,
        cancel,
        retry,
        delay: () => new Promise((res) => setTimeout(res, 2000)),
        desc,
        body,
        content,
        cancelBtn,
        setContent: (html: string) => {
          content.innerHTML = html
        },
        stripe: null,
        elements: null,
        ssr: null,
        currentReference: '',
        needed: satoshisNeeded,
        buyOptions: []
      }

      return context
    }

    async function shop(): Promise<void> {
      const loadStripePromise = loadStripe()

      try {
        ctx.setContent(`<p>${opts.introText}</p><p>Contacting the Satoshi Shop…</p>`)

        ctx.ssr = await shopClient.startShopping({})

        await processPendingTxs()

        if (ctx.needed <= 0) {
          ctx.needed = ctx.ssr?.minimumSatoshis ?? 0
        }

        await determineBuyOptions()

        if (ctx.buyOptions.length < 1) return

        await loadStripePromise

        await renderAmountSelector()
      } catch (e: any) {
        ctx.setContent(
          `<p style="color:#ff6b6b">An error occurred: ${escapeHtml(e.message)}</p>`
        )
        await ctx.delay()
        ctx.cancel()
      }
    }

    async function loadStripe(): Promise<void> {
      const setStripe = () => {
        ctx.stripe = (window as any).Stripe(opts.satoshiShopPubKey)
        ctx.elements = ctx.stripe.elements()
      }

      if ((window as any).Stripe) {
        setStripe()
        return
      }

      await new Promise<void>((resolveLoad, reject) => {
        const script = document.createElement('script')
        script.src = 'https://js.stripe.com/v3/'
        script.onerror = () => {
          reject(new Error(`Failed to load ${script.src}`))
        }
        script.onload = () => {
          setStripe()
          resolveLoad()
        }
        document.head.appendChild(script)
      })
    }

    async function processPendingTxs(): Promise<void> {
      if (!ctx.ssr?.pendingTxs?.length) return

      ctx.setContent('<p>Processing previous purchases…</p>')

      let recovered = 0
      for (const ref of ctx.ssr.pendingTxs) {
        try {
          const result = await shopClient.completeBuy({ reference: ref })
          if (result.satoshis) {
            ctx.needed -= result.satoshis
            recovered += result.satoshis
            ctx.setContent(
              `${ctx.content.innerHTML}<p>Processed prior purchase of ${result.satoshis.toLocaleString()} satoshis.</p>`
            )
          } else {
            ctx.setContent(
              `${ctx.content.innerHTML}<p>Prior purchase with reference ${ref} is still pending.</p>`
            )
          }
        } catch (e) {
          console.warn('Failed to complete pending purchase', ref, e)
          ctx.setContent(
            `${ctx.content.innerHTML}<p>Prior purchase with reference ${ref} could not be processed.</p>`
          )
        }
      }

      if (ctx.needed <= 0) {
        ctx.setContent(
          `${ctx.content.innerHTML}<p style="color:#4caf50">Your sats are up to date.</p>`
        )
      }

      await ctx.delay()

      if (ctx.needed <= 0) {
        ctx.retry()
      }
    }

    async function determineBuyOptions(): Promise<void> {
      if (!ctx.ssr) return

      const rate = ctx.ssr.satoshisPerUSD

      const bos = [
        { usd: 1, sats: Math.round(1 * rate) },
        { usd: 2, sats: Math.round(2 * rate) },
        { usd: 5, sats: Math.round(5 * rate) },
        { usd: 10, sats: Math.round(10 * rate) }
      ].filter(
        (o) =>
          o.sats >= (ctx.ssr as StartShoppingResult).minimumSatoshis &&
          o.sats <= (ctx.ssr as StartShoppingResult).maximumSatoshis
      )

      while (bos.length > 1 && bos[0].sats < ctx.needed) bos.shift()

      ctx.buyOptions = bos

      if (ctx.buyOptions.length === 0) {
        ctx.setContent(
          '<p>You have reached your current purchase limits.</p>' +
            '<p>Please try again tomorrow or seek other funding options.</p>'
        )
        await ctx.delay()
        ctx.cancel()
      }
    }

    async function renderAmountSelector(): Promise<void> {
      if (!ctx.ssr) return

      const validMillis = ctx.ssr.quoteValidUntil?.getTime() ?? Date.now()
      const validMinutes = Math.floor((validMillis - Date.now()) / 60000)
      const neededLabel = ctx.needed > 0 ? ctx.needed.toLocaleString() : 'some'

      ctx.setContent(`
        <div style="text-align:center;">
          <div id="buy-options">
            <p>You need <strong>${neededLabel}</strong> satoshis.</p>
            <p><strong>Choose an amount (rate of $1 for ${Math.round(
              Number(ctx.ssr.satoshisPerUSD)
            ).toLocaleString()} satoshis, valid for ${validMinutes} minutes):</strong></p>
            <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin:24px 0;">
              ${ctx.buyOptions
                .map(
                  (o) => `
                <button class="amount-btn" data-sats="${o.sats}" data-usd="${o.usd}"
                  style="padding:14px 20px;font-size:16px;border:2px solid #635BFF;background:transparent;color:#635BFF;border-radius:12px;cursor:pointer;min-width:100px;transition:all .2s;">
                  $${o.usd}
                </button>
              `
                )
                .join('')}
            </div>
          </div>

          <div id="payment-info" style="display:none;">
            <p id="purchase-details">Buying xxx satoshis for $yyy:</p>
            <div id="card-element" style="margin:30px auto;max-width:380px;">
              <div style="border:1px solid #ddd;padding:20px;border-radius:12px;background:#fafafa;">
                <div id="card-input"></div>
                <div id="card-errors" role="alert" style="color:#e74c3c;margin-top:12px;min-height:24px;"></div>
              </div>
            </div>
            <div id="payment-status" style="margin-top:20px;min-height:32px;font-size:16px;"></div>
          </div>
        </div>
      `)

      ctx.content
        .querySelectorAll<HTMLButtonElement>('.amount-btn')
        .forEach((btn) => {
          btn.addEventListener('click', () => {
            const sats = Number(btn.dataset.sats)
            const usd = Number(btn.dataset.usd)

            void clickBuyOption(sats, usd)
          })
        })
    }

    async function clickBuyOption(sats: number, usd: number): Promise<void> {
      const buyOptionsDiv = ctx.content.querySelector(
        '#buy-options'
      ) as HTMLDivElement | null
      if (buyOptionsDiv) {
        buyOptionsDiv.style.display = 'none'
      }

      const purchaseDetails = ctx.content.querySelector(
        '#purchase-details'
      ) as HTMLElement | null
      if (purchaseDetails) {
        purchaseDetails.textContent = `Buying ${sats.toLocaleString()} satoshis for $${usd.toFixed(0)}:`
      }

      await initiatePurchase(sats, usd)
    }

    async function initiatePurchase(sats: number, usd: number): Promise<void> {
      const statusEl = ctx.content.querySelector('#payment-status') as HTMLElement
      const cardErrorsEl = ctx.content.querySelector('#card-errors') as HTMLElement
      statusEl.textContent = 'Preparing payment…'

      try {
        const init = await shopClient.initiateBuy({
          numberOfSatoshis: sats,
          quoteId: Number(ctx.ssr?.quoteId ?? 0),
          customerAcceptsPaymentTerms: 'I Accept'
        })

        ctx.currentReference = init.reference

        const cardEl = ctx.content.querySelector(
          '#card-element'
        ) as HTMLElement
        const inputContainer = ctx.content.querySelector('#card-input') as HTMLElement
        inputContainer.innerHTML = ''

        cardEl.style.display = 'block'
        statusEl.textContent = 'Enter card details above.'

        const style = { base: { fontSize: '16px', lineHeight: '1.5' } }
        const elts: Record<
          string,
          {
            key: string
            name: string
            element: any
            div: HTMLDivElement
            complete: boolean
            empty: boolean
            error?: any
          }
        > = {}

        const submitBtn = document.createElement('button')

        const updateButton = () => {
          const allComplete = Object.values(elts).every((s) => s.complete)
          submitBtn.disabled = !allComplete
        }

        const handleStripeChange = (event: any, key: string) => {
          const elt = elts[key]
          elt.complete = !!event.complete
          elt.empty = !!event.empty
          elt.error = event.error
          if (event.error) {
            cardErrorsEl.textContent = event.error.message
          } else {
            cardErrorsEl.textContent = ''
          }
          updateButton()
        }

        for (const { key, name } of [
          { key: 'cardNumber', name: 'card number' },
          { key: 'cardExpiry', name: 'expiration date' },
          { key: 'cardCvc', name: 'security code' },
          { key: 'postalCode', name: 'postal code' }
        ]) {
          const element = ctx.elements.create(key, { style })
          const div = document.createElement('div')
          inputContainer.appendChild(div)
          element.mount(div)
          element.on('change', (event: any) => handleStripeChange(event, key))
          elts[key] = {
            key,
            name,
            element,
            div,
            complete: false,
            empty: true,
            error: undefined
          }
        }

        submitBtn.id = 'submit-payment'
        submitBtn.textContent = `Pay $${usd.toFixed(0)}`
        submitBtn.disabled = true
        submitBtn.style.cssText =
          'margin-top:16px;padding:12px 20px;background:#635BFF;color:white;border:none;border-radius:8px;width:100%;font-size:16px;cursor:pointer;'
        inputContainer.after(submitBtn)

        updateButton()

        submitBtn.onclick = async () => {
          submitBtn.disabled = true
          submitBtn.textContent = 'Processing…'
          statusEl.textContent = 'Confirming with your bank…'

          let hasError = false
          for (const key of ['cardNumber', 'cardExpiry', 'cardCvc', 'postalCode']) {
            const elt = elts[key]
            if (elt.empty) {
              cardErrorsEl.textContent = `Your ${elt.name} is incomplete.`
              hasError = true
            } else if (elt.error) {
              cardErrorsEl.textContent =
                elt.error.message || `Your ${elt.name} is invalid.`
              hasError = true
            }
          }

          if (hasError) {
            cardEl.style.display = 'block'
            statusEl.textContent = ''
            submitBtn.disabled = false
            submitBtn.textContent = `Pay $${usd.toFixed(0)}`
            return
          }

          cardEl.style.display = 'none'

          const { error, paymentIntent } = await ctx.stripe.confirmCardPayment(
            init.clientSecret,
            {
              payment_method: {
                card: elts['cardNumber'].element,
                billing_details: {
                  address: { postal_code: elts['postalCode'].element.value }
                }
              }
            }
          )

          if (error) {
            cardEl.style.display = 'block'
            cardErrorsEl.textContent = error.message || 'Payment failed.'
            statusEl.textContent = ''
            submitBtn.disabled = false
            submitBtn.textContent = `Pay $${usd.toFixed(0)}`
            return
          }

          if (paymentIntent?.status === 'succeeded') {
            statusEl.innerHTML =
              '<span style="color:#4caf50;">Payment successful! Delivering satoshis…</span>'
            await finalizePurchase(ctx.currentReference)
          }
        }

        const paymentInfoDiv = ctx.content.querySelector(
          '#payment-info'
        ) as HTMLDivElement | null
        if (paymentInfoDiv) {
          paymentInfoDiv.style.display = 'block'
        }
      } catch (e: any) {
        statusEl.innerHTML = `<span style="color:#e74c3c;">Error: ${escapeHtml(
          e.message
        )}</span>`
      }
    }

    async function finalizePurchase(reference: string): Promise<void> {
      const statusEl = ctx.content.querySelector('#payment-status') as HTMLElement

      const poll = async () => {
        try {
          const result = await shopClient.completeBuy({ reference })

          if (result.status === 'bitcoin-payment-acknowledged' && result.satoshis) {
            ctx.needed = Math.max(0, ctx.needed - result.satoshis)

            statusEl.innerHTML = `<p style="color:#4caf50;font-weight:600;">
              Success! +${result.satoshis.toLocaleString()} satoshis added
            </p>`

            if (ctx.needed <= 0) {
              await new Promise((res) => setTimeout(res, 2000))
              destroyOverlay(ctx.root)
              resolve('retry')
            } else {
              ctx.setContent(`
                <p style="color:#4caf50;font-weight:600;">
                  Success! ${result.satoshis.toLocaleString()} satoshis added
                </p>
                <p>You now need <strong>${ctx.needed.toLocaleString()}</strong> more satoshis.</p>
              `)
              await renderAmountSelector()
            }
            return
          }

          statusEl.textContent = 'Delivering satoshis…'
          setTimeout(poll, 2000)
        } catch (e: any) {
          statusEl.innerHTML = `<span style="color:#e74c3c;">Delivery failed: ${e.message}</span>`
        }
      }

      void poll()
    }
  })
}
