import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { type ThemeMode, useThemeMode } from '@/lib/themeMode';

const ThemePicker = () => {
  const { preference, setPreference } = useThemeMode();

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={preference}
      onChange={(_, next: ThemeMode | null) => {
        if (next) setPreference(next);
      }}
      aria-label="theme mode"
      sx={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 10,
        backgroundColor: 'background.paper',
        boxShadow: 2,
      }}
    >
      <ToggleButton value="light">Light</ToggleButton>
      <ToggleButton value="system">System</ToggleButton>
      <ToggleButton value="dark">Dark</ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ThemePicker;
