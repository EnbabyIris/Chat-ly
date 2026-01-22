#!/bin/bash

# Chat-Turbo Deployment Script
# Supports multiple environments and deployment strategies

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="chat-turbo"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    log_success "Dependencies check passed"
}

validate_environment() {
    local env="$1"

    if [[ ! -f ".env.${env}" ]]; then
        log_error "Environment file .env.${env} not found"
        exit 1
    fi

    log_info "Validating environment configuration..."
    # Add more validation logic here
}

backup_database() {
    log_info "Creating database backup..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_${timestamp}.sql"

    docker exec chat-turbo-postgres pg_dump -U postgres chat_turbo > "backups/${backup_file}"

    if [[ $? -eq 0 ]]; then
        log_success "Database backup created: backups/${backup_file}"
    else
        log_error "Database backup failed"
        exit 1
    fi
}

deploy_to_environment() {
    local env="$1"
    local skip_backup="${2:-false}"

    log_info "Starting deployment to ${env} environment..."

    # Create backups directory if it doesn't exist
    mkdir -p backups

    # Backup database (skip for development)
    if [[ "${env}" != "development" && "${skip_backup}" != "true" ]]; then
        backup_database
    fi

    # Validate environment
    validate_environment "${env}"

    # Copy environment file
    cp ".env.${env}" ".env"

    # Pull latest images
    log_info "Pulling latest Docker images..."
    docker-compose pull

    # Run database migrations
    log_info "Running database migrations..."
    docker-compose --profile migrate up --abort-on-container-exit

    # Deploy services
    log_info "Deploying services..."
    docker-compose up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose ps | grep -q "healthy"; then
            break
        fi

        log_info "Waiting for services to be healthy... (attempt ${attempt}/${max_attempts})"
        sleep 10
        ((attempt++))
    done

    if [[ $attempt -gt $max_attempts ]]; then
        log_error "Services failed to become healthy within timeout"
        docker-compose logs
        exit 1
    fi

    # Run health checks
    log_info "Running health checks..."
    if curl -f http://localhost:8000/health &>/dev/null; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        exit 1
    fi

    if curl -f http://localhost:3000/api/health &>/dev/null; then
        log_success "Web health check passed"
    else
        log_error "Web health check failed"
        exit 1
    fi

    log_success "Deployment to ${env} completed successfully!"
}

rollback_deployment() {
    log_warning "Rolling back deployment..."

    # Stop current deployment
    docker-compose down

    # Find latest backup
    local latest_backup=$(ls -t backups/backup_*.sql 2>/dev/null | head -1)

    if [[ -n "${latest_backup}" ]]; then
        log_info "Restoring from backup: ${latest_backup}"

        # Start database only
        docker-compose up -d postgres

        # Wait for database to be ready
        sleep 10

        # Restore backup
        docker exec -i chat-turbo-postgres psql -U postgres chat_turbo < "${latest_backup}"

        # Restart all services
        docker-compose up -d
    else
        log_error "No backup found for rollback"
        exit 1
    fi

    log_success "Rollback completed"
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."

    # Remove unused images
    docker image prune -f

    # Remove unused volumes
    docker volume prune -f

    log_success "Cleanup completed"
}

show_usage() {
    cat << EOF
Chat-Turbo Deployment Script

USAGE:
    $0 [OPTIONS] <environment>

ENVIRONMENTS:
    development     Deploy to development environment
    staging         Deploy to staging environment
    production      Deploy to production environment

OPTIONS:
    -b, --skip-backup   Skip database backup (not recommended for production)
    -r, --rollback      Rollback to previous deployment
    -c, --cleanup       Cleanup old Docker images and volumes
    -h, --help          Show this help message

EXAMPLES:
    $0 development
    $0 --skip-backup staging
    $0 --rollback production
    $0 --cleanup

ENVIRONMENT FILES:
    .env.development   Development environment variables
    .env.staging       Staging environment variables
    .env.production    Production environment variables

EOF
}

# Main script
main() {
    local skip_backup=false
    local rollback=false
    local cleanup=false

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--skip-backup)
                skip_backup=true
                shift
                ;;
            -r|--rollback)
                rollback=true
                shift
                ;;
            -c|--cleanup)
                cleanup=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                if [[ -z "${ENVIRONMENT:-}" ]]; then
                    ENVIRONMENT="$1"
                else
                    log_error "Unknown option: $1"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Handle cleanup option
    if [[ "${cleanup}" == "true" ]]; then
        cleanup_old_images
        exit 0
    fi

    # Handle rollback option
    if [[ "${rollback}" == "true" ]]; then
        if [[ -z "${ENVIRONMENT:-}" ]]; then
            ENVIRONMENT="production"
        fi
        rollback_deployment
        exit 0
    fi

    # Validate environment argument
    if [[ -z "${ENVIRONMENT:-}" ]]; then
        log_error "Environment not specified"
        show_usage
        exit 1
    fi

    # Validate environment
    case "${ENVIRONMENT}" in
        development|staging|production)
            ;;
        *)
            log_error "Invalid environment: ${ENVIRONMENT}"
            show_usage
            exit 1
            ;;
    esac

    # Run deployment
    check_dependencies
    deploy_to_environment "${ENVIRONMENT}" "${skip_backup}"
}

# Run main function
main "$@"