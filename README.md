# Share Tax Helper (Ireland Form 11 Compliance)

Desktop Electron application engineered to convert historical multi-lot stock plan transactions (RSU / ESPP) into precise Euro calculations for Irish Revenue compliance. It matches daily transactional records with the live historical exchange rate feeds of the European Central Bank (ECB) and outputs a visual field mapping guide designed for the **ROS Form 11** portal.

---

## ⚠️ Important Legal Disclaimer
**This application is provided completely "as-is", without warranties or guarantees of accuracy, completeness, or regulatory compliance.** Tax laws regarding equity vestings, sell-to-cover metrics, and capital gains are complex and subject to modification. The outputs, data guides, and mockups produced by this utility are for informational guidance and reference only and do not constitute formal financial, legal, or tax advice. You remain entirely responsible for the parameters filed in your tax declarations. It is strongly recommended that you consult a qualified tax advisor or certified public accountant before submitting any official tax returns.

---

## Key Features
* **Automatic Tax Window Separation:** Uses deterministic file signatures to automatically distinguish `Sell to Cover (Tax)` actions from user-initiated `Manual Sales`.
* **Historical Exchange Rate Integration:** Pulls precise historical exchange rates on the exact dates of both vesting and liquidation via the European Central Bank (ECB) feed.
* **Anti-Encroachment layout UI:** Designed for varying laptop display matrices with an adjustable, collapsible instructional interface panel to maximize screen layout space.
* **ROS Form 11 Data Guide Mockup:** Features a click-to-open summary canvas mapping calculations directly to the layout numbers of **Panel L (Capital Gains)** and **Panel P (Self-Assessment)** inside the Revenue Online Service portal.

---

## How to Get Your Data from E*TRADE

To compute compliant capital gains, the app requires granular, row-by-row cost basis specification from your statement profile. Follow these steps to pull your file:

1. Log into your standard **E*TRADE** account profile inside a web browser.
2. Click on your active **"Stock Plan"** dashboard link, then navigate to **My Account > Gains & Losses** tab.
3. Select your target **Tax Year** from the drop-down selection parameters and click **Apply**.
4. Locate the **Download** link dropdown interface on the right side of the ledger block.
5. Choose **Download Expanded** *(Crucial: Do not select collapsed! The system needs the underlying individual share lot records to process calculations).*

---

## Installation & Local Execution

To run this application locally from source code repository files, make sure you have [Node.js](https://nodejs.org/) installed, then execute the following terminal sequences:

1. **Clone the Repository Files:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/share-tax-helper.git](https://github.com/YOUR_USERNAME/share-tax-helper.git)
   cd share-tax-helper