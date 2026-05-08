import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { IconButton } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { THEME_PARAM } from '@/lib/themeMode';

/**
 * Floating back-to-index button for individual widget pages. Preserves the
 * active theme preference so navigation doesn't reset to system default.
 */
const BackButton = () => {
  const [searchParams] = useSearchParams();
  const theme = searchParams.get(THEME_PARAM);
  const to = theme ? `/?${THEME_PARAM}=${encodeURIComponent(theme)}` : '/';

  return (
    <IconButton
      component={RouterLink}
      to={to}
      aria-label="back to widgets"
      size="small"
      sx={{
        position: 'fixed',
        top: 12,
        left: 12,
        zIndex: 10,
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: 2,
        '&:hover': { backgroundColor: 'background.default' },
      }}
    >
      <ArrowBackIcon fontSize="small" />
    </IconButton>
  );
};

export default BackButton;
