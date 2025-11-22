# Monitoring with Grafana and Prometheus

This guide covers how to use and configure the monitoring stack for the Portfolio Manager application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Accessing Grafana](#accessing-grafana)
3. [Understanding Provisioned Datasources](#understanding-provisioned-datasources)
4. [Adding Datasources Manually (UI)](#adding-datasources-manually-ui)
5. [Example: Adding Authentik Metrics](#example-adding-authentik-metrics)
6. [Example: Adding Custom Backend Services](#example-adding-custom-backend-services)
7. [Dashboard Management](#dashboard-management)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Starting the Monitoring Stack

```bash
# Start Prometheus and Grafana
make monitoring-start

# Stop monitoring services
make monitoring-stop

# Rebuild and restart monitoring (after config changes)
make monitoring-update
```

### Service URLs

- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090

---

## Accessing Grafana

### Login Credentials

- **URL**: http://localhost:3001
- **Username**: `admin`
- **Password**: `admin` (or value from `.env` file: `GRAFANA_PASSWORD`)

**Security Note**: Change the default password after first login in production environments.

### Pre-configured Dashboards

After logging in, navigate to **Dashboards** → **Browse** to see:

- **Backend Dashboard** - Backend API performance metrics (request rates, latencies, errors)
- **System Overview** - Overall system health across all services

---

## Understanding Provisioned Datasources

### What is Datasource Provisioning?

The Prometheus datasource is **automatically configured** when Grafana starts. This is done via:

```
monitoring/grafana/provisioning/datasources/prometheus.yml
```

**Key Settings:**
- **Name**: Prometheus
- **UID**: `prometheus` (used by dashboards)
- **URL**: `http://prometheus:9090` (internal Docker network)
- **Default**: Yes (used by default for all dashboards)
- **Editable**: Yes (can be modified via UI)

### Viewing Provisioned Datasources

1. Go to **Connections** → **Data sources**
2. You'll see "Prometheus" with a green checkmark (if connected)
3. Click on it to view/edit configuration

**Note**: Changes via UI will be saved in Grafana's database, but changes to the provisioning file require a restart.

---

## Adding Datasources Manually (UI)

Follow these steps to add additional datasources through the Grafana UI.

### Step 1: Navigate to Datasources

1. Log in to Grafana (http://localhost:3001)
2. Click on **Connections** in the left sidebar
3. Click **Data sources**
4. Click **Add new data source**

### Step 2: Select Datasource Type

Choose the appropriate type:
- **Prometheus** - For services exposing Prometheus metrics
- **InfluxDB** - For InfluxDB time-series data
- **Loki** - For log aggregation
- **Others** - Browse available datasource types

### Step 3: Configure the Datasource

#### Basic Settings

- **Name**: A descriptive name (e.g., "Authentik", "Auth Service", "Custom Backend")
- **Default**: Toggle on if you want this as the default datasource
- **URL**: The HTTP endpoint where the service exposes metrics

#### URL Format

For services running in Docker:
```
http://<container-name>:<port>
```

For services on the host:
```
http://host.docker.internal:<port>
```

For external services:
```
http://<hostname-or-ip>:<port>
```

#### Authentication (if required)

- **Basic Auth**: Enable and provide username/password
- **TLS Client Auth**: For services requiring client certificates
- **Custom Headers**: For API tokens or custom authentication

### Step 4: Test and Save

1. Scroll down and click **Save & test**
2. Grafana will attempt to connect to the datasource
3. If successful: "Data source is working" (green)
4. If failed: Review error message and check:
   - Is the service running?
   - Is the URL correct?
   - Are authentication credentials valid?
   - Is the service accessible from the Grafana container?

---

## Example: Adding Authentik Metrics

Authentik exposes Prometheus metrics on port 9300 (internal).

### Prerequisites

1. Authentik must be running
2. Check if metrics port is exposed in `docker-compose.yml`:
   ```yaml
   authentik-server:
     ports:
       - "9300:9300"  # Add this if not present
   ```

### Configuration Steps

1. **Go to**: Connections → Data sources → Add new data source
2. **Select**: Prometheus
3. **Configure**:
   - **Name**: `Authentik`
   - **URL**: `http://portfolio-authentik-server:9300`
   - **Access**: Server (default)
4. **Scroll to Custom HTTP Headers** (if Authentik requires authentication):
   - Header: `Authorization`
   - Value: `Bearer <your-token>` (if required)
5. **Save & test**

### Creating an Authentik Dashboard

After adding the datasource:

1. Go to **Dashboards** → **New** → **New Dashboard**
2. Add a panel
3. Select **Authentik** as the datasource
4. Write PromQL queries like:
   ```promql
   # Example Authentik metrics (check Authentik docs for actual metric names)
   authentik_admin_workers
   authentik_events_total
   rate(authentik_http_requests_total[5m])
   ```

### Finding Available Metrics

To see what metrics Authentik exposes:

1. Open Prometheus: http://localhost:9090
2. Go to **Status** → **Targets**
3. Add Authentik as a scrape target in `monitoring/prometheus/prometheus.yml`:
   ```yaml
   scrape_configs:
     - job_name: 'authentik'
       static_configs:
         - targets: ['portfolio-authentik-server:9300']
       # Add authentication if required:
       # basic_auth:
       #   username: 'admin'
       #   password: 'your-password'
   ```
4. Restart Prometheus: `make monitoring-update`
5. In Prometheus UI, go to **Graph** and start typing to see autocomplete suggestions

---

## Example: Adding Custom Backend Services

If you have additional backend services exposing metrics:

### 1. Ensure Backend Exposes Metrics

Your service should expose a `/metrics` endpoint in Prometheus format:

```
http://your-service:port/metrics
```

### 2. Add to Prometheus Scrape Config

Edit `monitoring/prometheus/prometheus.yml`:

```yaml
scrape_configs:
  # Existing jobs...

  - job_name: 'my-custom-service'
    static_configs:
      - targets: ['my-service-container:8080']
    metrics_path: '/metrics'
    scrape_interval: 15s
    # Add authentication if required:
    basic_auth:
      username: 'metrics_user'
      password: 'metrics_password'
```

### 3. Restart Prometheus

```bash
make monitoring-update
```

### 4. Verify in Prometheus

1. Go to http://localhost:9090
2. Navigate to **Status** → **Targets**
3. Check if your new job shows as "UP" (green)

### 5. Add to Grafana (Optional)

You can use the existing Prometheus datasource to query these metrics, or create a separate datasource pointing to the same Prometheus with query filters:

**In dashboards**, use the `job` label:
```promql
rate(http_requests_total{job="my-custom-service"}[5m])
```

---

## Dashboard Management

### Importing Dashboards

1. Go to **Dashboards** → **New** → **Import**
2. **Option A**: Upload a JSON file
   - Click **Upload JSON file**
   - Select your `.json` dashboard file
3. **Option B**: Import from Grafana.com
   - Enter dashboard ID (e.g., 1860 for Node Exporter)
   - Click **Load**
4. Select the datasource to use
5. Click **Import**

### Exporting Dashboards

1. Open the dashboard you want to export
2. Click the **Share** icon (top right)
3. Go to **Export** tab
4. Click **Save to file**
5. The dashboard will download as a `.json` file

### Creating Dashboards from Scratch

1. Go to **Dashboards** → **New** → **New Dashboard**
2. Click **Add visualization**
3. Select your datasource
4. Write your query (PromQL for Prometheus)
5. Configure visualization type (Graph, Stat, Table, etc.)
6. Save the dashboard

### Dashboard Provisioning (Automatic)

To automatically load dashboards on Grafana startup:

1. Place dashboard JSON files in: `monitoring/grafana/dashboards/`
2. Restart Grafana: `make monitoring-update`
3. Dashboards will appear in the **Dashboards** section

**Note**: The dashboard provisioning is configured in:
```
monitoring/grafana/provisioning/dashboards/dashboards.yml
```

---

## Troubleshooting

### Datasource Connection Issues

#### Error: "Connection refused"

**Possible causes:**
- Service is not running
- Wrong container name or port
- Service doesn't expose metrics endpoint

**Solutions:**
```bash
# Check if service is running
docker ps | grep <service-name>

# Check service logs
docker logs <container-name>

# Test metrics endpoint from another container
docker exec portfolio-grafana curl http://<service>:<port>/metrics
```

#### Error: "Unauthorized" or "403 Forbidden"

**Solution**: Add authentication to datasource configuration:
- Enable **Basic Auth** in datasource settings
- Or add **Custom HTTP Headers** with API token

#### Datasource shows as "Not connected"

1. Click on the datasource
2. Scroll to bottom and click **Save & test**
3. Check error message for specific issue
4. Verify URL is correct (use container name, not localhost)

### Dashboard Shows "No data"

**Check #1: Is Prometheus scraping the target?**

1. Go to Prometheus: http://localhost:9090
2. Navigate to **Status** → **Targets**
3. Find your service's job
4. Status should be "UP" (green)
5. If "DOWN" (red), click **show more** for error details

**Check #2: Do metrics exist?**

1. In Prometheus UI, go to **Graph**
2. Try querying the metric name used in your dashboard
3. If no results, the metric doesn't exist or has different name

**Check #3: Is time range correct?**

- Top-right corner of Grafana has time range selector
- Try "Last 5 minutes" or "Last 15 minutes"
- Ensure your service has generated metrics in that timeframe

**Check #4: Is the correct datasource selected?**

- In dashboard panel, click title → **Edit**
- Check datasource dropdown at top
- Ensure correct datasource is selected

### Backend Metrics Not Showing

If backend metrics aren't appearing in Grafana:

**Step 1: Verify backend exposes metrics**

```bash
# From host machine (if backend port is exposed):
curl http://localhost:8000/metrics

# From inside Grafana container:
docker exec portfolio-grafana curl http://portfolio-backend:8000/metrics
```

**Expected output**: Prometheus text format metrics

**Step 2: Check Prometheus is scraping**

```bash
# Check Prometheus config
cat monitoring/prometheus/prometheus.yml

# Look for backend-service job
```

**Step 3: Verify authentication**

If backend requires authentication:
```yaml
# In prometheus.yml
- job_name: 'backend-service'
  static_configs:
    - targets: ['portfolio-backend:8000']
  basic_auth:
    username: 'admin'
    password: 'your-password'
```

**Step 4: Check for compression issues**

The `/metrics` endpoint must return **plain text**, not gzipped content. Ensure compression middleware skips the metrics endpoint.

### Grafana Won't Start

**Error: "Datasource provisioning error: data source not found"**

This was a known issue in Grafana 12.x. Current setup uses Grafana 11.3.0 to avoid this bug.

**Solution**: Ensure `docker-compose.yml` specifies:
```yaml
grafana:
  image: grafana/grafana:11.3.0  # Not 'latest'
```

**Error: Permission denied (Podman/SELinux)**

**Solution**: Ensure volume mounts have `:Z` label:
```yaml
volumes:
  - ./monitoring/grafana/provisioning:/etc/grafana/provisioning:ro,Z
  - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro,Z
```

---

## Advanced Configuration

### Setting Up Alerts

1. In Grafana, go to **Alerting** → **Alert rules**
2. Click **New alert rule**
3. Configure:
   - Query: Select datasource and write PromQL
   - Threshold: Set condition (e.g., `> 100`)
   - Evaluation: How often to check
4. Add notification channels:
   - Go to **Alerting** → **Contact points**
   - Add email, Slack, webhook, etc.

### Custom Variables in Dashboards

Variables make dashboards dynamic:

1. Edit dashboard
2. Go to **Settings** (gear icon) → **Variables**
3. Click **Add variable**
4. Configure:
   - **Name**: `service`
   - **Type**: Query
   - **Query**: `label_values(job)`
5. Use in queries: `{job="$service"}`

### Setting Up External Prometheus

If you have Prometheus running outside Docker:

1. Add datasource with URL: `http://host.docker.internal:9090`
2. Or use external IP: `http://192.168.1.100:9090`

---

## Additional Resources

- **Prometheus Documentation**: https://prometheus.io/docs/
- **Grafana Documentation**: https://grafana.com/docs/
- **PromQL Guide**: https://prometheus.io/docs/prometheus/latest/querying/basics/
- **Grafana Dashboard Gallery**: https://grafana.com/grafana/dashboards/

---

## Summary

This monitoring stack provides:
- ✅ Automatic Prometheus datasource provisioning
- ✅ Pre-built dashboards for backend and system metrics
- ✅ Easy manual datasource addition via UI
- ✅ Flexible configuration for any metrics-exposing service

For adding new services:
1. Ensure service exposes Prometheus metrics
2. Add to Prometheus scrape config (optional but recommended)
3. Add as datasource in Grafana UI (if needed)
4. Create or import dashboards to visualize metrics
