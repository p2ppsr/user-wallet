import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { GlobalStyles, IconButton, useTheme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

const ThemedToastContainer = () => {
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'

  const accent = {
    info: theme.palette.primary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main
  }

  const baseGradient = isLight
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.16)})`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.light ?? theme.palette.primary.main, 0.28)}, ${alpha(theme.palette.secondary.light ?? theme.palette.secondary.main, 0.22)})`

  const borderColor = isLight
    ? alpha(theme.palette.primary.main, 0.22)
    : alpha(theme.palette.common.white, 0.16)

  const baseShadow = isLight
    ? `0 18px 32px ${alpha('#0F1624', 0.16)}`
    : `0 20px 40px ${alpha('#000000', 0.65)}`

  const closeColor = alpha(theme.palette.text.primary, 0.65)
  const closeHover = alpha(theme.palette.primary.main, isLight ? 0.18 : 0.28)

  const typeStyles = (color: string) => ({
    borderLeftColor: alpha(color, 0.95),
    boxShadow: `${baseShadow}, 0 10px 30px ${alpha(color, isLight ? 0.26 : 0.45)}`
  })

  const typeProgress = (color: string) => ({
    background: `linear-gradient(90deg, ${alpha(color, 0.25)} 0%, ${alpha(color, 0.85)} 100%)`
  })

  return (
    <>
      <GlobalStyles
        styles={{
          ':root': {
            '--toastify-color-light': 'rgba(255,255,255,0.92)',
            '--toastify-color-dark': 'rgba(7,10,24,0.94)',
            '--toastify-text-color-light': theme.palette.text.primary,
            '--toastify-text-color-dark': alpha(theme.palette.text.primary, 0.92),
            '--toastify-color-info': accent.info,
            '--toastify-color-success': accent.success,
            '--toastify-color-warning': accent.warning,
            '--toastify-color-error': accent.error,
            '--toastify-icon-color-info': accent.info,
            '--toastify-icon-color-success': accent.success,
            '--toastify-icon-color-warning': accent.warning,
            '--toastify-icon-color-error': accent.error
          },
          '.userwallet-toast': {
            borderRadius: 20,
            padding: '0.85rem 1rem',
            borderLeft: '4px solid transparent',
            background: baseGradient,
            color: theme.palette.text.primary,
            border: `1px solid ${borderColor}`,
            boxShadow: baseShadow,
            backdropFilter: 'blur(18px)',
            fontFamily: theme.typography.fontFamily,
            letterSpacing: '0.01em'
          },
          '.userwallet-toast.Toastify__toast--info': typeStyles(accent.info),
          '.userwallet-toast.Toastify__toast--success': typeStyles(accent.success),
          '.userwallet-toast.Toastify__toast--warning': typeStyles(accent.warning),
          '.userwallet-toast.Toastify__toast--error': typeStyles(accent.error),
          '.userwallet-toast .Toastify__toast-body': {
            display: 'grid',
            gap: '0.2rem',
            padding: 0,
            margin: 0,
            color: 'inherit',
            fontSize: '0.95rem',
            lineHeight: 1.45
          },
          '.userwallet-toast .Toastify__toast-icon': {
            marginInlineEnd: '0.65rem'
          },
          '.userwallet-toast .Toastify__toast-icon svg': {
            width: 22,
            height: 22
          },
          '.userwallet-toast .Toastify__close-button': {
            alignSelf: 'center',
            color: closeColor,
            opacity: 1,
            transition: 'color 160ms ease, background-color 160ms ease',
            '&:hover': {
              color: theme.palette.primary.main,
              backgroundColor: closeHover
            }
          },
          '.userwallet-toast-progress': {
            height: 4,
            borderRadius: 999,
            background: alpha(theme.palette.primary.main, 0.4)
          },
          '.userwallet-toast.Toastify__toast--info .userwallet-toast-progress': typeProgress(accent.info),
          '.userwallet-toast.Toastify__toast--success .userwallet-toast-progress': typeProgress(accent.success),
          '.userwallet-toast.Toastify__toast--warning .userwallet-toast-progress': typeProgress(accent.warning),
          '.userwallet-toast.Toastify__toast--error .userwallet-toast-progress': typeProgress(accent.error),
          '.Toastify__toast-container': {
            padding: theme.spacing(1.5),
            width: 'min(360px, 90vw)'
          },
          [theme.breakpoints.down('sm')]: {
            '.Toastify__toast-container': {
              padding: theme.spacing(1),
              width: 'calc(100vw - 32px)'
            }
          }
        }}
      />
      <ToastContainer
        closeButton={({ closeToast }) => (
          <IconButton
            size="small"
            aria-label="Dismiss notification"
            onClick={closeToast}
            sx={{
              color: closeColor,
              '&:hover': {
                color: theme.palette.primary.main,
                backgroundColor: closeHover
              }
            }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        )}
        position="top-right"
        autoClose={4200}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover
        pauseOnFocusLoss
        theme={isLight ? 'light' : 'dark'}
        toastClassName="userwallet-toast"
        progressClassName="userwallet-toast-progress"
        limit={4}
      />
    </>
  )
}

export default ThemedToastContainer
