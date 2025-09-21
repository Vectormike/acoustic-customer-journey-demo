#!/bin/bash

# Kafka Docker management script

case "$1" in
  start)
    echo "🚀 Starting Kafka and Zookeeper containers..."
    docker-compose up -d
    echo "⏳ Waiting for Kafka to be ready..."
    sleep 10
    echo "✅ Kafka is ready! You can access:"
    echo "   - Kafka broker: localhost:9092"
    echo "   - Kafka UI: http://localhost:8080"
    echo "   - Zookeeper: localhost:2181"
    ;;
  stop)
    echo "🛑 Stopping Kafka and Zookeeper containers..."
    docker-compose down
    echo "✅ Containers stopped"
    ;;
  restart)
    echo "🔄 Restarting Kafka and Zookeeper containers..."
    docker-compose restart
    echo "✅ Containers restarted"
    ;;
  logs)
    echo "📋 Showing Kafka logs..."
    docker-compose logs -f kafka
    ;;
  status)
    echo "📊 Container status:"
    docker-compose ps
    ;;
  cleanup)
    echo "🧹 Cleaning up containers and volumes..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Cleanup complete"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|logs|status|cleanup}"
    echo ""
    echo "Commands:"
    echo "  start   - Start Kafka and Zookeeper containers"
    echo "  stop    - Stop the containers"
    echo "  restart - Restart the containers"
    echo "  logs    - Show Kafka logs"
    echo "  status  - Show container status"
    echo "  cleanup - Remove containers and volumes"
    exit 1
    ;;
esac
