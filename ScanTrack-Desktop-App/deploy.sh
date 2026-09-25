#!/bin/bash
set -e

echo "Updating system..."
sudo apt-get update -y

echo "Installing Node.js, npm, and Nginx..."
sudo apt-get install -y nodejs npm nginx

echo "Extracting backend..."
tar -xzvf backend.tar.gz
cd backend

echo "Installing Node modules..."
npm install

echo "Installing PM2..."
sudo npm install -g pm2

echo "Starting backend..."
pm2 stop scantrack-api || true
pm2 start server.js --name "scantrack-api"
pm2 save
# Generate and run startup script
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

echo "Configuring Nginx..."
sudo bash -c 'cat > /etc/nginx/sites-available/scantrack <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF'

sudo ln -sf /etc/nginx/sites-available/scantrack /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "Deployment complete!"
