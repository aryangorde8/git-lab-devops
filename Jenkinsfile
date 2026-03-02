// ============================================
// Jenkinsfile - CI/CD Pipeline
// ============================================
// Pipeline : Pipeline-FileEncrypter
// Repo     : https://github.com/aryangorde8/git-lab-devops
// Branch   : main
//
// Stages:
//   1. Clone Repository
//   2. Verify Files
//   3. Build Docker Images
//   4. Load Images to Minikube
//   5. Deploy to Kubernetes
//   6. Check Deployment
// ============================================

pipeline {
    agent any

    environment {
        REPO_URL         = 'https://github.com/aryangorde8/git-lab-devops.git'
        BRANCH           = 'main'
        BACKEND_IMAGE    = 'devops-backend'
        FRONTEND_IMAGE   = 'devops-frontend'
    }

    stages {

        // ======================================
        // Stage 1: Clone Repository
        // ======================================
        stage('Clone Repository') {
            steps {
                echo '========== Cloning Repository =========='
                // Clean workspace before cloning
                deleteDir()
                git branch: "${BRANCH}", url: "${REPO_URL}"
                echo 'Repository cloned successfully.'
            }
        }

        // ======================================
        // Stage 2: Verify Files
        // ======================================
        stage('Verify Files') {
            steps {
                echo '========== Verifying Project Structure =========='
                sh '''
                    echo "-- Checking required directories --"

                    for dir in backend frontend k8s; do
                        if [ -d "$dir" ]; then
                            echo "[OK] $dir/ directory exists"
                        else
                            echo "[FAIL] $dir/ directory is MISSING"
                            exit 1
                        fi
                    done

                    echo ""
                    echo "-- Checking required files --"

                    for f in backend/Dockerfile backend/server.js backend/package.json \
                             frontend/Dockerfile frontend/index.html frontend/nginx.conf \
                             k8s/pod.yaml k8s/service.yaml; do
                        if [ -f "$f" ]; then
                            echo "[OK] $f exists"
                        else
                            echo "[FAIL] $f is MISSING"
                            exit 1
                        fi
                    done

                    echo ""
                    echo "All required files verified successfully."
                '''
            }
        }

        // ======================================
        // Stage 3: Build Docker Images
        // ======================================
        stage('Build Docker Images') {
            steps {
                echo '========== Building Docker Images =========='
                sh """
                    echo "-- Building backend image: ${BACKEND_IMAGE} --"
                    docker build -t ${BACKEND_IMAGE} ./backend
                    echo ""
                    echo "-- Building frontend image: ${FRONTEND_IMAGE} --"
                    docker build -t ${FRONTEND_IMAGE} ./frontend
                    echo ""
                    echo "Docker images built successfully."
                    docker images | grep -E 'devops-backend|devops-frontend'
                """
            }
        }

        // ======================================
        // Stage 4: Load Images to Minikube
        // ======================================
        stage('Load Images to Minikube') {
            steps {
                echo '========== Loading Images into Minikube =========='
                sh """
                    echo "-- Loading ${BACKEND_IMAGE} into Minikube --"
                    docker save ${BACKEND_IMAGE} | docker exec -i minikube docker load
                    echo ""
                    echo "-- Loading ${FRONTEND_IMAGE} into Minikube --"
                    docker save ${FRONTEND_IMAGE} | docker exec -i minikube docker load
                    echo ""
                    echo "Images loaded into Minikube successfully."
                    echo ""
                    echo "-- Verifying images inside Minikube --"
                    docker exec minikube docker images | grep -E 'devops-backend|devops-frontend' || true
                """
            }
        }

        // ======================================
        // Stage 5: Deploy to Kubernetes
        // ======================================
        stage('Deploy to Kubernetes') {
            steps {
                echo '========== Deploying to Kubernetes =========='
                sh '''
                    echo "-- Deleting previous deployment (if any) --"
                    kubectl delete -f k8s/pod.yaml --ignore-not-found=true
                    kubectl delete -f k8s/service.yaml --ignore-not-found=true

                    echo ""
                    echo "-- Waiting for old pod to terminate --"
                    sleep 5

                    echo ""
                    echo "-- Applying pod.yaml --"
                    kubectl apply -f k8s/pod.yaml

                    echo ""
                    echo "-- Applying service.yaml --"
                    kubectl apply -f k8s/service.yaml

                    echo ""
                    echo "Kubernetes manifests applied successfully."
                '''
            }
        }

        // ======================================
        // Stage 6: Check Deployment
        // ======================================
        stage('Check Deployment') {
            steps {
                echo '========== Checking Deployment Status =========='
                sh '''
                    echo "-- Waiting for pod to be ready (up to 120s) --"
                    kubectl wait --for=condition=Ready pod/multi-container-app --timeout=120s || true

                    echo ""
                    echo "===== POD STATUS ====="
                    kubectl get pods -o wide

                    echo ""
                    echo "===== SERVICES ====="
                    kubectl get services

                    echo ""
                    echo "===== POD DESCRIPTION ====="
                    kubectl describe pod multi-container-app

                    echo ""
                    echo "===== BACKEND LOGS ====="
                    kubectl logs multi-container-app -c backend --tail=30 || true

                    echo ""
                    echo "===== FRONTEND LOGS ====="
                    kubectl logs multi-container-app -c frontend --tail=30 || true

                    echo ""
                    echo "===== MYSQL LOGS ====="
                    kubectl logs multi-container-app -c mysql --tail=30 || true
                '''
            }
        }
    }

    // ==========================================
    // Post Actions
    // ==========================================
    post {
        success {
            echo '''
========================================
  PIPELINE COMPLETED SUCCESSFULLY!
========================================
  Access the application:
    minikube service crud-app-service --url
  Or open in browser:
    http://<minikube-ip>:30080
========================================
'''
        }
        failure {
            echo '''
========================================
  PIPELINE FAILED!
========================================
  Check the stage logs above for errors.
========================================
'''
        }
        always {
            echo 'Pipeline execution finished.'
        }
    }
}
