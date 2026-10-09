# Diesel Performance Intelligence

A simple, dependency-free dashboard to track diesel fuel economy, cost and maintenance.

## Run
Open `index.html` in any browser. No installation or internet needed.

## Files
- `index.html` - page layout
- `style.css`  - styling (light/dark themes)
- `app.js`     - logic: km/L calculation, anomaly detection, chart, maintenance tracker

## Features
- Fuel economy (km/L) per fill-up using the full-tank method
- Cost per km and total fuel cost
- Trend chart with average line
- Anomaly alerts: >8% below rolling 5-fill average = Watch, >15% = Alert
- Maintenance schedule (oil, air filter, fuel filter, DPF/EGR) with Mark done
- Data saved in browser localStorage; sample data included

## Customise
Edit the `MAINT` array in `app.js` to change service intervals, and the thresholds in `analyse()` to tune alerts.
