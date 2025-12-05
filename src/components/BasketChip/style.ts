import type { Theme } from '@mui/material/styles'

export default (theme: Theme) => ({
  table_picture: {
    maxWidth: '5em',
    borderRadius: '3em'
  },
  expires: {
    fontSize: '0.95em',
    color: theme.palette.text.secondary,
    textAlign: 'center',
    visibility: 'hidden',
    opacity: 0,
    transition: 'all 0.8s'
  }
})
