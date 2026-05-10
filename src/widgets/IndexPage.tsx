import {
  Box,
  Card,
  CardActionArea,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
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
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        sx={{ mb: 4 }}
      >
        <Typography variant="h3" component="h1" sx={{ fontSize: '28px' }}>
          Notion Widgets
        </Typography>
        <Stack direction="row" spacing={2} alignItems="baseline">
          <Link
            href="https://travisbumgarner.dev/"
            target="_blank"
            rel="noopener noreferrer"
            color="text.secondary"
            variant="caption"
          >
            Author
          </Link>
          <Link
            href="https://github.com/TravisBumgarner/notion-widgets"
            target="_blank"
            rel="noopener noreferrer"
            color="text.secondary"
            variant="caption"
          >
            Source on GitHub
          </Link>
        </Stack>
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
    </Box>
  );
};

export default IndexPage;
