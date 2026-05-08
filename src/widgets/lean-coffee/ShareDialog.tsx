import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
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
        <DialogContentText sx={{ mb: 2 }}>
          Paste this URL into Notion via <code>/embed</code>. Anyone viewing the
          page will share the same timer — start, pause, and reset broadcast to
          everyone in the room. Presets are baked in; to change them, generate a
          new widget.
        </DialogContentText>
        <Stack direction="row" spacing={1} alignItems="stretch">
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareDialog;
