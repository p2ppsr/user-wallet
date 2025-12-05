import { ReactNode } from 'react';
import { Paper, Stack, Typography, Box } from '@mui/material';

type DetailsSectionProps = {
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  padding?: number;
};

const DetailsSection = ({
  title,
  subtitle,
  actions,
  children,
  padding = 3,
}: DetailsSectionProps) => (
  <Paper
    elevation={0}
    sx={{
      p: padding,
      borderRadius: 3,
      backgroundColor: 'background.paper',
      border: theme => `1px solid ${theme.palette.divider}`,
    }}
  >
    <Stack spacing={2}>
      {(title || subtitle || actions) && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Box>
            {title && (
              <Typography variant="h5" color="textPrimary">
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {actions && <Box>{actions}</Box>}
        </Stack>
      )}
      <Box>{children}</Box>
    </Stack>
  </Paper>
);

export default DetailsSection;
