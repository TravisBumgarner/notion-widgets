import {
  Box,
  Card,
  CardActionArea,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ThemePicker from '@/components/ThemePicker';
import { SPACING } from '@/styles/styleConsts';
import { WIDGETS } from '@/widgets/registry';

const IndexPage = () => {
  return (
    <Box
      component="main"
      sx={{
        maxWidth: 720,
        mx: 'auto',
        px: SPACING.MEDIUM.PX,
        py: SPACING.HUGE.PX,
      }}
    >
      <ThemePicker />
      <Stack sx={{ mb: 1 }}>
        <Typography variant="h3" component="h1">
          Notion Widgets
        </Typography>
      </Stack>
      <Box sx={{ mb: 4 }}>
        <Box
          component="ol"
          sx={{
            listStyle: 'none',
            counterReset: 'step',
            p: 0,
            m: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {[
            'Customize a widget in your browser.',
            'Click "Create Widget URL" and copy the link.',
            <>
              In Notion, type{' '}
              <Box
                component="code"
                sx={{
                  fontFamily: 'ui-monospace, monospace',
                  px: 0.75,
                  py: 0.25,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  fontSize: '0.9em',
                }}
              >
                /embed
              </Box>{' '}
              and paste the link.
            </>,
          ].map((step, i) => (
            <Box
              // biome-ignore lint/suspicious/noArrayIndexKey: static list
              key={i}
              component="li"
              sx={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 1.5,
                counterIncrement: 'step',
                '&::before': {
                  content: 'counter(step)',
                  flexShrink: 0,
                  minWidth: 24,
                  height: 24,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  color: 'text.primary',
                },
              }}
            >
              <Typography variant="body1" component="span">
                {step}
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 3 }}
        >
          Shared widgets sync start/pause/reset across everyone viewing the
          embed.
          <br />
          Presets are baked into the URL — to change them, create a new widget.
        </Typography>
      </Box>
      <Stack spacing={1.5}>
        {WIDGETS.map((w) => (
          <Card key={w.slug} variant="outlined">
            <CardActionArea component={RouterLink} to={`/w/${w.slug}`}>
              <Box sx={{ p: 2 }}>
                <Typography fontWeight={700}>{w.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {w.description}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mt: 4, textAlign: 'center' }}
      >
        <Link
          href="https://github.com/TravisBumgarner/notion-widgets"
          target="_blank"
          rel="noopener noreferrer"
          color="inherit"
        >
          Source on GitHub
        </Link>
      </Typography>
    </Box>
  );
};

export default IndexPage;
