export type WidgetMeta = {
  slug: string;
  title: string;
  description: string;
};

export const WIDGETS: WidgetMeta[] = [
  {
    slug: 'lean-coffee',
    title: 'Lean Coffee',
    description:
      'Countdown timer with URL-configurable duration options (in seconds).',
  },
];
