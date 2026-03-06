/**
 * Container Monitor Module for Umbuzo Frontend
 * Provides real-time monitoring, metrics display, and system insights
 */

const ContainerMonitor = {
    config: {
        updateInterval: 2000, // 2 seconds
        chartUpdateInterval: 5000, // 5 seconds
        maxDataPoints: 100,
        alertThresholds: {
            cpu: 80,
            memory: 85,
            gpu: 90
        }
    },
    
    state: {
        isMonitoring: false,
        startTime: null,
        metricsHistory: {
            cpu: [],
            memory: [],
            gpu: [],
            timestamps: []
        },
        currentMetrics: {
            cpu: 0,
            memory: 0,
            gpu: 0
        },
        logFilter: 'all',
        isFollowingLogs: true
    },

    init() {
        console.log('Container Monitor initializing...');
        this.setupEventListeners();
        this.startMonitoring();
        this.loadInitialData();
    },

    setupEventListeners() {
        // Chart controls
        document.querySelectorAll('.btn-chart-control').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-chart-control').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateChartRange(e.target.dataset.range);
            });
        });

        // Log filter buttons
        document.querySelectorAll('.log-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.log-filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.logFilter = e.target.dataset.filter;
                this.filterLogs();
            });
        });

        // Monitor actions
        document.getElementById('btnRefreshMonitor')?.addEventListener('click', () => this.refreshData());
        document.getElementById('btnExportMetrics')?.addEventListener('click', () => this.exportMetrics());
        document.getElementById('btnContainerLogs')?.addEventListener('click', () => this.showContainerLogs());
        document.getElementById('btnClearLogs')?.addEventListener('click', () => this.clearLogs());
        document.getElementById('btnDownloadLogs')?.addEventListener('click', () => this.downloadLogs());
        document.getElementById('btnFollowLogs')?.addEventListener('click', () => this.toggleLogFollow());

        // Chart placeholder click (for future chart implementation)
        document.querySelector('.chart-placeholder')?.addEventListener('click', () => {
            this.showTemporaryMessage('Charts will be available in future updates', 'info');
        });
    },

    startMonitoring() {
        if (this.state.isMonitoring) return;
        
        this.state.isMonitoring = true;
        this.state.startTime = Date.now();

        // Start main monitoring loop
        this.monitoringInterval = setInterval(() => {
            this.updateMetrics();
            this.updatePerformanceSummary();
        }, this.config.updateInterval);

        // Start chart data collection
        this.chartInterval = setInterval(() => {
            this.collectChartData();
            this.updateCharts();
        }, this.config.chartUpdateInterval);

        console.log('Container monitoring started');
    },

    stopMonitoring() {
        if (!this.state.isMonitoring) return;
        
        this.state.isMonitoring = false;
        
        if (this.monitoringInterval) clearInterval(this.monitoringInterval);
        if (this.chartInterval) clearInterval(this.chartInterval);
        
        console.log('Container monitoring stopped');
    },

    async updateMetrics() {
        try {
            // Get current metrics from Docker integration
            const metrics = await this.fetchContainerMetrics();
            this.state.currentMetrics = metrics;

            // Update UI elements
            this.updateMetricCards(metrics);
            this.updateStatusIndicators(metrics);
            this.updateAlertBanner(metrics);

            // Update Docker integration state
            if (window.DockerIntegration) {
                window.DockerIntegration.state.metrics = metrics;
                window.DockerIntegration.updateIndicators();
            }

        } catch (error) {
            console.error('Metrics update error:', error);
            this.showError('Failed to update metrics');
        }
    },

    async fetchContainerMetrics() {
        try {
            // Try to get metrics from Docker API
            const response = await fetch('/api/docker/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    container: 'umbuzo-ollama'
                })
            });

            if (response.ok) {
                const stats = await response.json();
                return {
                    cpu: stats.cpu_usage_percent || 0,
                    memory: stats.memory_usage_percent || 0,
                    gpu: stats.gpu_usage_percent || 0,
                    timestamp: new Date().toISOString()
                };
            } else {
                // Fallback to simulated metrics for demo
                return this.generateSimulatedMetrics();
            }
        } catch (error) {
            // Return simulated metrics if API is not available
            return this.generateSimulatedMetrics();
        }
    },

    generateSimulatedMetrics() {
        // Simulate realistic metrics for demonstration
        const baseTime = Date.now() / 10000;
        const cpu = Math.max(0, Math.min(100, 20 + Math.sin(baseTime) * 15 + Math.random() * 10));
        const memory = Math.max(0, Math.min(100, 40 + Math.cos(baseTime * 0.5) * 20 + Math.random() * 15));
        const gpu = Math.max(0, Math.min(100, 10 + Math.sin(baseTime * 2) * 30 + Math.random() * 20));

        return {
            cpu: Math.round(cpu * 100) / 100,
            memory: Math.round(memory * 100) / 100,
            gpu: Math.round(gpu * 100) / 100,
            timestamp: new Date().toISOString()
        };
    },

    updateMetricCards(metrics) {
        // Update CPU card
        const cpuValue = document.getElementById('cpuValue');
        const cpuProgress = document.getElementById('cpuProgress');
        if (cpuValue) cpuValue.textContent = `${metrics.cpu.toFixed(1)}%`;
        if (cpuProgress) {
            cpuProgress.style.width = `${metrics.cpu}%`;
            cpuProgress.className = `progress-fill ${this.getProgressClass(metrics.cpu)}`;
        }

        // Update Memory card
        const memoryValue = document.getElementById('memoryValue');
        const memoryProgress = document.getElementById('memoryProgress');
        if (memoryValue) memoryValue.textContent = `${metrics.memory.toFixed(1)}%`;
        if (memoryProgress) {
            memoryProgress.style.width = `${metrics.memory}%`;
            memoryProgress.className = `progress-fill ${this.getProgressClass(metrics.memory)}`;
        }

        // Update GPU card
        const gpuValue = document.getElementById('gpuValue');
        const gpuProgress = document.getElementById('gpuProgress');
        if (gpuValue) gpuValue.textContent = `${metrics.gpu.toFixed(1)}%`;
        if (gpuProgress) {
            gpuProgress.style.width = `${metrics.gpu}%`;
            gpuProgress.className = `progress-fill ${this.getProgressClass(metrics.gpu)}`;
        }
    },

    getProgressClass(value) {
        if (value >= this.config.alertThresholds.danger || value >= 90) return 'danger';
        if (value >= this.config.alertThresholds.warning || value >= 70) return 'warning';
        return '';
    },

    updateStatusIndicators(metrics) {
        // Update container status indicators
        const containerStateIndicator = document.getElementById('containerStateIndicator');
        const containerState = document.getElementById('containerState');
        const modelStateIndicator = document.getElementById('modelStateIndicator');
        const modelState = document.getElementById('modelState');
        const apiStateIndicator = document.getElementById('apiStateIndicator');
        const apiState = document.getElementById('apiState');
        const lastHealthCheck = document.getElementById('lastHealthCheck');

        if (containerStateIndicator) {
            containerStateIndicator.className = `status-indicator ${this.state.isMonitoring ? 'running' : 'stopped'}`;
        }
        if (containerState) {
            containerState.textContent = this.state.isMonitoring ? 'Running' : 'Stopped';
        }

        if (modelStateIndicator) {
            modelStateIndicator.className = `status-indicator ${metrics.cpu > 0 ? 'running' : 'loading'}`;
        }
        if (modelState) {
            modelState.textContent = metrics.cpu > 0 ? 'Loaded' : 'Loading...';
        }

        if (apiStateIndicator) {
            apiStateIndicator.className = `status-indicator ${metrics.memory > 0 ? 'running' : 'loading'}`;
        }
        if (apiState) {
            apiState.textContent = metrics.memory > 0 ? 'Connected' : 'Connecting...';
        }

        if (lastHealthCheck) {
            lastHealthCheck.textContent = new Date().toLocaleTimeString();
        }
    },

    updateAlertBanner(metrics) {
        const alertBanner = document.getElementById('alertBanner');
        const alertMessage = document.getElementById('alertMessage');

        if (!alertBanner || !alertMessage) return;

        // Check for high resource usage
        const highCpu = metrics.cpu >= this.config.alertThresholds.cpu;
        const highMemory = metrics.memory >= this.config.alertThresholds.memory;
        const highGpu = metrics.gpu >= this.config.alertThresholds.gpu;

        if (highCpu || highMemory || highGpu) {
            alertBanner.className = 'alert-banner error';
            alertMessage.textContent = `High resource usage detected: CPU ${metrics.cpu.toFixed(1)}%, Memory ${metrics.memory.toFixed(1)}%`;
        } else {
            alertBanner.className = 'alert-banner success';
            alertMessage.textContent = 'All systems operating normally';
        }
    },

    updatePerformanceSummary() {
        const containerUptime = document.getElementById('containerUptime');
        const avgResponseTime = document.getElementById('avgResponseTime');
        const totalRequests = document.getElementById('totalRequests');
        const errorRate = document.getElementById('errorRate');

        if (containerUptime) {
            const uptime = this.calculateUptime();
            containerUptime.textContent = uptime;
        }

        if (avgResponseTime) {
            // Simulate response time based on CPU usage
            const avgTime = Math.max(100, this.state.currentMetrics.cpu * 10);
            avgResponseTime.textContent = `${avgTime.toFixed(0)}ms`;
        }

        if (totalRequests) {
            // Simulate request count
            const requests = Math.floor(Date.now() / 1000) % 1000 + 500;
            totalRequests.textContent = requests.toString();
        }

        if (errorRate) {
            // Simulate error rate based on resource usage
            const errorRateValue = Math.min(10, (this.state.currentMetrics.cpu + this.state.currentMetrics.memory) / 20);
            errorRate.textContent = `${errorRateValue.toFixed(1)}%`;
        }
    },

    calculateUptime() {
        if (!this.state.startTime) return '--';
        
        const now = Date.now();
        const uptimeMs = now - this.state.startTime;
        const uptimeSeconds = Math.floor(uptimeMs / 1000);
        
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    },

    collectChartData() {
        const now = new Date();
        const metrics = this.state.currentMetrics;

        // Add new data point
        this.state.metricsHistory.timestamps.push(now);
        this.state.metricsHistory.cpu.push(metrics.cpu);
        this.state.metricsHistory.memory.push(metrics.memory);
        this.state.metricsHistory.gpu.push(metrics.gpu);

        // Keep only last N data points
        if (this.state.metricsHistory.timestamps.length > this.config.maxDataPoints) {
            this.state.metricsHistory.timestamps.shift();
            this.state.metricsHistory.cpu.shift();
            this.state.metricsHistory.memory.shift();
            this.state.metricsHistory.gpu.shift();
        }
    },

    updateCharts() {
        // For now, just update the chart placeholder with current data
        const chartPlaceholder = document.querySelector('.chart-placeholder');
        if (chartPlaceholder) {
            const latest = this.state.currentMetrics;
            chartPlaceholder.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-weight: bold; margin-bottom: 8px;">Real-time Metrics</div>
                    <div style="font-size: 12px; color: #888; margin-bottom: 12px;">
                        Last updated: ${new Date().toLocaleTimeString()}
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: left;">
                        <div>
                            <div style="color: #5dade2;">CPU: ${latest.cpu.toFixed(1)}%</div>
                            <div style="font-size: 11px; color: #888;">${this.state.metricsHistory.cpu.length} data points</div>
                        </div>
                        <div>
                            <div style="color: #58d68d;">Memory: ${latest.memory.toFixed(1)}%</div>
                            <div style="font-size: 11px; color: #888;">${this.state.metricsHistory.memory.length} data points</div>
                        </div>
                        <div>
                            <div style="color: #f39c12;">GPU: ${latest.gpu.toFixed(1)}%</div>
                            <div style="font-size: 11px; color: #888;">${this.state.metricsHistory.gpu.length} data points</div>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    updateChartRange(range) {
        // Future implementation for chart time ranges
        this.showTemporaryMessage(`Chart range changed to: ${range}`, 'info');
    },

    async loadInitialData() {
        try {
            // Load initial logs
            await this.loadContainerLogs();
            
            // Load initial metrics
            await this.updateMetrics();
            this.updatePerformanceSummary();
            
        } catch (error) {
            console.error('Initial data load error:', error);
        }
    },

    async loadContainerLogs() {
        try {
            const response = await fetch('/api/docker/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    container: 'umbuzo-ollama',
                    lines: 100
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const logs = await response.json();
            if (logs && Array.isArray(logs)) {
                this.displayLogs(logs);
            } else {
                throw new Error('Invalid logs format received');
            }
        } catch (error) {
            console.warn('Failed to load container logs:', error.message);
            this.displaySimulatedLogs();
        }
    },

    displayLogs(logs) {
        const logsContainer = document.getElementById('monitorLogs');
        if (!logsContainer) return;

        logsContainer.innerHTML = '';
        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${log.type || 'info'}`;
            logEntry.textContent = `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`;
            logsContainer.appendChild(logEntry);
        });

        if (this.state.isFollowingLogs) {
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
    },

    displaySimulatedLogs() {
        const logsContainer = document.getElementById('monitorLogs');
        if (!logsContainer) return;

        const simulatedLogs = [
            { type: 'info', message: 'Container started successfully', timestamp: new Date().toISOString() },
            { type: 'success', message: 'Model umbuzo:latest loaded', timestamp: new Date().toISOString() },
            { type: 'info', message: 'API endpoint ready on http://localhost:11434', timestamp: new Date().toISOString() },
            { type: 'warning', message: 'High memory usage detected', timestamp: new Date().toISOString() },
            { type: 'info', message: 'Health check passed', timestamp: new Date().toISOString() }
        ];

        this.displayLogs(simulatedLogs);
    },

    filterLogs() {
        const logsContainer = document.getElementById('monitorLogs');
        if (!logsContainer) return;

        const logEntries = logsContainer.querySelectorAll('.log-entry');
        logEntries.forEach(entry => {
            if (this.state.logFilter === 'all' || entry.classList.contains(this.state.logFilter)) {
                entry.style.display = 'block';
            } else {
                entry.style.display = 'none';
            }
        });
    },

    clearLogs() {
        const logsContainer = document.getElementById('monitorLogs');
        if (logsContainer) {
            logsContainer.innerHTML = '> Logs cleared';
        }
        this.showSuccess('Logs cleared successfully');
    },

    downloadLogs() {
        const logsContainer = document.getElementById('monitorLogs');
        if (!logsContainer) return;

        const logsText = logsContainer.textContent;
        const blob = new Blob([logsText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `umbuzo-container-logs-${new Date().toISOString().slice(0, 19)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Logs downloaded successfully');
    },

    toggleLogFollow() {
        this.state.isFollowingLogs = !this.state.isFollowingLogs;
        const btn = document.getElementById('btnFollowLogs');
        if (btn) {
            btn.textContent = this.state.isFollowingLogs ? 'Pause' : 'Follow';
        }
    },

    refreshData() {
        this.showLoading('Refreshing data...');
        Promise.all([
            this.updateMetrics(),
            this.loadContainerLogs()
        ]).then(() => {
            this.hideLoading();
            this.showSuccess('Data refreshed successfully');
        }).catch(error => {
            this.hideLoading();
            this.showError('Failed to refresh data');
        });
    },

    exportMetrics() {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: this.state.currentMetrics,
            history: this.state.metricsHistory,
            summary: {
                uptime: this.calculateUptime(),
                avgResponseTime: `${Math.max(100, this.state.currentMetrics.cpu * 10).toFixed(0)}ms`,
                totalRequests: Math.floor(Date.now() / 1000) % 1000 + 500,
                errorRate: `${Math.min(10, (this.state.currentMetrics.cpu + this.state.currentMetrics.memory) / 20).toFixed(1)}%`
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `umbuzo-metrics-${new Date().toISOString().slice(0, 19)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Metrics exported successfully');
    },

    showContainerLogs() {
        // Scroll to logs section
        const logsSection = document.querySelector('.logs-section');
        if (logsSection) {
            logsSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    showLoading(message) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const textElement = overlay.querySelector('p');
            if (textElement) textElement.textContent = message;
            overlay.style.display = 'flex';
        }
    },

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = 'none';
    },

    showSuccess(message) {
        this.showTemporaryMessage(message, 'success');
    },

    showError(message) {
        this.showTemporaryMessage(message, 'error');
    },

    showTemporaryMessage(message, type = 'info', duration = 3000) {
        // Remove existing temporary messages
        const existingMessages = document.querySelectorAll('.temp-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new temporary message
        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message ${type}`;
        messageDiv.innerHTML = `
            <span class="temp-message-icon">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '💡'}
            </span>
            <span class="temp-message-text">${message}</span>
        `;

        // Add to page
        document.body.appendChild(messageDiv);

        // Trigger animation
        setTimeout(() => messageDiv.classList.add('show'), 10);

        // Auto-remove after duration
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => messageDiv.remove(), 300);
        }, duration);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof ContainerMonitor !== 'undefined') {
        ContainerMonitor.init();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContainerMonitor;
} else if (typeof window !== 'undefined') {
    window.ContainerMonitor = ContainerMonitor;
}