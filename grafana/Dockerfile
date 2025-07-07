FROM grafana/grafana:latest
COPY provisioning/ /etc/grafana/provisioning/
COPY provisioning/dashboards/ /etc/grafana/provisioning/dashboards
COPY dashboards/ /var/lib/grafana/dashboards
COPY grafana.ini /etc/grafana/grafana.ini