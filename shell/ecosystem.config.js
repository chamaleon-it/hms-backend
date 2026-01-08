module.exports = {
  apps: [
    {
      name: "hms-backend",
      cwd: "C:/hms/backend",
      script: "yarn",
      args: "start:prod",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "hms-frontend",
      cwd: "C:/hms/frontend",
      script: "yarn",
      args: "start",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
}
