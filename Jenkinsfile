pipeline {
    agent { label 'docker-build' }

    environment {
        AWS_REGION = 'us-east-1'
        REG        = '415642395658.dkr.ecr.us-east-1.amazonaws.com'
    }

    stages {
        stage('ECR login') {
            steps {
                sh 'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REG'
            }
        }

        stage('Build & Push') {
            parallel {
                stage('Backend') {
                    steps {
                        sh '''
                            docker build -t $REG/back-end-booking:$BUILD_NUMBER -t $REG/back-end-booking:latest backend
                            docker push $REG/back-end-booking:$BUILD_NUMBER
                            docker push $REG/back-end-booking:latest
                        '''
                    }
                }
                stage('Frontend') {
                    steps {
                        sh '''
                            docker build -t $REG/front-end-booking:$BUILD_NUMBER -t $REG/front-end-booking:latest frontend
                            docker push $REG/front-end-booking:$BUILD_NUMBER
                            docker push $REG/front-end-booking:latest
                        '''
                    }
                }
            }
        }

        // Task definitions point at :latest, so a forced redeploy pulls the new image.
        stage('Deploy ECS') {
            steps {
                sh '''
                    aws ecs update-service --region $AWS_REGION --cluster back-end-booking \
                      --service back-end-booking-service-ct3j5h27 --force-new-deployment > /dev/null
                    aws ecs update-service --region $AWS_REGION --cluster front-end-booking \
                      --service front-end-booking-service-gajh4x8c --force-new-deployment > /dev/null
                    aws ecs wait services-stable --region $AWS_REGION --cluster back-end-booking --services back-end-booking-service-ct3j5h27
                    aws ecs wait services-stable --region $AWS_REGION --cluster front-end-booking --services front-end-booking-service-gajh4x8c
                '''
            }
        }
    }

    post {
        always { cleanWs() }
    }
}
