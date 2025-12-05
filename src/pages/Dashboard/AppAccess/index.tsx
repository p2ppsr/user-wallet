import { useCallback, useEffect, useMemo, useState, useContext } from 'react';
import { Box, Grid, IconButton, Stack, Typography, CircularProgress } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import { useParams } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';
import DetailsSection from '../../../components/DetailsSection';
import AccessAtAGlance from '../../../components/AccessAtAGlance';
import ProtocolPermissionList from '../../../components/ProtocolPermissionList';
import BasketAccessList from '../../../components/BasketAccessList';
import CertificateAccessList from '../../../components/CertificateAccessList';
import SpendingAuthorizationList from '../../../components/SpendingAuthorizationList';
import fetchAndCacheAppData from '../../../utils/fetchAndCacheAppData';
import { DEFAULT_APP_ICON } from '../../../constants/popularApps';
import { WalletContext } from '../../../WalletContext';
import { openUrl } from '../../../utils/openUrl';

const AppAccess = () => {
  const { originator: encodedOriginator } = useParams<{ originator: string }>();
  const originator = decodeURIComponent(encodedOriginator);
  const normalizedDomain = useMemo(
    () => originator.replace(/^https?:\/\//, ''),
    [originator]
  );
  const appUrl = useMemo(() => `https://${normalizedDomain}`, [normalizedDomain]);
  const { managers } = useContext(WalletContext);

  const [appIcon, setAppIcon] = useState(DEFAULT_APP_ICON);
  const [appName, setAppName] = useState(() => {
    const label = normalizedDomain.split('.')[0] ?? normalizedDomain;
    return label.charAt(0).toUpperCase() + label.slice(1);
  });
  const [copied, setCopied] = useState<{ url?: boolean }>({});
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setAppIcon(DEFAULT_APP_ICON);
    setLoadingMeta(true);

    fetchAndCacheAppData(
      normalizedDomain,
      icon => {
        if (!cancelled) setAppIcon(icon);
      },
      name => {
        if (!cancelled && name) setAppName(name);
      },
      DEFAULT_APP_ICON
    ).finally(() => {
      if (!cancelled) setLoadingMeta(false);
    });

    return () => {
      cancelled = true;
    };
  }, [normalizedDomain]);

  const handleCopy = useCallback((value: string) => {
    navigator.clipboard.writeText(value);
    setCopied({ url: true });
    window.setTimeout(() => setCopied({}), 2000);
  }, []);

  const handleLaunch = useCallback(() => {
    openUrl(appUrl);
  }, [appUrl]);

  const renderLoading = !managers?.permissionsManager || loadingMeta;

  return (
    <Stack spacing={3} sx={{ p: 2 }}>
      <PageHeader
        title={appName}
        subheading={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="caption" color="textSecondary" sx={{ wordBreak: 'break-all' }}>
              {appUrl}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleCopy(appUrl)}
              disabled={!!copied.url}
              sx={{ ml: 0.5 }}
            >
              {copied.url ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
            </IconButton>
          </Stack>
        }
        icon={appIcon}
        buttonTitle="Launch"
        buttonIcon={<LaunchIcon />}
        onClick={handleLaunch}
      />

      <DetailsSection
        title="Overview"
        subtitle="Recent activity across baskets, protocols, and certificates."
      >
        {renderLoading ? (
          <Box py={6} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <AccessAtAGlance
            originator={normalizedDomain}
          />
        )}
      </DetailsSection>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <DetailsSection
            title="Protocol Permissions"
            subtitle="Apps and counterparties that can use this app through specific protocols."
          >
            <ProtocolPermissionList
              app={normalizedDomain}
              itemsDisplayed="protocols"
              showEmptyList
              canRevoke
              displayCount={false}
            />
          </DetailsSection>
        </Grid>
        <Grid item xs={12} lg={6}>
          <DetailsSection
            title="Spending Authorization"
            subtitle="Monthly spending privileges granted to this app."
          >
            <SpendingAuthorizationList app={normalizedDomain} />
          </DetailsSection>
        </Grid>
        <Grid item xs={12} lg={6}>
          <DetailsSection
            title="Basket Access"
            subtitle="Tokens and baskets this app can view."
          >
            <BasketAccessList
              app={normalizedDomain}
              itemsDisplayed="baskets"
              showEmptyList
              canRevoke
            />
          </DetailsSection>
        </Grid>
        <Grid item xs={12} lg={6}>
          <DetailsSection
            title="Certificates Revealed"
            subtitle="Certificate data this app has seen."
          >
            <CertificateAccessList
              app={normalizedDomain}
              itemsDisplayed="certificates"
              type="certificate"
              showEmptyList
              canRevoke
              displayCount={false}
            />
          </DetailsSection>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default AppAccess;
