module.exports = {
  apps: [{
    name: 'homePage',
    script: 'src/server.js',
    
    // 开发环境配置
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    
    // 生产环境配置
    env_production: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    
    // 进程管理配置
    instances: 1,              // Docker 中使用单实例
    exec_mode: 'fork',        // Docker 中使用 fork 模式
    watch: false,             // 关闭文件监听
    max_memory_restart: '1G', // 内存限制
    
    // 错误处理
    exp_backoff_restart_delay: 100, // 重启延迟
    max_restarts: 10,               // 最大重启次数
    
    // 日志配置
    error_file: '/app/logs/error.log',
    out_file: '/app/logs/access.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    
    // 优雅退出
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 3000,
    
    // 健康检查更新
    healthcheck: {
      url: 'http://localhost:3003/health'
    }
  }]
}; 