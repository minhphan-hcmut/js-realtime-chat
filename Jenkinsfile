pipeline {
    // =========================================================================
    // Toàn bộ pipeline chạy trên Jenkins Agent (label 'docker')
    // Master chỉ nhận webhook và dispatch job xuống đây.
    // =========================================================================
    agent { label 'docker' }

    environment {
        // --- Docker Registry (GitLab) ---
        REGISTRY_URL      = 'registry.gitlab.com'
        GITLAB_PROJECT    = 'phanminhkaneki/js-realtime-chat'   // <-- THAY ĐỔI nếu cần

        IMAGE_FRONTEND    = "${REGISTRY_URL}/${GITLAB_PROJECT}"
        IMAGE_BACKEND     = "${REGISTRY_URL}/${GITLAB_PROJECT}"

        // --- Production Server (Prod-App) ---
        PROD_HOST         = '192.168.1.102'                      // <-- THAY ĐỔI
        PROD_USER         = 'ubuntu'
        PROD_APP_DIR      = '/home/ubuntu/app'

        // --- Jenkins Credentials IDs ---
        //   'gitlab-registry-cred'  : Username + Password (GitLab Registry)
        //   'ssh-prod-server'       : SSH Private Key vào Prod-App
        //   'app-prod-env-file'     : Managed File (.env) chứa MONGO_URL,
    }

    stages {

        // =====================================================================
        // BƯỚC 1 – TRIGGER & CHECKOUT
        // Jenkins Master đã nhận Webhook từ Git và dispatch job xuống Agent.
        // Agent kéo code mới về tại bước này.
        // =====================================================================
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Lấy 8 ký tự đầu của commit SHA làm IMAGE_TAG
                    // → tag bất biến, traceable, dễ rollback
                    // Fallback về BUILD_NUMBER nếu GIT_COMMIT chưa có
                    env.IMAGE_TAG = env.GIT_COMMIT?.take(8) ?: "build-${BUILD_NUMBER}"
                }
                echo "▶ Branch    : ${env.GIT_BRANCH}"
                echo "▶ Commit    : ${env.GIT_COMMIT?.take(8)}"
                echo "▶ Image Tag : ${env.IMAGE_TAG}"
            }
        }

        // =====================================================================
        // BƯỚC 2a – DETECT CHANGES (tối ưu build, chỉ build service thay đổi)
        // =====================================================================
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
                        echo "Commit đầu tiên hoặc lỗi git diff  build toàn bộ."
                    }

                    if (changedFiles.isEmpty()) {
                        env.BACKEND_CHANGED  = 'true'
                        env.FRONTEND_CHANGED = 'true'
                    } else {
                        def lines = changedFiles.split('\n')
                        env.BACKEND_CHANGED = lines.any {
                            it.startsWith('backend/') ||
                            it == 'Jenkinsfile'       ||
                            it == 'docker-compose.prod.yml'
                        } ? 'true' : 'false'

                        env.FRONTEND_CHANGED = lines.any {
                            it.startsWith('frontend/')
                        } ? 'true' : 'false'
                    }

                    echo "Backend thay đổi  : ${env.BACKEND_CHANGED}"
                    echo "Frontend thay đổi : ${env.FRONTEND_CHANGED}"

                    if (env.BACKEND_CHANGED == 'false' && env.FRONTEND_CHANGED == 'false') {
                        echo "Không có thay đổi cần build. Pipeline kết thúc sớm."
                        currentBuild.result = 'SUCCESS'
                    }
                }
            }
        }

        // =====================================================================
        // BƯỚC 2b – BUILD DOCKER IMAGE (song song trên Jenkins Agent)
        //
        // Mỗi image được tag 2 lần:
        //   :<commit-sha>  → tag bất biến dùng để DEPLOY và ROLLBACK
        //   :latest        → alias tiện lợi cho developer khi pull về dev local,
        //                    KHÔNG dùng tag này trong docker-compose.prod.yml
        // =====================================================================
        stage('Build Images') {
            when {
                expression {
                    return env.BACKEND_CHANGED == 'true' || env.FRONTEND_CHANGED == 'true'
                }
            }
            parallel {

                stage('Build chat-backend') {
                    when { expression { return env.BACKEND_CHANGED == 'true' } }
                    steps {
                        dir('backend') {
                            sh """
                                docker build \
                                    -t ${IMAGE_BACKEND}:${IMAGE_TAG} \
                                    -t ${IMAGE_BACKEND}:latest \
                                    .
                            """
                        }
                    }
                }

                stage('Build chat-frontend') {
                    when { expression { return env.FRONTEND_CHANGED == 'true' } }
                    steps {
                        dir('frontend') {
                            sh """
                                docker build \
                                    -t ${IMAGE_FRONTEND}:${IMAGE_TAG} \
                                    -t ${IMAGE_FRONTEND}:latest \
                                    .
                            """
                        }
                    }
                }

            } // end parallel
        }

        // =====================================================================
        // BƯỚC 2c – PUSH IMAGE LÊN DOCKER REGISTRY (trên Jenkins Agent)
        //
        // Push cả 2 tag: :<sha> (dùng cho prod) và :latest (alias cho dev)
        // =====================================================================
        stage('Push Images to Registry') {
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
                    sh 'echo "$REGISTRY_TOKEN" | docker login $REGISTRY_URL -u "$REGISTRY_USER" --password-stdin'

                    script {
                        if (env.BACKEND_CHANGED == 'true') {
                            sh "docker push ${IMAGE_BACKEND}:${IMAGE_TAG}"  // tag deploy thực sự
                            sh "docker push ${IMAGE_BACKEND}:latest"        // alias cho dev
                        }
                        if (env.FRONTEND_CHANGED == 'true') {
                            sh "docker push ${IMAGE_FRONTEND}:${IMAGE_TAG}"
                            sh "docker push ${IMAGE_FRONTEND}:latest"
                        }
                    }
                }
            }
        }

        // =====================================================================
        // BƯỚC 3 + 4 – DEPLOY LÊN PROD-APP QUA SSH
        //
        //   4a. Inject file .env (MongoDB URL, Redis URL) từ Jenkins Managed Files
        //   4b. docker compose pull  → kéo image theo tag :<sha>
        //   4c. docker compose up -d → restart service
        //
        // docker-compose.prod.yml đọc BACKEND_TAG / FRONTEND_TAG từ env
        // → prod luôn chạy đúng SHA đã build, không bao giờ bị ghi đè
        //   bởi một push :latest từ pipeline song song.
        //
        // Rollback chỉ cần chạy lại pipeline của commit cũ, hoặc SSH vào prod
        // và export BACKEND_TAG=<sha-cũ> rồi docker compose up -d.
        // =====================================================================
        stage('Deploy to Prod-App') {
            when {
                expression {
                    return env.BACKEND_CHANGED == 'true' || env.FRONTEND_CHANGED == 'true'
                }
            }
            steps {
                sshagent(credentials: ['ssh-prod-server']) {
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'gitlab-registry-cred',
                            usernameVariable: 'REGISTRY_USER',
                            passwordVariable: 'REGISTRY_TOKEN'
                        )
                    ]) {
                        // --- 4a. Inject .env từ Managed Files rồi scp sang Prod-App ---
                        configFileProvider([
                            configFile(fileId: 'app-prod-credentials', targetLocation: '.env')
                        ]) {
                            sh "ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} 'mkdir -p ${PROD_APP_DIR}'"

                            sh """
                                scp -o StrictHostKeyChecking=no \
                                    .env \
                                    docker-compose.prod.yml \
                                    ${PROD_USER}@${PROD_HOST}:${PROD_APP_DIR}/
                            """
                        }

                        // --- 4b & 4c. Pull image theo SHA tag + restart stack ---
                        sh """
                            ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_HOST} bash -s << 'REMOTE_SCRIPT'
                            set -e

                            echo "${REGISTRY_TOKEN}" | docker login ${REGISTRY_URL} -u "${REGISTRY_USER}" --password-stdin

                            cd ${PROD_APP_DIR}

                            # Truyền SHA tag vào compose.
                            # docker-compose.prod.yml phải dùng biến này:
                            #   image: .../backend:\${BACKEND_TAG:-latest}
                            #   image: .../frontend:\${FRONTEND_TAG:-latest}
                            export BACKEND_TAG=${IMAGE_TAG}
                            export FRONTEND_TAG=${IMAGE_TAG}

                            # Kéo đúng image theo SHA tag
                            docker compose -f docker-compose.prod.yml pull

                            # Restart stack, giữ nguyên service không thay đổi
                            docker compose -f docker-compose.prod.yml up -d --remove-orphans

                            # Dọn image không còn được tham chiếu bởi bất kỳ container nào
                            # (image có SHA tag vẫn được giữ lại để rollback)
                            docker image prune -f

                            docker logout ${REGISTRY_URL}
REMOTE_SCRIPT
                        """
                    }
                }
            }
        }

        // =====================================================================
        // SMOKE TEST – Health check sau deploy
        // =====================================================================
        stage('Smoke Test') {
            when { expression { return env.BACKEND_CHANGED == 'true' } }
            steps {
                sleep(time: 15, unit: 'SECONDS')
                sh """
                    curl -sf --retry 5 --retry-delay 5 \
                        http://${PROD_HOST}:3000/health \
                    && echo "✅ Backend health check: PASS" \
                    || (echo "❌ Backend health check: FAIL" && exit 1)
                """
            }
        }

    } // end stages

    // =========================================================================
    // POST ACTIONS
    // =========================================================================
    post {
        always {
            script {
                try {
                    // Dọn cả 2 tag trên Agent sau khi pipeline kết thúc
                    if (env.BACKEND_CHANGED == 'true') {
                        sh "docker rmi ${IMAGE_BACKEND}:${IMAGE_TAG} ${IMAGE_BACKEND}:latest --force 2>/dev/null || true"
                    }
                    if (env.FRONTEND_CHANGED == 'true') {
                        sh "docker rmi ${IMAGE_FRONTEND}:${IMAGE_TAG} ${IMAGE_FRONTEND}:latest --force 2>/dev/null || true"
                    }
                    sh "docker logout ${REGISTRY_URL} 2>/dev/null || true"
                } catch (Exception e) {
                    echo "Cleanup warning: ${e.message}"
                }
            }
        }
        success {
            echo """
✅ Pipeline THÀNH CÔNG
   Build     : #${BUILD_NUMBER}
   Image Tag : ${env.IMAGE_TAG}
   Backend   : ${env.BACKEND_CHANGED  == 'true' ? "Deployed ✓  (${IMAGE_BACKEND}:${env.IMAGE_TAG})" : 'Skipped'}
   Frontend  : ${env.FRONTEND_CHANGED == 'true' ? "Deployed ✓  (${IMAGE_FRONTEND}:${env.IMAGE_TAG})" : 'Skipped'}
            """
        }
        failure {
            echo """
❌ Pipeline THẤT BẠI
   Build     : #${BUILD_NUMBER}
   Image Tag : ${env.IMAGE_TAG}
   → Xem Console Output để biết chi tiết.
            """
        }
        unstable {
            echo "⚠️  Pipeline UNSTABLE – kiểm tra lại test suite."
        }
    }
}