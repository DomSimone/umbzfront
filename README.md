# Umbuzo Docker Container Frontend

A comprehensive web user interface for managing and interacting with the Umbuzo AI assistant running in a Docker container with Ollama.

## 🚀 Features

### Container Management
- **Real-time Container Status**: Monitor container health and status
- **Start/Stop/Restart**: Full container lifecycle management
- **Health Checks**: Automated health monitoring with alerts
- **Resource Monitoring**: CPU, Memory, and GPU usage tracking

### AI Assistant Interface
- **Multi-mode Chat**: Factual, Reasoning, Creative, and Auto modes
- **Quick Actions**: Pre-configured prompts for common tasks
- **Conversation History**: Persistent chat history with recall
- **File Attachments**: Support for file uploads and analysis

### Advanced Monitoring
- **Performance Metrics**: Real-time resource usage visualization
- **Container Logs**: Live log streaming with filtering
- **Alert System**: Threshold-based alerts for resource usage
- **Export Capabilities**: Metrics and logs export functionality

### User Experience
- **Dark Theme**: Professional dark interface design
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Live status indicators and metrics
- **Error Handling**: Comprehensive error messages and recovery

## 🏗️ Architecture

```
frontend/
├── index.html              # Main chat interface
├── monitor.html            # Container monitoring dashboard
├── apps.html              # Application and tool integrations
├── styles.css             # CSS styling with Docker-specific themes
├── config.js              # Configuration and environment settings
├── app.js                 # Main application logic
├── docker-integration.js  # Docker container management
├── monitor.js             # Monitoring and metrics display
├── extensions.js          # Extension system integration
└── extensions-ui.js       # Extension UI components
```

## 🎨 Interface Overview

### Main Chat Interface (`index.html`)
- **Container Status Bar**: Real-time Docker container status
- **Sidebar Controls**: Container management and quick actions
- **Chat Area**: Interactive conversation with Umbuzo AI
- **Input Controls**: Model selection and message input

### Container Monitor (`monitor.html`)
- **Performance Dashboard**: CPU, Memory, GPU usage cards
- **Resource Charts**: Historical data visualization (placeholder)
- **System Status**: Container and API status indicators
- **Log Viewer**: Real-time container log streaming

## 📊 Monitoring Features

### Real-time Metrics
- **CPU Usage**: Container CPU utilization percentage
- **Memory Usage**: RAM consumption tracking
- **GPU Usage**: GPU utilization (if available)
- **Response Time**: API response time monitoring

### Alert System
- **Threshold Alerts**: Configurable resource usage thresholds
- **Status Indicators**: Visual indicators for system health
- **Error Notifications**: Real-time error reporting

### Log Management
- **Live Streaming**: Real-time log updates
- **Filtering**: Filter logs by type (info, success, warning, error)
- **Export**: Download logs for analysis
- **Clear**: Clear log display

## 🔧 Configuration

### Environment Variables
```javascript
// config.js
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000',  // Umbuzo API endpoint
    API_TIMEOUT: 60000,                     // 60 seconds timeout
    FRONTEND_PORT: 8080,                    // Frontend server port
    DOCKER_CONTAINER_NAME: 'umbuzo-ollama', // Docker container name
    OLLAMA_MODEL: 'umbuzo:latest',          // Ollama model name
    OLLAMA_API_URL: 'http://localhost:11434' // Ollama API endpoint
};
```

### Docker Integration
The frontend integrates with Docker through:
- **Container Management API**: Start, stop, restart containers
- **Metrics Collection**: Resource usage monitoring
- **Health Checks**: Container and model health verification
- **Log Streaming**: Real-time container log access

## 🚀 Quick Start

B:\Native\cuda_env\Scripts\activate.bat

### 1. Start the Docker Container
```bash
# Start the Umbuzo container
docker-compose up -d

# Or using Docker directly
docker run -d --name umbuzo-ollama -p 11434:11434 umbuzo:latest
```

### 2. Start the Frontend Server
```bash
# Navigate to frontend directory
cd frontend

# Start development server
python -m http.server 8080

# Or use any static file server
npm install -g serve
serve -s . -l 8080
```

### 3. Access the Interface
Open your browser and navigate to:
- **Main Interface**: http://localhost:8080
- **Monitor Dashboard**: http://localhost:8080/monitor.html

## 🎯 Usage Guide

### Container Management
1. **View Status**: Check container status in the top navigation
2. **Start Container**: Click "Start Container" if stopped
3. **Monitor Resources**: View real-time CPU, Memory, GPU usage
4. **Health Checks**: Perform manual health checks as needed

### Chat Interface
1. **Select Mode**: Choose from Factual, Reasoning, Creative, or Auto
2. **Ask Questions**: Type your query in the input field
3. **Quick Actions**: Use pre-configured buttons for common tasks
4. **View History**: Access previous conversations from the sidebar

### Monitoring Dashboard
1. **Performance Overview**: View current resource usage
2. **Historical Data**: Monitor trends over time (future feature)
3. **Log Analysis**: Filter and analyze container logs
4. **Export Data**: Download metrics for external analysis

## 🔌 API Integration

### Docker API Endpoints
The frontend communicates with Docker through these endpoints:

```javascript
// Container management
POST /api/docker/execute
{
    "action": "start|stop|restart",
    "container": "umbuzo-ollama"
}

// Metrics collection
POST /api/docker/stats
{
    "container": "umbuzo-ollama"
}

// Log retrieval
POST /api/docker/logs
{
    "container": "umbuzo-ollama",
    "lines": 100
}

// Health checks
GET /api/docker/ping
```

### Umbuzo API Integration
```javascript
// Chat API
POST /api/chat
{
    "conversation": [...],
    "mode": "auto|factual|reasoning|creative",
    "country": "optional-country"
}

// Model information
GET /api/metadata
```

## 🎨 Customization

### Theme Customization
Modify `styles.css` to customize the appearance:
```css
:root {
    --bg-primary: #000000;      /* Main background */
    --bg-secondary: #1A1A1A;    /* Secondary background */
    --text-primary: #FFFFFF;    /* Primary text */
    --text-secondary: #CCCCCC;  /* Secondary text */
    --accent: #FFFFFF;          /* Accent color */
}
```

### Adding New Features
1. **New Container Actions**: Add buttons in `index.html` and handlers in `docker-integration.js`
2. **New Metrics**: Extend the metrics collection in `monitor.js`
3. **New Quick Actions**: Add buttons and handlers in `index.html` and `app.js`

## 🐛 Troubleshooting

### Common Issues

**Container Not Starting**
```bash
# Check Docker daemon
docker info

# Check container logs
docker logs umbuzo-ollama

# Verify port availability
netstat -an | grep 11434
```

**Frontend Not Loading**
```bash
# Check browser console for errors
# Verify static file server is running
# Check network connectivity to API endpoints
```

**API Connection Issues**
```bash
# Test API connectivity
curl http://localhost:8000/health

# Check CORS settings in backend
# Verify API endpoint configuration
```

### Debug Mode
Enable debug logging in `config.js`:
```javascript
const CONFIG = {
    ENABLE_DEBUG_LOGGING: true,
    // ... other config
};
```

## 🔮 Future Enhancements

### Planned Features
- **Interactive Charts**: Real-time data visualization using Chart.js
- **Alert Notifications**: Browser notifications for critical events
- **Container Configuration**: Advanced container settings UI
- **Multi-container Support**: Manage multiple AI containers
- **Performance Analytics**: Detailed performance analysis and recommendations

### Integration Ideas
- **Prometheus/Grafana**: Professional monitoring integration
- **Kubernetes Support**: Container orchestration management
- **CI/CD Integration**: Automated deployment and monitoring
- **Multi-user Support**: User authentication and personalized settings

## 📄 License

This frontend interface is part of the Umbuzo project and follows the same licensing terms.

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request with clear description

## 📞 Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation
- Submit issues on the project repository
- Join our community discussions

---

**Note**: This frontend is designed specifically for the Umbuzo Docker container setup with Ollama integration. Ensure your Docker environment is properly configured before use.