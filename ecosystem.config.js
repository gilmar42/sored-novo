{
  "apps": [
    {
      "name": "sored-backend",
      "script": "dist/index.js",
      "instances": 1,
      "exec_mode": "cluster",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3001
      },
      "env_production": {
        "NODE_ENV": "production",
        "PORT": 3001
      },
      "log_file": "/home/u123456789/domains/api.sored-industrial.com/logs/pm2.log",
      "out_file": "/home/u123456789/domains/api.sored-industrial.com/logs/pm2-out.log",
      "error_file": "/home/u123456789/domains/api.sored-industrial.com/logs/pm2-error.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "max_memory_restart": "1G",
      "node_args": "--max-old-space-size=1024",
      "watch": false,
      "ignore_watch": [
        "node_modules",
        "logs",
        "uploads"
      ],
      "restart_delay": 4000,
      "max_restarts": 10,
      "min_uptime": "10s"
    }
  ],
  "deploy": {
    "production": {
      "user": "u123456789",
      "host": "api.sored-industrial.com",
      "ref": "origin/master",
      "repo": "https://github.com/gilmar42/sored-novo.git",
      "path": "/home/u123456789/domains/api.sored-industrial.com/current",
      "pre-deploy-local": "",
      "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": ""
    }
  }
}
