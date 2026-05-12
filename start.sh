#!/usr/bin/env bash
# ============================================================
#  🚀 Lakehouse Metadata Pipeline - Startup Script
#  Stack: Spark | Airflow | MinIO | Atlas | Hive | Iceberg
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
  echo -e "${CYAN}"
  cat << 'EOF'
  ██╗      █████╗ ██╗  ██╗███████╗██╗  ██╗ ██████╗ ██╗   ██╗███████╗███████╗
  ██║     ██╔══██╗██║ ██╔╝██╔════╝██║  ██║██╔═══██╗██║   ██║██╔════╝██╔════╝
  ██║     ███████║█████╔╝ █████╗  ███████║██║   ██║██║   ██║███████╗█████╗  
  ██║     ██╔══██║██╔═██╗ ██╔══╝  ██╔══██║██║   ██║██║   ██║╚════██║██╔══╝  
  ███████╗██║  ██║██║  ██╗███████╗██║  ██║╚██████╔╝╚██████╔╝███████║███████╗
  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
                    🏠 Data Lakehouse - Metadata Pipeline
EOF
  echo -e "${NC}"
}

check_docker() {
  echo -e "${BLUE}[1/5]${NC} Checking Docker..."
  if ! command -v docker &>/dev/null; then
    echo -e "${RED}❌ Docker not found! Install Docker Desktop first.${NC}"
    exit 1
  fi
  if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose not found!${NC}"
    exit 1
  fi
  echo -e "${GREEN}✅ Docker OK${NC}"
}

check_resources() {
  echo -e "${BLUE}[2/5]${NC} Checking system resources..."
  # Recommend >= 8GB RAM for this stack
  echo -e "${YELLOW}⚠️  Stack membutuhkan minimal 8GB RAM dan 10GB disk space${NC}"
  echo -e "${GREEN}✅ Resource check done${NC}"
}

create_dirs() {
  echo -e "${BLUE}[3/5]${NC} Creating required directories..."
  mkdir -p scripts/dags jars conf atlas-conf
  echo -e "${GREEN}✅ Directories ready${NC}"
}

pull_images() {
  echo -e "${BLUE}[4/5]${NC} Pulling Docker images (this may take 5-15 minutes)..."
  docker compose pull 2>&1 | grep -E "Pulling|Pull|complete|error" || true
  echo -e "${GREEN}✅ Images pulled${NC}"
}

start_stack() {
  echo -e "${BLUE}[5/5]${NC} Starting Lakehouse stack..."
  
  # Start infrastructure first
  echo -e "  🔧 Starting infrastructure (Postgres, ZooKeeper, Kafka)..."
  docker compose up -d postgres zookeeper kafka
  sleep 15

  echo -e "  🧱 Starting HBase + Solr (Atlas backends)..."
  docker compose up -d hbase solr
  sleep 45

  # Start storage
  echo -e "  📦 Starting MinIO storage..."
  docker compose up -d minio
  sleep 10
  docker compose up -d minio-init

  # Start metastore
  echo -e "  🗃️  Starting Hive Metastore..."
  docker compose up -d hive-metastore
  sleep 20

  # Start compute
  echo -e "  ⚡ Starting Spark cluster..."
  docker compose up -d spark-master spark-worker-1 spark-worker-2
  sleep 10

  # Start catalog
  echo -e "  🗂️  Starting Apache Atlas (depends on Kafka + HBase + Solr; warm-up several minutes)..."
  docker compose up -d atlas

  # Start orchestration
  echo -e "  🌀 Starting Airflow..."
  docker compose up -d airflow-init
  sleep 20
  docker compose up -d airflow-webserver airflow-scheduler

  echo ""
  echo -e "${GREEN}${BOLD}🎉 Lakehouse stack started!${NC}"
}

print_ui_info() {
  echo ""
  echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}  📊 SERVICE UI ACCESS POINTS${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${YELLOW}⚡ Apache Spark Master UI${NC}"
  echo -e "     URL  : ${GREEN}http://localhost:8080${NC}"
  echo ""
  echo -e "  ${YELLOW}🌀 Apache Airflow${NC}"
  echo -e "     URL  : ${GREEN}http://localhost:8081${NC}"
  echo -e "     Login: ${BOLD}airflow / airflow${NC}"
  echo ""
  echo -e "  ${YELLOW}📦 MinIO Console (S3)${NC}"
  echo -e "     URL  : ${GREEN}http://localhost:9001${NC}"
  echo -e "     Login: ${BOLD}minioadmin / minioadmin123${NC}"
  echo -e "     Buckets: bronze, silver, gold, warehouse"
  echo ""
  echo -e "  ${YELLOW}🧱 Apache HBase${NC} (Atlas JanusGraph)"
  echo -e "     Master UI: ${GREEN}http://localhost:16010${NC}"
  echo ""
  echo -e "  ${YELLOW}🔎 Apache Solr${NC} (indeks pencarian Atlas)"
  echo -e "     Admin: ${GREEN}http://localhost:8984/solr/${NC}"
  echo ""
  echo -e "  ${YELLOW}🗂️  Apache Atlas (Data Catalog)${NC}"
  echo -e "     URL  : ${GREEN}http://localhost:21000${NC}"
  echo -e "     Login: ${BOLD}admin / admin${NC}"
  echo -e "     ${RED}⚠️  Atlas butuh beberapa menit (HBase + Solr + inisialisasi graph)${NC}"
  echo ""
  echo -e "  ${YELLOW}🗃️  Hive Metastore${NC}"
  echo -e "     Thrift: ${GREEN}thrift://localhost:9083${NC}"
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo ""
  echo -e "  ${BOLD}Useful Commands:${NC}"
  echo -e "  ${BLUE}docker compose logs -f atlas${NC}         # Atlas logs"
  echo -e "  ${BLUE}docker compose logs -f airflow-webserver${NC} # Airflow logs"
  echo -e "  ${BLUE}docker compose ps${NC}                    # Status semua service"
  echo -e "  ${BLUE}docker compose down${NC}                  # Stop semua"
  echo -e "  ${BLUE}docker compose down -v${NC}               # Stop + hapus volumes"
  echo ""
}

# ─── MAIN ─────────────────────────────────────────────────────────────────────
print_banner
check_docker
check_resources
create_dirs
pull_images
start_stack
print_ui_info
