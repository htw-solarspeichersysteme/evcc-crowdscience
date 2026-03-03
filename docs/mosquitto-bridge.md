# Mosquitto Bridge Setup (EVCC Crowdscience)

Forward local EVCC topics to Crowdscience via Mosquitto bridge.

## 1) Bridge config

Create `bridge-evcc.conf`:

```conf
connection evcc-crowdscience
address mqtt-native.evcc-crowdscience.de:8883

# Optional auth (uncomment if required)
# local_username <local-username>


# CA certificate path, tells mosquitto to use tls for the connection
bridge_capath /etc/ssl/certs

# Forward all local EVCC topics to the remote prefix
topic # out 1 evcc/ evcc/<evcc-crowdscience-id>/

keepalive_interval 60
restart_timeout 10 30
start_type automatic
cleansession true
```

## 2) Install into Mosquitto

Linux:

- Put file in `/etc/mosquitto/conf.d/bridge-evcc.conf`
- Restart broker: `sudo systemctl restart mosquitto`

Home Assistant (Mosquitto add-on):

- Place file under `/share/mosquitto/bridge-evcc.conf`
- Include it in add-on config (custom `mosquitto.conf` / include)
- Restart the add-on

## 3) Topic remapping

Mapping line:

`topic # out 0 evcc/ evcc/<evcc-crowdscience-id>/`

- `#`: all subtopics
- `out`: local -> remote only
- `1`: QoS 0
- Prefix rewrite: replace `evcc/` with `evcc/<evcc-crowdscience-id>/`

Example:

- Local: `evcc/site/power`
- Remote: `evcc/<evcc-crowdscience-id>/site/power`
