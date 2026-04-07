pipeline {
    agent { label 'docker' }
    tools {
      nodejs 'node20'
    }
    environment {
        // --- GitLab Registry ---
        GITLAB_REGISTRY_URL  = 'registry.gitlab.com/phanminhkaneki/js-realtime-chat'
        GITLAB_PROJECT_PATH  = 'phanminhkaneki/js-realtime-chat' // <-- THAY ĐỔI

        IMAGE_BACKEND  = "${GITLAB_REGISTRY_URL}/${GITLAB_PROJECT_PATH}/backend"
        IMAGE_FRONTEND = "${GITLAB_REGISTRY_URL}/${GITLAB_PROJECT_PATH}/frontend"

        // --- Production Server ---
        PROD_HOST = '192.168.1.102'
        PROD_USER = 'ubuntu'
        PROD_APP_DIR = '/home/ubuntu/app'

        FRONTEND_WEBROOT = '/var/www/js-realtime-chat'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.GIT_BRANCH} | Commit: ${env.GIT_COMMIT?.take(8)}"
            }
        }

        stage('Detect Changes') {
            steps {
                script {
                    def changedFiles = ''
                    try {
                        changedFiles = sh(
                            script: 'git diff --name-only HEAD^ HEAD 2>/dev/null',
                            returnStdout: true
                        ).trim()
                    } catch (Exception e) {
                       // First commit hoặc lỗi: build tất cả
                        echo "Không thể lấy git diff (có thể là commit đầu tiên). Build tất cả."
                        changedFiles = ''
                    }

                    if (changedFiles.isEmpty()) {
                        env.BACKEND_CHANGED  = 'true'
                        env.FRONTEND_CHANGED = 'true'
                    } else {
                        def lines = changedFiles.split('\n')

                        // Backend thay đổi nếu: code backend, hoặc Jenkinsfile, hoặc compose file
                        env.BACKEND_CHANGED = lines.any {
                            it.startsWith('backend/') ||
                            it == 'Jenkinsfile' ||
                            it == 'docker-compose.prod.yml'
                        } ? 'true' : 'false'

                        // Frontend thay đổi nếu: code frontend
                        env.FRONTEND_CHANGED = lines.any {
                            it.startsWith('frontend/')
                        } ? 'true' : 'false'
                    }

                    echo "==> Backend thay đổi : ${env.BACKEND_CHANGED}"
                    echo "==> Frontend thay đổi: ${env.FRONTEND_CHANGED}"

                    if (env.BACKEND_CHANGED == 'false' && env.FRONTEND_CHANGED == 'false') {
                        echo "Không có thay đổi cần build (infra-only change). Pipeline kết thúc sớm."
                        currentBuild.result = 'SUCCESS'
                    }
                }
            }
        }

        
        stage('Test Backend') {
            when {
                expression { return env.BACKEND_CHANGED == 'true' }
            }
            steps {
                dir('backend') {
                    sh 'npm ci'
                    // Bọc trong catchError để pipeline không fail khi chưa có test suite.
                    // Khi đã thêm Jest, xóa catchError để fail đúng.
                    catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                        sh 'npm test'
                    }
                }
            }
        }

        
        stage('Build Images') {
            parallel {

                stage('Build Backend Image') {
                    when {
                        expression { return env.BACKEND_CHANGED == 'true' }
                    }
                    steps {
                        dir('backend') {
                            sh """
                                docker build \
                                    -t ${IMAGE_BACKEND}:${BUILD_NUMBER} \
                                    -t ${IMAGE_BACKEND}:latest \
                                    .
                            """
                        }
                    }
                }

                stage('Build Frontend Image') {
                    when {
                        expression { return env.FRONTEND_CHANGED == 'true' }
                    }
                    steps {
                        dir('frontend') {
                            sh """
                                docker build \
                                    -t ${IMAGE_FRONTEND}:${BUILD_NUMBER} \
                                    -t ${IMAGE_FRONTEND}:latest \
                                    .
                            """
                        }
                    }
                }

            } // end parallel
        }

        // =====================================================================
        // STAGE 5: PUSH TO GITLAB REGISTRY
        // Credentials ID: 'gitlab-registry-credentials' (Username with password)
        // =====================================================================
        stage('Push to GitLab Registry') {
            when {
                expression {
                    return env.BACKEND_CHANGED == 'true' || env.FRONTEND_CHANGED == 'true'
                }
            }
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'gitlab-https-cred-id',
                        usernameVariable: 'REGISTRY_USER',
                        passwordVariable: 'REGISTRY_TOKEN'
                    )
                ]) {
                    sh 'echo "$REGISTRY_TOKEN" | docker login $GITLAB_REGISTRY_URL -u "$REGISTRY_USER" --password-stdin'

                    script {
                        if (env.BACKEND_CHANGED == 'true') {
                            sh "docker push ${IMAGE_BACKEND}:${BUILD_NUMBER}"
                            sh "docker push ${IMAGE_BACKEND}:latest"
                        }
                        if (env.FRONTEND_CHANGED == 'true') {
                            sh "docker push ${IMAGE_FRONTEND}:${BUILD_NUMBER}"
                            sh "docker push ${IMAGE_FRONTEND}:latest"
                        }
                    }
                }
            }
        }

        // =====================================================================
        // STAGE 6: DEPLOY TO PRODUCTION
        // Credentials ID:
        //   - 'prod-server-ssh-key'         : SSH Private Key vào prod server
        //   - 'gitlab-registry-credentials' : để prod server pull image
        //   - 'backend-env-file'            : Secret File (.env.prod cho backend)
        // =====================================================================
        stage('Deploy to Production') {
            when {
                expression {
                    return env.BACKEND_CHANGED == 'true' || env.FRONTEND_CHANGED == 'true'
                }
            }
              steps {
                  // 1. Lấy thông tin đăng nhập Registry và SSH Key
                  withCredentials([
                      usernamePassword(
                          credentialsId: 'gitlab-https-cred-id',
                          usernameVariable: 'REGISTRY_USER',
                          passwordVariable: 'REGISTRY_TOKEN'
                      )
                  ]) {
                      sshagent(credentials: ['ssh-prod-server']) {
                          
                          // --- 6a. Tạo thư mục app trên prod server ---
                          sh "ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} 'mkdir -p ${PROD_APP_DIR}'"

                          // --- 6b. Deploy Backend ---
                          script {
                              if (env.BACKEND_CHANGED == 'true') {
                                  
                                  // SỬ DỤNG MANAGED FILES Ở ĐÂY
                                  // fileId: 'backend-env-id' là ID bạn đặt trong Managed Files
                                  // targetLocation: Tên file tạm thời sẽ tạo ra trên Jenkins Agent
                                  configFileProvider([configFile(fileId: 'app-prod-credentials', targetLocation: '.env.prod')]) {
                                      
                                      // Copy file compose (từ code) và file .env.prod (vừa tạo từ Managed Files) lên server
                                      sh "scp -o StrictHostKeyChecking=no docker-compose.prod.yml .env.prod ${PROD_USER}@${PROD_HOST}:${PROD_APP_DIR}/"
                                  }

                                  // Pull image và restart backend container
                                  sh """
                                      ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} bash -s << 'REMOTE_SCRIPT'
                                          set -e
                                          echo "${REGISTRY_TOKEN}" | docker login ${GITLAB_REGISTRY_URL} -u "${REGISTRY_USER}" --password-stdin
                                          cd ${PROD_APP_DIR}
                                          export IMAGE_BACKEND=${IMAGE_BACKEND}
                                          export APP_VERSION=${BUILD_NUMBER}
                                          
                                          # Docker compose sẽ tự tìm file .env.prod nếu bạn đặt tên đúng hoặc khai báo trong yaml
                                          docker compose -f docker-compose.prod.yml pull backend
                                          docker compose -f docker-compose.prod.yml up -d --no-deps backend
                                          docker image prune -f
          REMOTE_SCRIPT
                                  """
                              }
                          }

                          // --- 6c. Deploy Frontend (giữ nguyên logic extract của bạn) ---
                          script {
                              if (env.FRONTEND_CHANGED == 'true') {
                                  sh """
                                      ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} bash -s << 'REMOTE_SCRIPT'
                                          set -e
                                          echo "${REGISTRY_TOKEN}" | docker login ${GITLAB_REGISTRY_URL} -u "${REGISTRY_USER}" --password-stdin
                                          docker pull ${IMAGE_FRONTEND}:${BUILD_NUMBER}

                                          sudo mkdir -p ${FRONTEND_WEBROOT}
                                          CONTAINER_ID=\$(docker create ${IMAGE_FRONTEND}:${BUILD_NUMBER})
                                          sudo docker cp \$CONTAINER_ID:/static/dist/. ${FRONTEND_WEBROOT}/
                                          docker rm \$CONTAINER_ID

                                          sudo chown -R www-data:www-data ${FRONTEND_WEBROOT}
                                          sudo chmod -R 755 ${FRONTEND_WEBROOT}
                                          docker image prune -f
          REMOTE_SCRIPT
                                  """
                              }
                          }
                      } // end sshagent
                  } // end withCredentials
              }
          }

        // =====================================================================
        // STAGE 7: SMOKE TEST (Health Check sau deploy)
        // =====================================================================
        stage('Smoke Test') {
            when {
                expression { return env.BACKEND_CHANGED == 'true' }
            }
            steps {
                // Chờ container khởi động xong
                sleep(time: 10, unit: 'SECONDS')
                sh """
                    curl -sf --retry 5 --retry-delay 5 \
                        http://${PROD_HOST}:3000/health \
                        && echo "Backend health check: PASS" \
                        || (echo "Backend health check: FAIL" && exit 1)
                """
            }
        }

    } // end stages

    // =========================================================================
    // POST ACTIONS
    // =========================================================================
    post {
        always {
            // Cleanup Docker images trên Jenkins agent để tiết kiệm disk
            script {
                try {
                    if (env.BACKEND_CHANGED == 'true') {
                        sh "docker rmi ${IMAGE_BACKEND}:${BUILD_NUMBER} ${IMAGE_BACKEND}:latest --force 2>/dev/null || true"
                    }
                    if (env.FRONTEND_CHANGED == 'true') {
                        sh "docker rmi ${IMAGE_FRONTEND}:${BUILD_NUMBER} ${IMAGE_FRONTEND}:latest --force 2>/dev/null || true"
                    }
                    sh 'docker logout $GITLAB_REGISTRY_URL 2>/dev/null || true'
                } catch (Exception e) {
                    echo "Cleanup warning: ${e.message}"
                }
            }
        }
        success {
            echo """
            ✅ Pipeline thành công!
            Build     : #${BUILD_NUMBER}
            Commit    : ${env.GIT_COMMIT?.take(8)}
            Backend   : ${env.BACKEND_CHANGED == 'true' ? 'Deployed ✓' : 'Skipped'}
            Frontend  : ${env.FRONTEND_CHANGED == 'true' ? 'Deployed ✓' : 'Skipped'}
            """
        }
        failure {
            echo """
            ❌ Pipeline thất bại!
            Build  : #${BUILD_NUMBER}
            Commit : ${env.GIT_COMMIT?.take(8)}
            Xem Console Output để biết chi tiết.
            """
        }
        unstable {
            echo "⚠️  Pipeline UNSTABLE (có test fail). Kiểm tra lại test suite."
        }
    }
}
