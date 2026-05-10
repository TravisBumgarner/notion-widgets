import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Link,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import BackButton from '@/components/BackButton';
import ThemePicker from '@/components/ThemePicker';
import { useUrlParams } from '@/lib/useUrlParams';
import ShareDialog from '@/widgets/lean-coffee/ShareDialog';
import { leanCoffeeSchema } from '@/widgets/lean-coffee/schema';
import {
  type TimerState,
  useTimerRoom,
} from '@/widgets/lean-coffee/useTimerRoom';

const formatDurationLabel = (seconds: number): string => {
  if (seconds % 60 === 0) return `${seconds / 60}m`;
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const formatClock = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const computeRemainingSeconds = (s: TimerState, now: number): number => {
  const totalMs = s.selectedSeconds * 1000;
  if (s.runState === 'stopped') return s.selectedSeconds;
  if (s.runState === 'paused') {
    return Math.max(0, Math.ceil((totalMs - s.elapsedBeforePauseMs) / 1000));
  }
  if (s.startedAt === null) return s.selectedSeconds;
  const elapsed = s.elapsedBeforePauseMs + (now - s.startedAt);
  return Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
};

const initialState = (selectedSeconds: number): TimerState => ({
  selectedSeconds,
  runState: 'stopped',
  startedAt: null,
  elapsedBeforePauseMs: 0,
});

const LeanCoffee = () => {
  const { result, setParams } = useUrlParams(leanCoffeeSchema);

  if (!result.ok) {
    return (
      <>
        <BackButton />
        <Box
          component="pre"
          sx={{
            p: 3,
            color: 'error.main',
            fontFamily: 'ui-monospace, monospace',
            whiteSpace: 'pre-wrap',
          }}
        >
          {`Invalid URL params:\n${JSON.stringify(result.error.flatten().fieldErrors, null, 2)}`}
        </Box>
      </>
    );
  }

  const { durations, selected: selectedParam, room, readonly } = result.data;
  const selected =
    selectedParam != null && durations.includes(selectedParam)
      ? selectedParam
      : durations[0];

  if (readonly) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <TimerWidget
          durations={durations}
          selected={selected}
          roomId={room}
          showHelpTooltip
        />
      </Box>
    );
  }

  const onSelect = (next: number) => setParams({ selected: next });
  const onAdd = (seconds: number) => {
    if (durations.includes(seconds)) {
      setParams({ selected: seconds });
      return;
    }
    const next = [...durations, seconds].sort((a, b) => b - a);
    setParams({ durations: next.join(','), selected: seconds });
  };
  const onRemove = (seconds: number) => {
    if (durations.length <= 1) return;
    const next = durations.filter((d) => d !== seconds);
    const params: { durations: string; selected?: number } = {
      durations: next.join(','),
    };
    if (seconds === selected) params.selected = next[0];
    setParams(params);
  };

  return (
    <ConfiguratorPage
      durations={durations}
      selected={selected}
      onSelect={onSelect}
      onAdd={onAdd}
      onRemove={onRemove}
    />
  );
};

type ConfiguratorPageProps = {
  durations: number[];
  selected: number;
  onSelect: (next: number) => void;
  onAdd: (seconds: number) => void;
  onRemove: (seconds: number) => void;
};

const ConfiguratorPage = ({
  durations,
  selected,
  onSelect,
  onAdd,
  onRemove,
}: ConfiguratorPageProps) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [newMinutes, setNewMinutes] = useState<string>('');

  const submitNewDuration = (e: FormEvent) => {
    e.preventDefault();
    const minutes = Number(newMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    const seconds = Math.round(minutes * 60);
    onAdd(seconds);
    setNewMinutes('');
  };

  return (
    <Box sx={{ minHeight: '100vh', p: { xs: 2, md: 4 } }}>
      <BackButton />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={4}
        sx={{
          maxWidth: 932,
          mx: 'auto',
          mt: { xs: 2, md: 4 },
          alignItems: 'flex-start',
        }}
      >
        <Stack
          spacing={3}
          sx={{
            width: { xs: '100%', sm: 200 },
            flexShrink: 0,
          }}
        >
          <Typography variant="h4" component="h1">
            Lean Coffee
          </Typography>

          <Box>
            <Typography variant="overline" color="text.secondary">
              Theme
            </Typography>
            <Box sx={{ mt: 1 }}>
              <ThemePicker />
            </Box>
          </Box>

          <Box>
            <Typography variant="overline" color="text.secondary">
              Presets
            </Typography>
            <Box
              component="form"
              onSubmit={submitNewDuration}
              sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <TextField
                size="small"
                type="number"
                value={newMinutes}
                onChange={(e) => setNewMinutes(e.target.value)}
                placeholder="Minutes"
                inputProps={{ min: 0, step: 0.5, 'aria-label': 'minutes' }}
                sx={{
                  width: 110,
                  '& .MuiOutlinedInput-input': {
                    py: '5.5px',
                    fontSize: '0.8125rem',
                  },
                }}
              />
              <Button
                type="submit"
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                disabled={
                  !Number.isFinite(Number(newMinutes)) ||
                  Number(newMinutes) <= 0
                }
              >
                Add
              </Button>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ mt: 2 }}
            >
              {durations.map((d) => (
                <Chip
                  key={d}
                  label={formatDurationLabel(d)}
                  variant="outlined"
                  onDelete={
                    durations.length > 1 ? () => onRemove(d) : undefined
                  }
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <Button
              variant="contained"
              startIcon={<IosShareIcon />}
              onClick={() => setShareOpen(true)}
            >
              Create Widget URL
            </Button>
          </Box>
        </Stack>

        <Stack spacing={1} sx={{ width: '100%', maxWidth: 700, minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary">
            Preview
          </Typography>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              width: '100%',
              height: 300,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TimerWidget
              durations={durations}
              selected={selected}
              onSelectChange={onSelect}
              showHelpTooltip
            />
          </Paper>
        </Stack>
      </Stack>

      <ShareDialog
        open={shareOpen}
        durations={durations}
        selected={selected}
        onClose={() => setShareOpen(false)}
      />
    </Box>
  );
};

type TimerWidgetProps = {
  durations: number[];
  selected: number;
  roomId?: string;
  onSelectChange?: (next: number) => void;
  showHelpTooltip: boolean;
};

const TimerWidget = ({
  durations,
  selected,
  roomId,
  onSelectChange,
  showHelpTooltip,
}: TimerWidgetProps) => {
  const [state, setState] = useState<TimerState>(() => initialState(selected));
  const [now, setNow] = useState<number>(() => Date.now());
  const lastUrlSelected = useRef<number>(selected);

  useEffect(() => {
    if (lastUrlSelected.current === selected) return;
    lastUrlSelected.current = selected;
    setState(initialState(selected));
  }, [selected]);

  useEffect(() => {
    if (state.runState !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.runState]);

  const { send } = useTimerRoom({
    roomId,
    getState: () => state,
    onRemoteState: (incoming) => {
      lastUrlSelected.current = incoming.selectedSeconds;
      setState(incoming);
      setNow(Date.now());
    },
  });

  const update = (next: TimerState) => {
    setState(next);
    setNow(Date.now());
    send(next);
  };

  const handleSelect = (next: number) => {
    if (next === state.selectedSeconds) return;
    update(initialState(next));
    onSelectChange?.(next);
  };

  const handleStartPause = () => {
    if (state.runState === 'running') {
      const elapsed =
        state.elapsedBeforePauseMs +
        (state.startedAt !== null ? Date.now() - state.startedAt : 0);
      update({
        ...state,
        runState: 'paused',
        startedAt: null,
        elapsedBeforePauseMs: elapsed,
      });
      return;
    }
    update({
      ...state,
      runState: 'running',
      startedAt: Date.now(),
    });
  };

  const handleReset = () => {
    update(initialState(state.selectedSeconds));
  };

  const remaining = computeRemainingSeconds(state, now);
  const isFinished = remaining === 0;
  const isRunning = state.runState === 'running';

  return (
    <Stack
      spacing={2}
      alignItems="center"
      sx={{ width: '100%', maxWidth: 640, mx: 'auto' }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography variant="h6" component="h2">
          Lean Coffee
        </Typography>
        {showHelpTooltip && (
          <Tooltip
            placement="top"
            leaveDelay={300}
            title={
              <span>
                To change these durations,{' '}
                <Link
                  href="https://notion.travisbumgarner.dev/w/lean-coffee"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  create a new widget
                </Link>
                .
              </span>
            }
          >
            <InfoOutlinedIcon
              fontSize="small"
              sx={{ color: 'text.secondary', cursor: 'help' }}
            />
          </Tooltip>
        )}
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={4}
        alignItems="center"
        justifyContent="center"
        sx={{ width: '100%' }}
      >
        <Typography
          component="div"
          sx={{
            fontVariantNumeric: 'tabular-nums',
            fontWeight: 900,
            fontSize: { xs: 80, sm: 96 },
            lineHeight: 1,
            color: isFinished ? 'error.main' : 'text.primary',
            flexShrink: 0,
          }}
          aria-live="polite"
        >
          {formatClock(remaining)}
        </Typography>

        <Stack
          spacing={1.5}
          alignItems={{ xs: 'center', sm: 'flex-start' }}
          sx={{ minWidth: 0 }}
        >
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {durations.map((d) => {
              const isSelected = d === state.selectedSeconds;
              return (
                <Chip
                  key={d}
                  label={formatDurationLabel(d)}
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  onClick={() => handleSelect(d)}
                />
              );
            })}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="contained"
              size="small"
              startIcon={isRunning ? <PauseIcon /> : <PlayArrowIcon />}
              onClick={handleStartPause}
              disabled={isFinished && !isRunning}
              sx={{ minWidth: 96 }}
            >
              {isRunning ? 'Pause' : 'Start'}
            </Button>
            <IconButton onClick={handleReset} aria-label="reset" size="small">
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default LeanCoffee;
