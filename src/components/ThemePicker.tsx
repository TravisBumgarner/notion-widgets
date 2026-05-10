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
    >
      <ToggleButton value="system">System</ToggleButton>
      <ToggleButton value="light">Light</ToggleButton>
      <ToggleButton value="dark">Dark</ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ThemePicker;
