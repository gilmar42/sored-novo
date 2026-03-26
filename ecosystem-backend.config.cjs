module.exports = {
  apps: [
    {
      name: "sored-backend",
      script: "npm",
      args: "start",
      cwd: "./backend",
      env_file: "./backend/.env",
      autorestart: true,
      watch: false,
      time: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3001
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true
    }
  ]
};