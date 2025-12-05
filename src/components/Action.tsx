/* eslint-disable react/prop-types */
import { useState, useMemo, type FC } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Paper,
  Box,
  Tooltip,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { alpha } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CheckIcon from '@mui/icons-material/Check';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CallReceivedIcon from '@mui/icons-material/CallReceived';
import CallMadeIcon from '@mui/icons-material/CallMade';
import AmountDisplay from './AmountDisplay';
import { WalletActionInput, WalletActionOutput } from '@bsv/sdk';

interface ActionProps {
  txid: string;
  description: string;
  amount: string | number;
  inputs: WalletActionInput[];
  outputs: WalletActionOutput[];
  fees?: string | number;
  onClick?: () => void;
  isExpanded?: boolean;
}

const Action: FC<ActionProps> = ({
  txid,
  description,
  amount,
  inputs,
  outputs,
  fees,
  onClick,
  isExpanded,
}) => {
  const [expanded, setExpanded] = useState<boolean>(isExpanded || false);
  const [copied, setCopied] = useState<boolean>(false);
  const theme = useTheme();
  const styles = useMemo(() => {
    const isDark = theme.palette.mode === 'dark';
    return {
      detailCard: {
        p: { xs: 2, md: 3 },
        mb: 2,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
        backgroundColor: isDark
          ? alpha(theme.palette.background.paper, 0.8)
          : alpha(theme.palette.background.paper, 0.9),
        transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: theme.shadows[3],
          backgroundColor: isDark
            ? alpha(theme.palette.background.paper, 0.9)
            : alpha(theme.palette.background.paper, 0.98)
        }
      },
      sectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        mb: 1.5
      },
      infoIcon: {
        fontSize: '1rem',
        cursor: 'help',
        color: theme.palette.text.secondary
      },
      txidContainer: {
        backgroundColor: isDark
          ? alpha(theme.palette.common.white, 0.08)
          : alpha(theme.palette.primary.main, 0.05),
        borderRadius: 1,
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        flexWrap: 'wrap'
      },
      txid: {
        fontFamily: '"Roboto Mono","SFMono-Regular","Menlo","Monaco","Consolas","Liberation Mono","Courier New",monospace',
        fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
        lineHeight: 1.5,
        color: theme.palette.text.primary,
        userSelect: 'all',
        wordBreak: 'break-all'
      }
    } as const
  }, [theme]);

  const determineAmountColor = (amount: string | number): string => {
    const amountAsString = amount.toString()[0];
    if (amountAsString !== '-' && !isNaN(Number(amountAsString))) {
      return 'green';
    } else if (amountAsString === '-') {
      return 'red';
    } else {
      return 'black';
    }
  };

  const handleExpand = () => {
    if (isExpanded !== undefined) {
      setExpanded(isExpanded);
    } else {
      setExpanded(!expanded);
    }
    if (onClick) {
      onClick();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(txid);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const splitString = (str: string, length: number): [string, string] => {
    if (str === undefined || str === null) {
      str = '';
    }
    const firstLine = str.slice(0, length);
    const secondLine = str.slice(length);
    return [firstLine, secondLine];
  };

  const [firstLine, secondLine] = splitString(txid, 32);

  const totalInputAmount = inputs?.reduce((sum, input) => sum + Number(input.sourceSatoshis), 0) || 0;
  const totalOutputAmount = outputs?.reduce((sum, output) => sum + Number(output.satoshis), 0) || 0;

  return (
    <Accordion expanded={expanded} onChange={handleExpand}>
      <AccordionSummary
        style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
        expandIcon={<ExpandMoreIcon />}
        aria-controls="transaction-details-content"
        id="transaction-details-header"
      >
        <Grid container direction="column">
          <Grid>
            <Typography
              variant="h5"
              style={{ color: 'textPrimary', wordBreak: 'break-all' }}
            >
              {description}
            </Typography>
          </Grid>
          <Grid>
            <Grid container justifyContent="space-between">
              <Grid>
                <Typography variant="h6" style={{ color: determineAmountColor(amount) }}>
                  <AmountDisplay showPlus>{amount}</AmountDisplay>
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ width: '100%' }}>
          {/* Transaction ID Section */}
          <Paper elevation={0} sx={styles.detailCard}>
            <Box sx={styles.sectionTitle}>
              <Typography variant="h6">Transaction ID</Typography>
              <Tooltip title="Unique identifier for this transaction">
                <InfoOutlinedIcon sx={styles.infoIcon} />
              </Tooltip>
            </Box>
            <Box sx={styles.txidContainer}>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Box component="pre" sx={{ m: 0, fontFamily: 'inherit', fontSize: 'inherit', whiteSpace: 'pre' }}>
                    <Box component="code" sx={styles.txid}>
                      {firstLine}
                    </Box>
                  </Box>
                  {secondLine && (
                    <Box component="pre" sx={{ m: 0, fontFamily: 'inherit', fontSize: 'inherit', whiteSpace: 'pre' }}>
                      <Box component="code" sx={styles.txid}>
                        {secondLine}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
              <IconButton
                onClick={handleCopy}
                disabled={copied}
                size="small"
                sx={{
                  flexShrink: 0,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.12)',
                  }
                }}
              >
                {copied ? <CheckIcon /> : <FileCopyIcon />}
              </IconButton>
            </Box>
          </Paper>

          {/* Transaction Summary */}
          <Paper elevation={0} sx={styles.detailCard}>
            <Box sx={styles.sectionTitle}>
              <Typography variant="h6">Transaction Summary</Typography>
            </Box>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, 
              gap: 2 
            }}>
              <Box sx={{
                p: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                textAlign: 'center'
              }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Total Input
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: 'success.main'
                  }}
                >
                  <AmountDisplay>{totalInputAmount}</AmountDisplay>
                </Typography>
              </Box>
              
              <Box sx={{
                p: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                textAlign: 'center'
              }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Total Output
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: 'primary.main'
                  }}
                >
                  <AmountDisplay>{totalOutputAmount}</AmountDisplay>
                </Typography>
              </Box>
              
              <Box sx={{
                p: 2,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                textAlign: 'center'
              }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  Network Fees
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: 'warning.main'
                  }}
                >
                  <AmountDisplay>{fees || 0}</AmountDisplay>
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Inputs Section */}
          {inputs && inputs.length > 0 && (
            <Paper elevation={0} sx={styles.detailCard}>
              <Box sx={styles.sectionTitle}>
                <CallReceivedIcon color="primary" />
                <Typography variant="h6">Inputs</Typography>
                <Typography variant="body2" color="textSecondary">
                  ({inputs.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {inputs.map((input, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        sx={{ fontSize: '0.75rem', mb: 0.5 }}
                      >
                        Input #{index + 1}
                      </Typography>
                      <Typography>
                        {input.inputDescription}
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 2, flexShrink: 0 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          color: 'text.primary'
                        }}
                      >
                        <AmountDisplay description={input.inputDescription}>
                          {input.sourceSatoshis}
                        </AmountDisplay>
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Outputs Section */}
          {outputs && outputs.length > 0 && (
            <Paper elevation={0} sx={styles.detailCard}>
              <Box sx={styles.sectionTitle}>
                <CallMadeIcon color="primary" />
                <Typography variant="h6">Outputs</Typography>
                <Typography variant="body2" color="textSecondary">
                  ({outputs.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {outputs.map((output, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        color="textSecondary" 
                        sx={{ fontSize: '0.75rem', mb: 0.5 }}
                      >
                        Output #{index + 1}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          wordBreak: 'break-word',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {output.outputDescription}
                      </Typography>
                    </Box>
                    <Box sx={{ ml: 2, flexShrink: 0 }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          color: 'text.primary'
                        }}
                      >
                        <AmountDisplay description={output.outputDescription}>
                          {output.satoshis}
                        </AmountDisplay>
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      </AccordionDetails>
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Alert severity="success">Transaction ID copied!</Alert>
      </Snackbar>
    </Accordion>
  );
};

export default Action;
