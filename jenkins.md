# Jenkins CI/CD Mastery Roadmap (Zero to Advanced)

## Overview

This roadmap provides a complete, structured curriculum to master **Jenkins** for Continuous Integration and Continuous Delivery (CI/CD). Designed for local simulation using **Podman** and free tools, it transitions a learner from basic automation concepts to enterprise-grade pipeline architecture.

---

## Technical Baseline & Local Setup

* **Local Environment:** Podman (Rootless Container Engine)
* **Jenkins Image:** `jenkins/jenkins:lts-jdk17`
* **Source Control:** GitHub / GitLab (Free Tier) / Local Git Repositories
* **Target Workloads:** Docker/Podman Containers, Node.js/Python/Go applications

---

## Phase 1: CI/CD Fundamentals & Environment Setup

*Understanding core DevOps concepts and provisioning a local Jenkins instance.*

### 1.1 Core Concepts
* What is Continuous Integration (CI) and Continuous Deployment/Delivery (CD)?
* Jenkins architecture: Controller (Master) vs. Agents (Nodes/Executors).
* Differences between traditional build automation and Pipeline-as-Code.

### 1.2 Local Jenkins Provisioning with Podman
* Running Jenkins in a containerized environment:
  ```bash
  podman run -d \
    --name jenkins-server \
    -p 8080:8080 -p 50000:50000 \
    -v jenkins_home:/var/jenkins_home \
    jenkins/jenkins:lts-jdk17
  ```
* Post-installation setup: Unlocking Jenkins, installing suggested plugins, creating admin credentials.
* Managing persistent storage and backing up `JENKINS_HOME`.

---

## Phase 2: Jenkins Administration & Basic Operations

*Navigating the Jenkins UI and managing core configuration options.*

### 2.1 UI Overview & Plugin Management
* Exploring the Dashboard, Build History, and Manage Jenkins section.
* Installing, updating, and troubleshooting plugins (Git, Credentials Plugin, Pipeline).

### 2.2 Security & Access Management
* Managing Jenkins Users and Groups.
* Understanding Authentication & Authorization strategies (Matrix-based security, Role-based Access Control / RBAC).
* Using the **Credentials Manager** safely (SSH Keys, Username/Password, Secret Text, Certificates).

### 2.3 Legacy Workloads: Freestyle Jobs
* Creating basic Freestyle projects.
* Configuring Source Code Management (SCM) triggers.
* Defining Build Steps (Execute Shell / Windows Batch) and Post-build Actions.
* *Understanding why Freestyle jobs are legacy and transitioning to Pipelines.*

---

## Phase 3: Pipeline as Code (Declarative & Scripted)

*Mastering the modern Jenkins pipeline syntax stored directly in Git (`Jenkinsfile`).*

### 3.1 Declarative Pipeline Syntax
* Anatomi `Jenkinsfile`: `pipeline`, `agent`, `stages`, `stage`, `steps`.
* Post-actions: `always`, `success`, `failure`, `changed`.
* Environment variables (`environment` block) and parameters (`parameters` block).

### 3.2 Scripted Pipeline Syntax
* Understanding Groovy DSL basics.
* Control structures (`if/else`, `try/catch`, loops).
* When to use Scripted vs. Declarative syntax.

### 3.3 Advanced Pipeline Logic
* Parallel stage execution (`parallel` block).
* Conditional stage execution (`when` directive).
* Input prompts (`input` step) for manual approval steps (e.g., Staging to Production deployment).

---

## Phase 4: SCM Integration & Automated Triggers

*Connecting Jenkins to external code repositories for continuous execution.*

### 4.1 Git & Webhook Integration
* Connecting Jenkins to GitHub/GitLab via SSH keys and Access Tokens.
* Setting up Webhooks for automatic build triggers on `git push` or `pull request`.
* Multibranch Pipelines: Automatic discovery and execution of `Jenkinsfile` across all repository branches.

### 4.2 Pull Request Validation
* PR checks and status reports sent back to GitHub/GitLab.
* Merge gate automation based on test/build status.

---

## Phase 5: Distributed Builds & Containerized Agents

*Scaling Jenkins execution beyond a single controller node.*

### 5.1 Static Node Architecture
* Adding external agent nodes via SSH or Inbound Agents (JNLP).
* Using Labels to route specific tasks to target nodes (e.g., `agent { label 'linux-builder' }`).

### 5.2 Dynamic Containerized Agents (Podman / Docker)
* Running builds inside ephemeral containers to isolate build environments.
* Configuring Jenkins to dynamically launch container pods for single build jobs.
* Building container images inside Jenkins (Docker-in-Docker / Podman execution patterns).

---

## Phase 6: Enterprise Features, Shared Libraries & Security

*Refactoring pipelines for modularity, reusability, and production hardening.*

### 6.1 Shared Libraries (Groovy)
* Structuring a global Shared Library repository (`vars/`, `src/`).
* Creating reusable custom steps and standardized corporate pipeline templates.
* Versioning shared libraries.

### 6.2 Hardening & Compliance
* Content Security Policy (CSP) configuration.
* Script Approval and Groovy sandbox safety.
* Audit trail logging and security scanning for plugins.

### 6.3 Backup & Disaster Recovery
* Backing up configuration via **ThinBackup** or Git-based configuration backup tools (Configuration as Code / JCasC).
* **Jenkins Configuration as Code (JCasC):** Provisioning entire Jenkins instances declaratively using YAML.

---

## Phase 7: Production CI/CD Ecosystem Integration

*Integrating Jenkins into the wider cloud-native toolchain.*

### 7.1 Integration Scenarios
* **Testing:** JUnit, SonarQube (Static Code Analysis), OWASP Dependency-Check.
* **Artifact Management:** Nexus, JFrog Artifactory, Container Registries (Docker Hub, Quay, Harbor).
* **CD & GitOps:** Triggering deployments via **ArgoCD**, **Helm**, or deployment scripts to Kubernetes clusters.
* **Notification Systems:** Slack, Microsoft Teams, Email notifications.

---

## Recommended Practice Projects

1. **Project 1: Basic Web App Pipeline**
   * Repo containing a simple application (Node.js/Python).
   * `Jenkinsfile` that runs unit tests, builds a Podman container, and tags the release.
2. **Project 2: Multibranch Microservice CI/CD**
   * Configured Multibranch Pipeline with automated Webhooks.
   * Feature branches run tests; `main` branch builds containers and pushes them to a local container registry.
3. **Project 3: End-to-End GitOps Integration**
   * Jenkins runs tests and updates a manifest repository upon successful build.
   * ArgoCD or Kubernetes applies the updated manifest automatically to a local Minikube/Kind cluster.