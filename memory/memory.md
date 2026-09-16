# CloudPulse Unified Memory Log
*(Last Updated: 2026-08-06)*

This document serves as the single source of truth and ongoing memory of the architecture, refactoring, and optimizations performed on the CloudPulse codebase.

## 1. Project Overview & Decisions
- **Project Name:** `cloud-pulse-topology-module`
- **Purpose:** A new interactive visualizer for mapping complex cloud infrastructure graphs and resource relationships.

## 2. Chronological Progress & Optimizations

### September 16, 2026 (Topology Module: Deep EKS Discovery & Graph Layout Polish)
#### Backend: Authentic EKS Hierarchy Construction
- **Boto3 EKS API Integration:** Refactored `topology_service.py` away from generic EC2-tag guessing. It now directly queries `list_clusters` and `list_nodegroups`, successfully mapping native AWS Auto Scaling Groups as intermediate Node Groups between EKS Clusters and EC2 instances.
- **Deep JSON Reconstruction:** The backend API endpoint now actively nests and serves a deep 3-tier hierarchy (`EKSCluster` -> `EKSNodeGroup` -> `EC2 Instances`) directly to the frontend, while the local SQLite database cleanly flattens it on upsert to maintain fast persistent caching.
- **SQLite Concurrency Fix:** Wrapped the `PRAGMA journal_mode=WAL` checkout in `Workspace-main/backend/app/core/database.py` in a safe try-except block to completely prevent `database is locked` crashes when asyncio threads violently check out concurrent connections.

#### Frontend: Recursive Tree & UI Renderer 
- **Recursive Sidebar:** Completely overhauled the `ComputeResourcesSidebar.jsx` hardcoded two-level loop into a true recursive `renderRecursive()` engine, effortlessly rendering an infinitely nested infrastructure folder tree (e.g., EKS master folders -> Node Group subfolders -> worker nodes).
- **Target Group Diagnostic Tab Polish:** Corrected a false-positive in `ResourceDetailModal.jsx` where the red `CRITICAL` blinking indicator pointed to a placeholder "Diagnostics" tab. Repointed the `animate-ping` alert to properly sit on the `Overview` tab where grouped diagnostic payloads are actually rendered.

#### Architecture Visualizer: Spaghetti-Routing Fixes
- **Dagre Layout Rotation:** Discovered that Dagre's default Top-to-Bottom (`TB`) layout naturally forced perfectly vertical node alignments to pierce each other with overlapping paths. Rotated the entire engine 90 degrees to Left-to-Right (`LR`), instantly generating a clean, standard AWS infrastructure map.
- **Dynamic Handle Alignment:** Discovered and fixed a massive layout conflict where the visualizer was routing Left-to-Right, but `TopologyNode.jsx` Handles were permanently hardcoded to `Position.Top` and `Position.Bottom`, forcing React Flow to awkwardly wrap Bezier paths completely around the nodes. Dynamic `targetPosition` and `sourcePosition` props were bound, achieving flawless straight-through paths.
- **Parallel Edge Offset Routing:** Engineered dynamic edge counting to calculate horizontal/vertical offsets for parallel paths (e.g., multiple connections between a Target Group and EC2s), gracefully separating them side-by-side using `getBezierPath` instead of layering them "one upon one".

#### Detail Modal Bug Fixes & Redesign Plan
- **Resource Details Unreachable Code Fix:** Discovered and fixed a major structural bug in `ResourceDetailModal.jsx` where a malformed ternary operator placed the resource properties (Tags, Analytics, Configuration & Networking) inside an unreachable fallback block. Now all AWS resource metadata properly renders in the Overview tab.
- **Pending (Next Session):** The user approved a complete UI/UX redesign of the `ResourceDetailModal` to use a sleek, narrow right-side glassmorphism panel with modern tab navigation, clean cards for metadata, and a custom vertical timeline for data flow. This work has been scoped into `task.md` and will be executed tomorrow.
