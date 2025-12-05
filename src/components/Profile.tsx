import { useState, useEffect, useContext, useCallback, useRef } from 'react'
import AmountDisplay from './AmountDisplay'
import { Skeleton, Stack, Typography } from '@mui/material'
import { WalletContext } from '../WalletContext'

const Profile = () => {
  const { managers, adminOriginator } = useContext(WalletContext)
  const [accountBalance, setAccountBalance] = useState<number | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const refreshBalance = useCallback(async () => {
    try {
      if (!managers?.permissionsManager) {
        return
      }
      // Only show loading state on initial load, not on refreshes
      if (isInitialLoad) {
        setBalanceLoading(true)
      }
      const limit = 10000
      let offset = 0
      let allOutputs = []

      // Fetch the first page
      const firstPage = await managers.permissionsManager.listOutputs({ basket: 'default', limit, offset }, adminOriginator)
      allOutputs = firstPage.outputs;
      const totalOutputs = firstPage.totalOutputs;

      // Fetch subsequent pages until we've retrieved all outputs
      while (allOutputs.length < totalOutputs) {
        offset += limit;
        const { outputs } = await managers.permissionsManager.listOutputs({ basket: 'default', limit, offset }, adminOriginator);
        allOutputs = allOutputs.concat(outputs);
      }

      const total = allOutputs.reduce((acc, output) => acc + output.satoshis, 0)
      setAccountBalance(total)
      if (isInitialLoad) {
        setBalanceLoading(false)
        setIsInitialLoad(false)
      }
    } catch (e) {
      if (isInitialLoad) {
        setBalanceLoading(false)
        setIsInitialLoad(false)
      }
    }
  }, [managers, adminOriginator, isInitialLoad])

  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  // Keep a ref to the latest refreshBalance function
  const refreshBalanceRef = useRef(refreshBalance)

  useEffect(() => {
    refreshBalanceRef.current = refreshBalance
  }, [refreshBalance])

  // Refresh balance when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      refreshBalanceRef.current()
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return (<Stack alignItems="center">
    <Typography variant='h5' color='textSecondary' align='center'>
      Your Balance
    </Typography>
    <Typography
      onClick={() => refreshBalance()}
      color='textPrimary'
      variant='h2'
      align='center'
      style={{ cursor: 'pointer' }}
    >
      {!managers?.permissionsManager || balanceLoading
        ? <Skeleton width={120} />
        : <AmountDisplay abbreviate>{accountBalance}</AmountDisplay>}
    </Typography>
  </Stack>)
}

export default Profile
