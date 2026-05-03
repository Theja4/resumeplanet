'use client'

type PolarCheckoutEvent = 'loaded' | 'close' | 'confirmed' | 'success'

type PolarSuccessDetail = {
  successURL?: string
  redirect?: boolean
}

type PolarListener = (event: CustomEvent<unknown>) => void

const POLAR_MESSAGE_TYPE = 'POLAR_CHECKOUT'
const POLAR_ORIGINS = new Set(['https://polar.sh', 'https://sandbox.polar.sh'])

export class PolarEmbedCheckout {
  private eventTarget = new EventTarget()
  private isLoaded = false
  private isClosable = true

  private constructor(
    private iframe: HTMLIFrameElement,
    private loader: HTMLDivElement,
    private style: HTMLStyleElement,
  ) {
    window.addEventListener('message', this.handleWindowMessage)
    this.addEventListener('loaded', this.handleLoaded)
    this.addEventListener('close', this.handleClose)
    this.addEventListener('confirmed', this.handleConfirmed)
    this.addEventListener('success', this.handleSuccess)
  }

  static async create(url: string, options?: { theme?: 'light' | 'dark' }) {
    const style = document.createElement('style')
    style.textContent = `
      .polar-loader-spinner {
        width: 20px;
        aspect-ratio: 1;
        border-radius: 50%;
        background: ${options?.theme === 'dark' ? '#000' : '#fff'};
        box-shadow: 0 0 0 0 ${options?.theme === 'dark' ? '#fff' : '#000'};
        animation: polar-loader-spinner-animation 1s infinite;
      }
      @keyframes polar-loader-spinner-animation {
        100% { box-shadow: 0 0 0 30px #0000; }
      }
      body.polar-no-scroll { overflow: hidden; }
    `
    document.head.appendChild(style)

    const loader = document.createElement('div')
    loader.style.position = 'fixed'
    loader.style.top = '50%'
    loader.style.left = '50%'
    loader.style.transform = 'translate(-50%, -50%)'
    loader.style.zIndex = '2147483647'
    loader.style.colorScheme = 'auto'

    const spinner = document.createElement('div')
    spinner.className = 'polar-loader-spinner'
    loader.appendChild(spinner)

    document.body.classList.add('polar-no-scroll')
    document.body.appendChild(loader)

    const embedUrl = new URL(url)
    embedUrl.searchParams.set('embed', 'true')
    embedUrl.searchParams.set('embed_origin', window.location.origin)
    if (options?.theme) {
      embedUrl.searchParams.set('theme', options.theme)
    }

    const iframe = document.createElement('iframe')
    iframe.src = embedUrl.toString()
    iframe.style.position = 'fixed'
    iframe.style.inset = '0'
    iframe.style.width = '100%'
    iframe.style.height = '100%'
    iframe.style.border = 'none'
    iframe.style.zIndex = '2147483647'
    iframe.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
    iframe.style.colorScheme = 'auto'
    iframe.allow = "payment 'self' https://polar.sh https://sandbox.polar.sh; publickey-credentials-get 'self' https://polar.sh https://sandbox.polar.sh;"
    document.body.appendChild(iframe)

    const checkout = new PolarEmbedCheckout(iframe, loader, style)

    return new Promise<PolarEmbedCheckout>((resolve) => {
      checkout.addEventListener('loaded', () => resolve(checkout), { once: true })
    })
  }

  close() {
    window.removeEventListener('message', this.handleWindowMessage)
    document.body.classList.remove('polar-no-scroll')

    if (document.body.contains(this.iframe)) {
      document.body.removeChild(this.iframe)
    }

    if (document.body.contains(this.loader)) {
      document.body.removeChild(this.loader)
    }

    if (document.head.contains(this.style)) {
      document.head.removeChild(this.style)
    }
  }

  addEventListener(type: PolarCheckoutEvent, listener: PolarListener, options?: AddEventListenerOptions | boolean) {
    this.eventTarget.addEventListener(type, listener as EventListener, options)
  }

  removeEventListener(type: PolarCheckoutEvent, listener: PolarListener) {
    this.eventTarget.removeEventListener(type, listener as EventListener)
  }

  private handleLoaded = () => {
    if (this.isLoaded) return
    this.isLoaded = true

    if (document.body.contains(this.loader)) {
      document.body.removeChild(this.loader)
    }
  }

  private handleClose = () => {
    if (this.isClosable) {
      this.close()
    }
  }

  private handleConfirmed = () => {
    this.isClosable = false
  }

  private handleSuccess = (event: CustomEvent<unknown>) => {
    this.isClosable = true

    const detail = event.detail as PolarSuccessDetail
    if (detail.redirect && detail.successURL) {
      window.location.href = detail.successURL
    }
  }

  private handleWindowMessage = ({ data, origin }: MessageEvent) => {
    if (!POLAR_ORIGINS.has(origin) || data?.type !== POLAR_MESSAGE_TYPE) return

    this.eventTarget.dispatchEvent(
      new CustomEvent(data.event, {
        detail: data,
        cancelable: true,
      })
    )
  }
}
