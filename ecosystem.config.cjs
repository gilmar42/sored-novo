module.exports = {
  apps: [
    {
      name: "sored-frontend",
      script: "npm",
      args: "start",
      cwd: "./",
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
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    }
  ]
};
