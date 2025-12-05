import { useContext, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { WalletContext } from "../WalletContext"
import { UserContext } from "../UserContext"

// -----
// AuthRedirector: Handles auto-login redirect when snapshot has loaded
// -----
export default function AuthRedirector(): null {
    const navigate = useNavigate()
    const location = useLocation()
    const { managers, snapshotLoaded } = useContext(WalletContext)
    const { setPageLoaded } = useContext(UserContext)
    const hasRedirectedRef = useRef(false)

    useEffect(() => {
        const isAuthenticated = !!managers?.walletManager?.authenticated
        if (!isAuthenticated) {
            hasRedirectedRef.current = false
        }

        if (
            isAuthenticated &&
            snapshotLoaded &&
            !hasRedirectedRef.current
        ) {
            const path = location.pathname || '/'
            const shouldRedirectToHome =
                path === '/' ||
                path === '/dashboard' ||
                path === '/dashboard/'

            if (shouldRedirectToHome) {
                hasRedirectedRef.current = true
                navigate('/dashboard/home', { replace: true })
            }
        }
        setPageLoaded(true)
    }, [managers?.walletManager?.authenticated, snapshotLoaded, navigate, location.pathname, setPageLoaded])

    return null
}
