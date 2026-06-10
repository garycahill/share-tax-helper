const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const XLSX = require('xlsx');

let mainWindow;
let currentCalculatedRecords = [];

function cleanValue(val) {
    if (!val) return 0;
    return parseFloat(val.toString().replace(/[\$\",\s]/g, '')) || 0;
}

function parseCSVLine(line, separator) {
    if (separator === '\t') {
        return line.split('\t').map(c => c.trim().replace(/^"|"$/g, ''));
    }
    const csvRegex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
    const matches = line.match(csvRegex);
    if (!matches) {
        return line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    }
    return matches.map(c => c.trim().replace(/^"|"$/g, ''));
}

async function fetchExchangeRate(dateString) {
    const parts = dateString.split('/');
    if (parts.length !== 3) return 0.9230; 
    const formattedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    const url = `https://api.frankfurter.app/${formattedDate}?from=USD&to=EUR`;
    try {
        const response = await axios.get(url, { timeout: 5000 });
        if (response.data && response.data.rates && response.data.rates.EUR) {
            return response.data.rates.EUR;
        }
        return 0.9230; 
    } catch (e) {
        return 0.9230; 
    }
}

ipcMain.on('get-live-stock-price', async (event) => {
    try {
        const res = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/MDB', { timeout: 4000 });
        const price = res.data.chart.result[0].meta.regularMarketPrice;
        if (price) {
            event.reply('live-stock-price-response', price.toFixed(2));
            return;
        }
        event.reply('live-stock-price-response', "UNAVAILABLE"); 
    } catch (e) {
        event.reply('live-stock-price-response', "UNAVAILABLE"); 
    }
});

ipcMain.on('process-excel-buffer', (event, arrayBuffer) => {
    try {
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        ipcMain.emit('process-custom-csv-text', event, csvContent);
    } catch (e) {
        mainWindow.webContents.send('processing-error');
        dialog.showErrorBox("Error Processing Excel File", `Failed to parse Excel Workbook: ${e.message}`);
    }
});

ipcMain.on('process-custom-csv-text', async (event, rawContent) => {
    try {
        if (!rawContent || rawContent.length < 10) {
            throw new Error("File formatting appears empty or unreadable.");
        }
        const cleanRawContent = rawContent.replace(/^\uFEFF/, '');
        const freshLines = cleanRawContent.split(/\r?\n/).map(l => l.trim());
        let headerIndex = -1;
        let separator = ','; 

        for (let i = 0; i < freshLines.length; i++) {
            const currentLine = freshLines[i];
            if (!currentLine) continue;
            const testSeparator = currentLine.includes('\t') ? '\t' : ',';
            const testHeaders = currentLine.split(testSeparator).map(h => 
                h.toLowerCase().replace(/[^a-z0-9\s\(\)\=\/]/g, '').trim()
            );
            if (testHeaders.some(h => h.includes("record type")) || testHeaders.some(h => h.includes("date sold"))) {
                headerIndex = i;
                separator = testSeparator;
                break;
            }
        }

        if (headerIndex === -1) {
            throw new Error("Could not trace standardized E*TRADE 'Record Type' or 'Date Sold' column fields inside this text layout.");
        }

        const rawHeaders = freshLines[headerIndex].split(separator).map(h => 
            h.toLowerCase().replace(/[^a-z0-9\s\(\)\=\/]/g, '').trim()
        );

        const idxRecType = rawHeaders.findIndex(h => h.includes("record type"));
        const idxQty = rawHeaders.findIndex(h => h.includes("quantity"));
        const idxDateAcq = rawHeaders.findIndex(h => h.includes("date acquired") && !h.includes("wash sale"));
        const idxCostBasis = rawHeaders.findIndex(h => h.includes("adjusted cost basis"));
        const idxDateSold = rawHeaders.findIndex(h => h.includes("date sold"));
        const idxProceeds = rawHeaders.findIndex(h => h.includes("total proceeds"));
        const idxProceedsShare = rawHeaders.findIndex(h => h.includes("proceeds per share"));
        const idxOrderType = rawHeaders.findIndex(h => h.includes("order type"));

        if (idxRecType === -1 || idxDateSold === -1 || idxOrderType === -1 || idxProceedsShare === -1) {
            throw new Error("Failed to map index layout for tracking required column keys. Ensure 'Order Type' and 'Proceeds Per Share' are included.");
        }

        const rowsToProcess = [];
        for (let i = headerIndex + 1; i < freshLines.length; i++) {
            if (!freshLines[i]) continue;
            let columns = parseCSVLine(freshLines[i], separator);
            const recordTypeVal = columns[idxRecType] ? columns[idxRecType].toLowerCase().trim() : '';
            if (recordTypeVal.includes("sell")) {
                rowsToProcess.push(columns);
            }
        }

        if (rowsToProcess.length === 0) {
            throw new Error("No rows matching 'Sell' were discovered.");
        }

        const finalCompiledRecords = [];
        
        for (let i = 0; i < rowsToProcess.length; i++) {
            const columns = rowsToProcess[i];
            const currentProgressPercent = Math.min(95, Math.floor(((i + 1) / rowsToProcess.length) * 90) + 5);

            mainWindow.webContents.send('progress-tick', {
                title: `Processing lot ${i + 1} of ${rowsToProcess.length}...`,
                details: `Querying ECB Exchange indices for sales date: ${columns[idxDateSold] || 'Unknown'}`,
                percent: currentProgressPercent
            });

            const dateAcquired = columns[idxDateAcq] ? columns[idxDateAcq].trim() : '';
            const dateSold = columns[idxDateSold] ? columns[idxDateSold].trim() : '';
            if (!dateAcquired || !dateSold) continue;

            const fxRateVest = await fetchExchangeRate(dateAcquired);
            const fxRateSale = await fetchExchangeRate(dateSold);
            
            const costBaseUsd = cleanValue(columns[idxCostBasis]);
            const proceedsUsd = cleanValue(columns[idxProceeds]);
            const salePricePriceUsd = cleanValue(columns[idxProceedsShare]);
            const qty = parseInt(columns[idxQty]) || 0;

            const vestPricePerShareUsd = qty > 0 ? (costBaseUsd / qty) : 0;
            const costBaseEur = costBaseUsd * fxRateVest;
            const proceedsEur = proceedsUsd * fxRateSale;
            const gainEur = proceedsEur - costBaseEur;
            const rawOrderType = columns[idxOrderType] ? columns[idxOrderType].trim() : '';
            
            let planLabel = "RSU";
            let saleContext = "Manual Sale";

            if (rawOrderType === "RS STC") {
                planLabel = "RSU";
                saleContext = "Sell to Cover (Tax)";
            } else if (rawOrderType === "Sell Restricted Stock") {
                planLabel = "RSU";
                saleContext = "Manual Sale";
            } else if (rawOrderType === "ESPP STC") {
                planLabel = "ESPP";
                saleContext = "Sell to Cover (Tax)";
            } else if (rawOrderType === "Sell ESPP") {
                planLabel = "ESPP";
                saleContext = "Manual Sale";
            } else {
                planLabel = rawOrderType.toUpperCase().includes("ESPP") ? "ESPP" : "RSU";
                saleContext = rawOrderType.toUpperCase().includes("STC") ? "Sell to Cover (Tax)" : "Manual Sale";
            }

            finalCompiledRecords.push({
                date: dateSold, 
                type: planLabel,          
                context: saleContext,     
                qty: qty,
                vestPriceUsd: vestPricePerShareUsd.toFixed(2),
                salePriceUsd: salePricePriceUsd.toFixed(2),
                costBaseEur: costBaseEur.toFixed(2), 
                fxVest: fxRateVest.toFixed(4),
                proceedsEur: proceedsEur.toFixed(2), 
                fxSale: fxRateSale.toFixed(4),
                gainEur: gainEur.toFixed(2)
            });
        }

        currentCalculatedRecords = finalCompiledRecords;
        computeTotalsAndRender();
        
        // Native Windows message dialog completely removed from this execution line block
        mainWindow.webContents.send('progress-tick', { title: "Rendering calculations...", details: "Building ledger map matrix structures...", percent: 100 });

    } catch (e) {
        mainWindow.webContents.send('processing-error');
        dialog.showErrorBox("Error Processing File Layout", `Error details: ${e.message}`);
    }
});

function createWindow() {
    mainWindow = new BrowserWindow({
        show: false,                 
        backgroundColor: '#0a1120',   
        resizable: true,
        autoHideMenuBar: true, 
        webPreferences: { 
            nodeIntegration: true, 
            contextIsolation: false 
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.maximize(); 
        mainWindow.show();
    });
}

function computeTotalsAndRender() {
    let totalGains = 0;
    let totalConsideration = 0;
    let totalDisposals = currentCalculatedRecords.length;

    currentCalculatedRecords.forEach(r => {
        totalGains += parseFloat(r.gainEur);
        totalConsideration += parseFloat(r.proceedsEur);
    });
    
    const taxableGains = Math.max(0, totalGains - 1270);
    const taxDue = taxableGains * 0.33;

    mainWindow.webContents.send('render-dashboard', {
        records: currentCalculatedRecords,
        totalGains: totalGains.toFixed(2),
        totalConsideration: totalConsideration.toFixed(2),
        totalDisposals: totalDisposals,
        taxDue: taxDue.toFixed(2)
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });