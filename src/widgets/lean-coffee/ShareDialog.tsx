import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  open: boolean;
  durations: number[];
  selected: number;
  onClose: () => void;
};

const buildEmbedUrl = (
  durations: number[],
  selected: number,
  roomId: string,
): string => {
  const params = new URLSearchParams();
  params.set('durations', durations.join(','));
  params.set('selected', String(selected));
  params.set('room', roomId);
  params.set('readonly', 'true');
  const path = `${window.location.origin}/w/lean-coffee`;
  return `${path}?${params.toString()}`;
};

const ShareDialog = ({ open, durations, selected, onClose }: Props) => {
  const [roomId, setRoomId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRoomId(crypto.randomUUID());
    setCopied(false);
  }, [open]);

  const url = useMemo(
    () => (roomId ? buildEmbedUrl(durations, selected, roomId) : ''),
    [durations, selected, roomId],
  );

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Widget URL</DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={1} alignItems="stretch" sx={{ mb: 2 }}>
          <TextField
            fullWidth
            value={url}
            inputProps={{ readOnly: true, 'aria-label': 'widget url' }}
            size="small"
            onFocus={(e) => e.target.select()}
          />
          <Tooltip title={copied ? 'Copied' : 'Copy'} placement="top">
            <Box>
              <IconButton onClick={handleCopy} aria-label="copy url">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
        </Stack>

        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ display: 'block' }}
        >
          How to use it
        </Typography>
        <List dense disablePadding sx={{ listStyleType: 'decimal', pl: 3 }}>
          <ListItem sx={{ display: 'list-item', py: 0.25 }} disableGutters>
            <ListItemText
              primary={
                <>
                  In Notion, type <code>/embed</code> and paste the link.
                </>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', py: 0.25 }} disableGutters>
            <ListItemText primary="Everyone viewing the page shares one timer — start, pause, and reset broadcast to all viewers." />
          </ListItem>
          <ListItem sx={{ display: 'list-item', py: 0.25 }} disableGutters>
            <ListItemText primary="Presets are baked into the URL. To change them, generate a new widget." />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
