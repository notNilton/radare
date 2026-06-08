# TODO

## Backend

- [ ] MQTT ingestion pipeline — consume live tag readings from broker
- [ ] InfluxDB writer — persist reconciled time-series results
- [ ] Scheduled reconciliation — run solver automatically on interval
- [ ] Webhook notifications on balance violation
- [ ] Audit log search and filtering API

## Webapp

- [ ] Real-time graph updates via WebSocket
- [ ] Workspace version diff viewer
- [ ] Export reconciliation results to CSV/Excel
- [ ] Mobile-friendly layout

## Database

- [ ] Partition pruning strategy for reconciliation history
- [ ] LogDB retention policy

## Infrastructure

- [ ] Automated backup for production PostgreSQL instances
- [ ] Health endpoints monitored externally
