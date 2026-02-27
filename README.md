# Kubernetes Multi-Container Pod - CRUD App
## College Lab Project

A simple CRUD application running on Kubernetes (Minikube) with 3 containers in a single Pod:
- **Frontend**: HTML + JavaScript served by nginx
- **Backend**: Node.js + Express REST API
- **Database**: MySQL 8.0

---

## Architecture Diagram

```
┌─────────────────── Kubernetes Pod ───────────────────┐
│                                                       │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│  │ Frontend │    │ Backend  │    │  MySQL   │        │
│  │ (nginx)  │───▶│ (NodeJS) │───▶│ (DB)     │        │
│  │ port:80  │    │ port:3000│    │ port:3306│        │
│  └──────────┘    └──────────┘    └──────────┘        │
│       ▲                                               │
│       │          All communicate via localhost         │
└───────┼───────────────────────────────────────────────┘
        │
   NodePort Service (port 30080)
        │
   Browser / curl
```

---

## Folder Structure

```
project/
├── frontend/
│   ├── index.html        # Frontend UI
│   ├── nginx.conf        # Nginx config with reverse proxy
│   └── Dockerfile        # Build frontend image
├── backend/
│   ├── server.js         # Express REST API server
│   ├── package.json      # Node.js dependencies
│   └── Dockerfile        # Build backend image
├── k8s/
│   ├── pod.yaml          # Pod with 3 containers
│   └── service.yaml      # NodePort Service
└── README.md             # This file
```

---

## Prerequisites

- Minikube installed
- kubectl installed
- Docker installed

---

## Step-by-Step Deployment

### Step 1: Start Minikube with Docker driver

```bash
minikube start --driver=docker
```

### Step 2: Use Minikube's Docker daemon

This is important! We need to build images inside Minikube's Docker so that Kubernetes can find them.

```bash
eval $(minikube docker-env)
```

### Step 3: Build Docker images

```bash
# Navigate to project folder
cd project

# Build frontend image
docker build -t frontend-app:latest ./frontend

# Build backend image
docker build -t backend-app:latest ./backend
```

> **Note**: MySQL uses the official `mysql:8.0` image from Docker Hub, no need to build it.

### Step 4: Deploy to Kubernetes

```bash
# Create the Pod (3 containers)
kubectl apply -f k8s/pod.yaml

# Create the Service (NodePort)
kubectl apply -f k8s/service.yaml
```

### Step 5: Check status

```bash
# Check if Pod is running (wait for all 3 containers to be Ready: 3/3)
kubectl get pods

# Check service
kubectl get services

# Watch pod status in real-time
kubectl get pods -w
```

### Step 6: Get the URL

```bash
# Get the Minikube service URL
minikube service crud-app-service --url
```

Open the URL in your browser to access the frontend.

---

## Testing with curl

Replace `<URL>` with the output from `minikube service crud-app-service --url`
(e.g., `http://192.168.49.2:30080`).

### 1. Create Table
```bash
curl -X POST <URL>/api/create-table
```

### 2. Add Users
```bash
curl -X POST <URL>/api/add-user \
  -H "Content-Type: application/json" \
  -d '{"name": "Aryan", "email": "aryan@example.com"}'

curl -X POST <URL>/api/add-user \
  -H "Content-Type: application/json" \
  -d '{"name": "Priya", "email": "priya@example.com"}'
```

### 3. Get All Users
```bash
curl <URL>/api/users
```

### 4. Update User (ID = 1)
```bash
curl -X PUT <URL>/api/update-user/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Aryan Kumar", "email": "aryan.kumar@example.com"}'
```

### 5. Delete User (ID = 2)
```bash
curl -X DELETE <URL>/api/delete-user/2
```

### 6. Verify Deletion
```bash
curl <URL>/api/users
```

---

## Useful kubectl Commands

```bash
# View Pod details
kubectl describe pod multi-container-app

# View logs of each container
kubectl logs multi-container-app -c frontend
kubectl logs multi-container-app -c backend
kubectl logs multi-container-app -c mysql

# Execute shell inside a container
kubectl exec -it multi-container-app -c backend -- sh
kubectl exec -it multi-container-app -c mysql -- bash

# Connect to MySQL directly
kubectl exec -it multi-container-app -c mysql -- mysql -u root -prootpass mydb

# Delete everything
kubectl delete -f k8s/pod.yaml
kubectl delete -f k8s/service.yaml
```

---

## Viva Q&A - Key Concepts

### Q: What is a Pod?
A: A Pod is the smallest deployable unit in Kubernetes. It can contain one or more containers that share the same network and storage.

### Q: Why do all containers use "localhost" to communicate?
A: All containers in a Pod share the same network namespace. They can reach each other via `localhost` (127.0.0.1) on different ports.

### Q: What is a NodePort Service?
A: NodePort exposes a service on a static port (30000-32767) on each node's IP. This allows external access to the application.

### Q: What is the difference between ClusterIP, NodePort, and LoadBalancer?
A:
- **ClusterIP**: Internal only, accessible within the cluster
- **NodePort**: Exposes on a port on each node (used in Minikube)
- **LoadBalancer**: Creates an external load balancer (cloud providers)

### Q: What does `imagePullPolicy: Never` mean?
A: It tells Kubernetes NOT to pull the image from Docker Hub. Instead, it uses the locally built image (important for Minikube).

### Q: Why use `eval $(minikube docker-env)`?
A: This configures your terminal to use Minikube's Docker daemon, so images built with `docker build` are available inside Minikube.

### Q: What are environment variables in the Pod YAML?
A: They pass configuration (like database credentials) to containers without hardcoding them in the application code.

### Q: What is a multi-container Pod pattern?
A: It's when multiple tightly-coupled containers run in the same Pod. Common patterns include:
- **Sidecar**: Helper container alongside main container
- **Ambassador**: Proxy container for network connections
- **Adapter**: Container that transforms output of main container

---

## Cleanup

```bash
# Delete Kubernetes resources
kubectl delete -f k8s/service.yaml
kubectl delete -f k8s/pod.yaml

# Stop Minikube
minikube stop

# (Optional) Delete Minikube cluster
minikube delete
```
