# VeriDocs 🔍

## Automated Digital Document Forensics & Forgery Risk Detection

VeriDocs is a full-stack document forensic analysis system designed to identify potential signs of digital document manipulation.

Instead of relying only on the visual appearance of a document, VeriDocs examines its underlying digital structure and forensic signals to provide an explainable risk assessment.

## 🎯 Problem

Digitally modified documents such as invoices, certificates, contracts, and financial documents can appear authentic during normal visual inspection.

VeriDocs aims to assist human reviewers by identifying structural and metadata anomalies that may require further investigation.

## 💡 Solution

VeriDocs analyzes uploaded documents using multiple forensic signals, including:

- PDF metadata
- Document structure
- Font references
- Embedded objects
- Image-related signals
- JavaScript/action indicators
- File hash
- Structural anomalies

The detected signals are combined into an explainable forensic risk assessment.

## 🚀 Features

- Drag-and-drop document upload
- PDF forensic analysis
- SHA-256 file fingerprinting
- Metadata inspection
- PDF structural analysis
- Font analysis
- Suspicious object detection
- Risk scoring
- Explainable findings
- Forensic report generation
- Synthetic demonstration documents
- Modern web dashboard

## 🏗️ Architecture

```text
User
 │
 ▼
React Frontend
 │
 ▼
Node.js / Express Backend
 │
 ▼
Forensic Analysis Engine
 │
 ├── File Hash Analysis
 ├── Metadata Analysis
 ├── PDF Structure Analysis
 ├── Font Analysis
 └── Anomaly Detection
 │
 ▼
Forensic Risk Assessment
 │
 ▼
Detailed Report
