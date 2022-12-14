
const printCharts = (project, mintTransactions) => {

    const itemsTotal = mintTransactions.reduce((acc, tx) => parseInt(acc) + parseInt(tx['tokenCount']), 0);
    const items = Object.keys(project.mintFunctions).map( methodId =>
        mintTransactions.reduce((acc, tx) => tx['methodId'] == methodId ? parseInt(acc) + parseInt(tx['tokenCount']) : parseInt(acc), 0) );

    const costsETH = Object.keys(project.mintFunctions).map( methodId =>
        Math.round(mintTransactions.reduce((acc, tx) => tx['methodId'] == methodId ? parseFloat(acc) + parseFloat(tx['tokenValueETH'] * parseFloat(tx['tokenCount'])) : parseFloat(acc), 0.0) * 100.0) / 100.0);
    const costsUSD = Object.keys(project.mintFunctions).map( methodId =>
        Math.round(mintTransactions.reduce((acc, tx) => tx['methodId'] == methodId ? parseFloat(acc) + parseFloat(tx['tokenValueUSD'] * parseFloat(tx['tokenCount'])) : parseFloat(acc), 0.0) * 100.0) / 100.0);

    const costTotalETH  =  Math.round(mintTransactions.reduce((acc, tx) => parseFloat(acc) + parseFloat(tx['tokenValueETH'] * parseFloat(tx['tokenCount'])), 0.0) * 100.0) / 100.0;
    const costTotalUSD  =  Math.round(mintTransactions.reduce((acc, tx) => parseFloat(acc) + parseFloat(tx['tokenValueUSD'] * parseFloat(tx['tokenCount'])), 0.0) * 100.0) / 100.0;

    // Column widths
    const widthLabel = (Object.values(project.mintFunctions).reduce((a,x) => x[1].length > a ? x[1].length : a, 0) + 1).toLocaleString(undefined);
    const width1 = costTotalETH.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).length + 1;
    const width2 = costTotalUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).length + 1;

    console.log('');
    console.log('# Mint count');
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padStart(width1, '-') + '-+');
    console.log('| ' + 'Category'.padEnd(widthLabel) + '|' + 'Items'.padStart(width1) + ' |');
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padStart(width1, '-') + '-+');
    Object.values(project.mintFunctions).forEach((item, idx) => console.log('| ' + item[1].padEnd(widthLabel) + '|' + items[idx].toLocaleString(undefined).padStart(width1) + ' |'));
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padStart(width1, '-') + '-+');
    console.log('| ' + 'TOTAL'.padEnd(widthLabel) + '|' + itemsTotal.toLocaleString(undefined).padStart(width1) + ' |');
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padStart(width1, '-') + '-+');

    console.log('');
    console.log('# Mint value');
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padEnd(1 + width1, '-') + '+' + '-'.padEnd(1 + width2, '-') + '+');
    console.log('| ' + 'Category'.padEnd(widthLabel) + '|' + 'ETH'.padStart(width1) + ' |' + 'USD'.padStart(width2) + ' |');
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padEnd(1 + width1, '-') + '+' + '-'.padEnd(1 + width2, '-') + '+');
    Object.values(project.mintFunctions).forEach((item, idx) => console.log('| ' + item[1].padEnd(widthLabel) + '|' + costsETH[idx].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(width1) + ' |' + costsUSD[idx].toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(width2) + ' |'));
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padEnd(1 + width1, '-') + '+' + '-'.padEnd(1 + width2, '-') + '+');
    console.log('| ' + 'TOTAL'.padEnd(widthLabel) + '|' + costTotalETH.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(width1) + ' |' + costTotalUSD.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(width2) + ' |');
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padEnd(1 + width1, '-') + '+' + '-'.padEnd(1 + width2, '-') + '+');

    console.log('');
    console.log('# Computed value per item');
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padStart(width1, '-') + '-+');
    console.log('| ' + 'Category'.padEnd(widthLabel) + '|' + 'ETH'.padStart(width1) + ' |');
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padStart(width1, '-') + '-+');
    Object.values(project.mintFunctions).forEach((item, idx) => console.log('| ' + item[1].padEnd(widthLabel) + '|' + (Math.round((costsETH[idx]/items[idx]) * 100.0) / 100).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(width1) + ' |'));
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padStart(width1, '-') + '-+');
    console.log('| ' + 'AVERAGE'.padEnd(widthLabel) + '|' + (costTotalETH/itemsTotal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(width1) + ' |');
    console.log('+-' + '-'.padEnd(widthLabel,'-') + '+' + '-'.padStart(width1, '-') + '-+');

    console.log('');
}




export { printCharts };
