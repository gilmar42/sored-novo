module.exports = {
  apps: [
    {
      name: "sored-frontend",
      script: "npm",
      args: "start",
      cwd: "./",
      env_file: "./.env",
      autorestart: true,
      watch: false,
      time: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
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
      }
    }
  ]
};
