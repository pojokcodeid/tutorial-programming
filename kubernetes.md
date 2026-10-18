# Kubernetes Mastery Roadmap (Podman Edition)

## Overview
This document provides a comprehensive, step-by-step curriculum to master Kubernetes (K8s) from scratch (Level 0) to advanced levels using **Podman** as the underlying container engine. 

It is formatted as a structured specification suitable for consumption by both human learners and AI agents.

---

## Technical Environment Baseline
* **Container Engine:** Podman (Rootless/Daemonless)
* **Local Cluster Provider:** Minikube (Podman Driver) or Kind (Kubernetes in Podman)
* **Control Tooling:** `kubectl`, `helm`, `k9s`

---

## Phase 1: Containerization Fundamentals with Podman
*Prerequisite phase to establish container mastery before orchestration.*

### 1.1 Core Container Concepts
- Virtual Machines (VMs) vs. Containers.
- Container Images, Layers, Registries, and Storage Volumes.
- Process isolation: Namespaces, cgroups, and capabilities.

### 1.2 Podman CLI Mastery
- Basic commands: `podman run`, `podman ps`, `podman logs`, `podman exec`.
- Image management: `podman pull`, `podman build`, `podman push`.
- Local networking and volume management in Podman.

### 1.3 Native Podman-K8s Bridge Features
- Podman Pods (`podman pod create`, `podman pod start`).
- Declarative export: `podman generate kube` (generate K8s manifest from local pods).
- Local execution: `podman play kube` (execute K8s manifests directly in Podman).

---

## Phase 2: Local Kubernetes Environment Setup
*Configuring local development environments with Podman as the runtime.*

### 2.1 Cluster Provisioning
- **Minikube with Podman:**
  ```bash
  minikube start --driver=podman
  ```
- **Kind (Kubernetes in Docker/Podman):**
  - Configure rootless cgroups v2 requirements for Kind under Podman.
- **K3s / MicroK8s:** Alternative lightweight clusters.

### 2.2 CLI Tooling & Operations
- `kubectl` configuration (`~/.kube/config`).
- Context & Namespace management (`kubectx`, `kubens`).
- Terminal User Interfaces (`k9s`).

---

## Phase 3: Core Kubernetes Objects & Concepts
*Understanding the primary building blocks of Kubernetes workloads.*

### 3.1 Pods
- Pod architecture and lifecycle.
- Single-container vs. Multi-container patterns (Sidecar, Adapter, Ambassador).
- Manifest structure and API versions.

### 3.2 Workload Controllers
- **ReplicaSet:** Desired state management and self-healing.
- **Deployment:** Zero-downtime rollouts, rollbacks, and scaling for stateless apps.
- **StatefulSet:** Stable network IDs and persistent storage for stateful workloads.
- **DaemonSet:** Running node-level agents (logging, monitoring).
- **Jobs & CronJobs:** Batch execution and scheduled workloads.

### 3.3 Configuration & Data Injection
- **ConfigMaps:** Decoupling configuration from container images.
- **Secrets:** Base64-encoded/encrypted sensitive data (Opaque, TLS, docker-registry).

---

## Phase 4: Networking & Storage (Intermediate)
*Managing internal/external network traffic and persistent data.*

### 4.1 Kubernetes Networking Model
- Cluster IP allocation per Pod.
- **Service Types:**
  - `ClusterIP`: Internal pod-to-pod communication.
  - `NodePort`: Exposing services on static ports on each Node.
  - `LoadBalancer`: Integration with cloud providers or local load balancers (MetalLB).

### 4.2 Traffic Routing & Ingress
- Ingress Controllers (NGINX Ingress, Traefik).
- Path-based and Host-based HTTP/HTTPS routing.
- Automated TLS certificates with **cert-manager** and Let's Encrypt.

### 4.3 Storage Abstraction
- Ephemeral vs. Persistent Volumes.
- **PersistentVolume (PV)** and **PersistentVolumeClaim (PVC)** lifecycle.
- **StorageClasses:** Dynamic volume provisioning.

---

## Phase 5: Resource Management, Scaling & Reliability
*Ensuring application health, stability, and elasticity.*

### 5.1 Resource Allocation & QoS
- Configuring CPU and Memory `requests` and `limits`.
- Quality of Service (QoS) classes: `Guaranteed`, `Burstable`, `BestEffort`.

### 5.2 Application Health Probes
- **Liveness Probes:** Restarting unhealthy containers.
- **Readiness Probes:** Controlling traffic routing to ready containers.
- **Startup Probes:** Handling legacy or slow-starting applications.

### 5.3 Autoscaling Mechanisms
- **Horizontal Pod Autoscaler (HPA):** Scaling replica count based on CPU/RAM or custom metrics.
- **Vertical Pod Autoscaler (VPA):** Dynamically tuning CPU/Memory requests.

### 5.4 Cluster Operations & Maintenance
- Node maintenance: `kubectl cordon`, `kubectl drain`, `kubectl uncordon`.
- Deployment strategies: RollingUpdate vs. Recreate.

---

## Phase 6: Security, Access Control & Multi-Tenancy
*Hardening Kubernetes cluster security and access governance.*

### 6.1 Multi-Tenancy & Isolation
- Logical isolation using **Namespaces**.
- Resource Quotas and LimitRanges per namespace.

### 6.2 Role-Based Access Control (RBAC)
- Subjects: Users, Groups, and ServiceAccounts.
- Resources: `Roles`, `ClusterRoles`, `RoleBindings`, `ClusterRoleBindings`.

### 6.3 Network Security
- **NetworkPolicies:** Defining ingress/egress firewall rules for Pods.

### 6.4 Pod Security Standards (PSS) & Rootless Alignment
- Pod Security Admission levels: `Privileged`, `Baseline`, `Restricted`.
- Non-root execution (`runAsNonRoot: true`, `readOnlyRootFilesystem`).
- Aligning Podman's rootless paradigm with Kubernetes security best practices.

---

## Phase 7: Production Ecosystem & Advanced Operations
*Enterprise-ready tools and GitOps methodologies.*

### 7.1 Package Management
- **Helm:** Packaging, templating, release management, and repository usage.

### 7.2 GitOps & Continuous Delivery (CD)
- Declarative infrastructure and application state synchronization using **ArgoCD** or **FluxCD**.

### 7.3 Observability & Monitoring
- **Metrics:** Prometheus & Grafana stack (Prometheus Operator).
- **Logging:** PLG Stack (Promtail, Loki, Grafana) or EFK (Elasticsearch, Fluentd, Kibana).

### 7.4 Service Mesh (Advanced)
- **Istio** / **Linkerd:** Dynamic traffic management, automatic mTLS encryption, and distributed tracing.

---

## Recommended Hands-On Learning Sequence

1. **Step 1:** Run a local web container in Podman, then export it via `podman generate kube web.yaml`.
2. **Step 2:** Spin up Minikube using Podman: `minikube start --driver=podman`.
3. **Step 3:** Deploy the exported `web.yaml` into Minikube using `kubectl apply -f web.yaml`.
4. **Step 4:** Convert the basic Pod manifest into a full `Deployment` and `Service` setup.
5. **Step 5:** Install `k9s` to monitor and manage cluster resources visually from the terminal.