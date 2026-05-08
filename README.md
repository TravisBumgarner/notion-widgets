# notion-widgets

Embeddable, URL-driven widgets for Notion pages. Live at <https://notion.travisbumgarner.dev/>.

The flow: configure a widget in your browser, click **Create Widget URL**, paste it into Notion via `/embed`. The URL bakes in your settings and a unique room ID, so everyone viewing the embed shares the same live state over WebSocket — start/pause/reset on one Notion page propagates to all the others.

## Widgets

- **Lean Coffee** — countdown timer with configurable presets (e.g. 8m / 5m / 2m), shared across all viewers.

## Architecture

```
src/         React + Vite + MUI configurator and embed views
server/      Node + Express + ws — serves the built frontend and relays
             WebSocket messages between peers in the same room.
```

The server is dumb: it doesn't know what timers are. Each room is a `Set<WebSocket>` and incoming JSON is forwarded to the other peers. New joiners send `{type: 'request_state'}`; any peer answers with their current state. Timer state is `{selectedSeconds, runState, startedAt, elapsedBeforePauseMs}` — clients compute the displayed countdown locally from absolute timestamps, so no per-tick traffic.

## Development

```sh
npm install
npm run dev:all    # vite on :5300, ws relay on :4848
```

`dev:all` runs both processes via `concurrently`. Override the relay port with `PORT=<n> npm run dev:all` if 4848 is taken.

## Deployment

```sh
npm run deploy     # runs ./deploy.sh
```

Deploys to NearlyFreeSpeech.NET. The site is a fully custom server type — the Node daemon serves both the static frontend (`./dist`) and the `/ws` endpoint. Then HUP the daemon from the NFS panel.

### NFS proxy config

For NFS panel proxies, both at port 4848:

| Protocol | Base URI | Doc Root |
|----------|----------|----------|
| HTTP | `/` | `/` |
| WebSocket | `/ws/` | `/` |

The HTTP proxy at `/` doesn't pass WS Upgrade headers; the WebSocket proxy at the more specific `/ws/` path catches upgrade requests before they fall through. Trailing slashes are required.

The client connects to `wss://host/ws/` (with trailing slash) to match the WebSocket proxy's Base URI exactly.
