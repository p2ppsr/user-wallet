import { useMemo } from 'react'
import { useTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

type StyleFactory<T> = (theme: Theme) => T

export function useSxStyles<T>(factory: StyleFactory<T>): T {
  const theme = useTheme()
  return useMemo(() => factory(theme), [factory, theme])
}

export default useSxStyles
