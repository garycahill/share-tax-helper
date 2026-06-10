# Share Tax Helper (Ireland Form 11 Compliance)

Desktop Electron application engineered to convert historical multi-lot stock plan transactions (RSU / ESPP) into precise Euro calculations for Irish Revenue compliance. It matches daily transactional records with the live historical exchange rate feeds of the European Central Bank (ECB) and outputs a visual field mapping guide designed for the **ROS Form 11** portal.

---

## 📥 Direct Downloads

Skip the terminal and configuration steps. Download the ready-to-run installer for your operating system directly from our secure build pipeline:

[![Download for Windows](https://img.shields.io/badge/Download-Windows__EXE-0078d7?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/garycahill/share-tax-helper/releases/download/v1.0.0/Share+Tax+Helper+Setup+1.0.0.exe)
[![Download for macOS](https://img.shields.io/badge/Download-macOS__DMG-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/garycahill/share-tax-helper/releases/download/v1.0.0/Share+Tax+Helper-1.0.0.dmg)

*Note: On launch, you must review and accept the legal liability disclaimer module before processing any data files.*

---

## ⚠️ Important Legal Disclaimer
**This application is provided completely "as-is", without warranties or guarantees of accuracy, completeness, or regulatory compliance.** Tax laws regarding equity vestings, sell-to-cover metrics, and capital gains are complex and subject to modification. The outputs, data guides, and mockups produced by this utility are for informational guidance and reference only and do not constitute formal financial, legal, or tax advice. You remain entirely responsible for the parameters filed in your tax declarations. It is strongly recommended that you consult a qualified tax advisor or certified public accountant before submitting any official tax returns.

---

## Key Features
* **Automatic Tax Window Separation:** Uses deterministic file signatures to automatically distinguish `Sell to Cover (Tax)` actions from user-initiated `Manual Sales`.
* **Historical Exchange Rate Integration:** Pulls precise historical exchange rates on the exact dates of both vesting and liquidation via the European Central Bank (ECB) feed.
* **Anti-Encroachment Layout UI:** Designed for varying laptop display matrices with an adjustable, collapsible instructional interface panel to maximize screen layout space.
* **ROS Form 11 Data Guide Mockup:** Features a click-to-open summary canvas mapping calculations directly to the layout numbers of **Panel L (Capital Gains)** and **Panel P (Self-Assessment)** inside the Revenue Online Service portal.

---

## How to Get Your Data from E*TRADE

To compute compliant capital gains, the app requires granular, row-by-row cost basis specification from your statement profile. Follow these steps to pull your file:

1. Log into your E*TRADE account profile in a web browser.
2. Click on your corporate equity dashboard then navigate to **My Account > Gains & Losses** tab.
3. Filter by your target **Tax Year** dropdown selection and hit **Apply**.
4. Locate the **Download** link interface dropdown situated on the right side.
5. Select **Download Expanded** *(Crucial: do not select collapsed! The system needs the underlying individual share lot records to process calculations).*

---

## Installation, Local Execution & Compilation

Follow these procedures to clone the raw repository files to run locally or re-compile installer packages from scratch.

### 1. Prerequisite Environment Setup
Ensure you have downloaded and installed [Node.js](https://nodejs.org/) on your local machine.

### 2. Project Initialisation
Clone the repository files via terminal and fetch the underlying third-party package dependencies (`xlsx`, `axios`, etc.):
```bash
git clone [https://github.com/garycahill/share-tax-helper.git](https://github.com/garycahill/share-tax-helper.git)
cd share-tax-helper
npm install