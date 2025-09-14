module.exports = {
  apps: [
    {
      name: "zeiterfassung1337",
      script: "npm",
      args: "start",
      cwd: "/var/www/zeiterfassung1337",
      env_file: ".env",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}

