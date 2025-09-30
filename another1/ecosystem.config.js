module.exports = {
  apps: [
    {
      name: 'scorecard-socialgarden',
      script: '.next/standalone/server.js',
      cwd: '/root/tom/another1',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3008,
        HOSTNAME: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3008,
        HOSTNAME: '0.0.0.0'
      },
      max_memory_restart: '1G',
      error_file: '/root/tom/another1/logs/scorecard-error.log',
      out_file: '/root/tom/another1/logs/scorecard-out.log',
      log_file: '/root/tom/another1/logs/scorecard-combined.log',
      time: true,
      merge_logs: true
    }
  ]
}; 