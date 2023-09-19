export NAMESPACE="sofa-shop-nodejs"
export DB_HOST="mysql-svc.mysql.svc.cluster.local"
export DB_USERNAME="c2VydmljZV91c2Vy"
export DB_PASSWORD="cGFzc3RmOQ=="

kubectl create namespace ${NAMESPACE}

thisDir=$(pwd)
envsubst < ${thisDir}/inventory/k8s/app-configmap_template.yaml > ${thisDir}/inventory/k8s/app-configmap.yaml
envsubst < ${thisDir}/inventory/k8s/db-secrets_template.yaml > ${thisDir}/inventory/k8s/db-secrets.yaml

envsubst < ${thisDir}/order/k8s/app-configmap_template.yaml > ${thisDir}/order/k8s/app-configmap.yaml
envsubst < ${thisDir}/order/k8s/db-secrets_template.yaml > ${thisDir}/order/k8s/db-secrets.yaml

envsubst < ${thisDir}/product/k8s/app-configmap_template.yaml > ${thisDir}/order/k8s/app-configmap.yaml
envsubst < ${thisDir}/product/k8s/db-secrets_template.yaml > ${thisDir}/order/k8s/db-secrets.yaml

kubectl apply -k ${thisDir}/inventory/k8s -n ${NAMESPACE}
kubectl apply -k ${thisDir}/order/k8s -n ${NAMESPACE}
kubectl apply -k ${thisDir}/product/k8s -n ${NAMESPACE}
