import { Box } from '@mui/material'
import AppLogo from './AppLogo'

const PageLoading: React.FC = () => (
  <Box
    sx={{
      height: '100vh',
      width: '100vw',
      display: 'grid',
      placeItems: 'center',
      background: (theme) => `radial-gradient(circle at 18% 20%, ${theme.palette.mode === 'light' ? 'rgba(93,226,194,0.14)' : 'rgba(93,226,194,0.16)'}, transparent 35%), radial-gradient(circle at 78% 14%, ${theme.palette.mode === 'light' ? 'rgba(255,155,115,0.16)' : 'rgba(255,155,115,0.18)'}, transparent 34%), linear-gradient(180deg, ${theme.palette.background.default}, ${theme.palette.mode === 'light' ? '#E7EDF3' : '#050A12'})`
    }}
  >
    <AppLogo rotate size={140} />
  </Box>
)

export default PageLoading
