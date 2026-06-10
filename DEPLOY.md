# Deploy FinDash ke Server

Project ini adalah website statis. File yang dipublish ada di folder `www/`.

## 1. Push ke GitHub dari laptop

```powershell
cd "D:\BELAJAR CODE\web-findash"
git init
git add .
git commit -m "Initial FinDash website"
git branch -M main
git remote add origin https://github.com/USERNAME/web-findash.git
git push -u origin main
```

Ganti `USERNAME` dengan username GitHub kamu.

## 2. Deploy di server

Login ke server:

```bash
ssh zisdev2@192.168.1.3
```

Lalu jalankan:

```bash
cd /tmp
git clone https://github.com/USERNAME/web-findash.git
cd web-findash
REPO_URL=https://github.com/USERNAME/web-findash.git bash deploy-server.sh
```

Setelah selesai, akses dari browser:

```text
http://192.168.1.3/findash/
```

## 3. Update berikutnya

Setelah ada perubahan di laptop:

```powershell
git add .
git commit -m "Update FinDash"
git push
```

Di server:

```bash
cd /var/www/web-findash
git pull --ff-only
rsync -a --delete --exclude='.git/' --exclude='node_modules/' --exclude='.idea/' www/ /var/www/html/findash/
sudo systemctl reload nginx
```
