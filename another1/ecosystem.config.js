module.exports = {
  apps: [
    {
      name: 'sg-ready-pdf',
      script: '.next/standalone/server.js',
      cwd: '/root/tom/another1',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3006
      },
      error_file: '/root/tom/another1/logs/err.log',
      out_file: '/root/tom/another1/logs/out.log',
      log_file: '/root/tom/another1/logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      ignore_watch: [
        'node_modules',
        'logs',
        '.next',
        '.git'
      ],
      env_file: '/root/tom/another1/.env.local'
    }
  ]
}; 