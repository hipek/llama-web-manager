# systemd User Service — llama-web-manager

Auto-start the server on login via systemd user service.

## Install

```bash
# Copy service file to user systemd directory
mkdir -p ~/.config/systemd/user
cp systemd/llama-web-manager.service ~/.config/systemd/user/

# Reload systemd, enable and start
systemctl --user daemon-reload
systemctl --user enable --now llama-web-manager.service
```

## Uninstall

```bash
# Stop and disable
systemctl --user stop llama-web-manager.service
systemctl --user disable llama-web-manager.service

# Remove the service file
rm ~/.config/systemd/user/llama-web-manager.service

# Reload systemd
systemctl --user daemon-reload
```

## Manage

```bash
# Status
systemctl --user status llama-web-manager

# Start/stop
systemctl --user start llama-web-manager
systemctl --user stop llama-web-manager

# Logs
journalctl --user -u llama-web-manager -f
```

## Notes

- Starts on desktop login (user-level, no root needed)
- Auto-restarts on crash (`Restart=on-failure`)
- Logs to `journalctl --user`
