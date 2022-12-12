"use strict";

import { get } from 'https';
import { argv } from 'process';
import { projects } from './projects.js';
import { writeFile, readFileSync } from 'fs';

const myArgs = argv.slice(2);

const showError = (err) => {
    if (err) console.log(err);
}

const projectName = myArgs[0]
const project = projects(projectName);




// Preload Ethereum price data

const ethPricesRaw = readFileSync('data/eth_usd.csv', 'utf-8');
const ethPricesRows = ethPricesRaw.split(/\r\n|\n\r|\n|\r/).filter((x,i) => i>0 && x.length>0);

const ethPrices = ethPricesRows.reduce((obj, row) => {

    const rowItems = row.split(',');

    const dateYMD = rowItems[0].split('-');
    const year = dateYMD[0];
    const month = dateYMD[1] - 1; // January is 0
    const day = dateYMD[2];

    const date = new Date(year, month, day);
    const price = rowItems[5];

    return ({ ...obj, [date]: parseFloat(price)})

}, {});

const getEthPrice = (date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    return ethPrices[new Date(year, month, day)];
};


const process = (allTransactions) => {

    // Rough pruning: remove ERC721 transfers and approvals
    const mostTransactions = allTransactions.filter(x => !(['setapprovalforall', 'safetransferfrom', 'transferfrom'].includes(x['functionName'].split('(')[0].toLowerCase())));

    // Filter only the transactions that were mints
    const mintTransactionsRaw = mostTransactions.filter(x => Object.keys(project.mintFunctions).includes(x['methodId']));

    // Make sure that each transaction only has one entry
    const mintTransactionsUnique = mintTransactionsRaw.filter((x, i, a) => a.findIndex((y) => y['hash'] == x['hash']) == i);

    // Remove entries that resulted in errors
    const mintTransactionsSuccessful = mintTransactionsUnique.filter(x => x['isError'] == 0);

    // Discard info we won't use, especially non-static fields like 'confirmations'
    const mintTransactions = mintTransactionsSuccessful.map(x => {

        const isoDate = new Date(parseInt(x['timeStamp']) * 1000);
        const priceETHUSD = getEthPrice(isoDate);
        const valueETH = x['value'] / 1000000000000000000.0;
        const valueUSD = valueETH * priceETHUSD;
        const input = x['input'];
        const methodId = x['methodId'];
        const functionInfo = project.mintFunctions[methodId];
        const numberMinted = project.getNumberMinted(methodId, input);

        const result = {
            // 1:1 copy of downloaded stats
            'blockNumber'       : x['blockNumber'],
            'timeStamp'         : x['timeStamp'],
            'hash'              : x['hash'],
            'nonce'             : x['nonce'],
            'blockHash'         : x['blockHash'],
            'transactionIndex'  : x['transactionIndex'],
            'from'              : x['from'],
            'to'                : x['to'],
            'value'             : x['value'],
            'gas'               : x['gas'],
            'gasPrice'          : x['gasPrice'],
            'isError'           : x['isError'],
            'txreceipt_status'  : x['txreceipt_status'],
            'input'             : x['input'],
            'contractAddress'   : x['contractAddress'],
            'cumulativeGasUsed' : x['cumulativeGasUsed'],
            'gasUsed'           : x['gasUsed'],
            'confirmations'     : x['confirmations'],
            'methodId'          : x['methodId'],
            'functionName'      : x['functionName'],
            // derived stats
            '_functionInfo'     : functionInfo,
            '_isoDate'          : isoDate,
            '_numberMinted'     : numberMinted,
            '_valueETH'         : valueETH,
            '_valueUSD'         : valueUSD,
            '_priceETHUSD'      : priceETHUSD
        }

        return result;
    });

    const itemsTotal = mintTransactions.reduce((acc, tx) => parseInt(acc) + parseInt(tx['_numberMinted']), 0);
    const items = Object.keys(project.mintFunctions).map( methodId =>
        mintTransactions.reduce((acc, tx) => tx['methodId'] == methodId ? parseInt(acc) + parseInt(tx['_numberMinted']) : parseInt(acc), 0) );

    const costsETH = Object.keys(project.mintFunctions).map( methodId =>
        Math.round(mintTransactions.reduce((acc, tx) => tx['methodId'] == methodId ? parseFloat(acc) + parseFloat(tx['_valueETH']) : parseFloat(acc), 0.0) * 100.0) / 100.0);
    const costsUSD = Object.keys(project.mintFunctions).map( methodId =>
        Math.round(mintTransactions.reduce((acc, tx) => tx['methodId'] == methodId ? parseFloat(acc) + parseFloat(tx['_valueUSD']) : parseFloat(acc), 0.0) * 100.0) / 100.0);

    const costTotalETH  =  Math.round(mintTransactions.reduce((acc, tx) => parseFloat(acc) + parseFloat(tx['_valueETH']), 0.0) * 100.0) / 100.0;
    const costTotalUSD  =  Math.round(mintTransactions.reduce((acc, tx) => parseFloat(acc) + parseFloat(tx['_valueUSD']), 0.0) * 100.0) / 100.0;


    // TODO: Maybe this console output section can be relocated

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

    writeFile('data/' + projectName + '_raw.json', JSON.stringify(mostTransactions), showError);
    writeFile('data/' + projectName + '_parsed.json', JSON.stringify(mintTransactions), showError);
}

const urls = {
    'transfers'    : 'https://api.etherscan.io/api?module=account&action=tokennfttx&address=0x0000000000000000000000000000000000000000&contractaddress=' + project.contractAddress + '&startblock=',
    'transactions' : 'https://api.etherscan.io/api?module=account&action=txlist&address=' + project.contractAddress + '&startblock='
}


const download = async (urls, _dataSets, _currentDataSetKey, _currentContent) => {

    const currentContent = _currentContent !== undefined ? _currentContent : [];

    const dataSets = _dataSets !== undefined ? _dataSets : {};

    const currentBlock = currentContent.length == 0 ? 0 :
                         Math.max(...currentContent.map(x => x['blockNumber']));

    const dataSetKey = _currentDataSetKey !== undefined ? _currentDataSetKey :
                       Object.keys(urls).find(x => !Object.keys(dataSets).includes(x));

    // If all URLs have been retrieved, dataSets will have
    // the same keys as urls, and dataSetKey will be undefined
    if (dataSetKey === undefined) {
        // Proceed to process the datasets
        process(dataSets['transactions']);
    }
    else {
        const url = urls[dataSetKey];

        await new Promise(resolve => setTimeout(resolve, 5000));

        get(url + currentBlock, (response) => {
            const chunks = [];
            response
                .on('data', (chunk) => chunks.push(chunk))
                .on('end', () => {

                    const content = JSON.parse(chunks.join(''))['result'];
                    const updatedContent = currentContent.concat(content);

                    console.log(updatedContent.length + ' records retrieved from \'' + dataSetKey+ '\'' );

                    if (content.length >= 10000) {
                        download(urls, dataSets, dataSetKey, updatedContent);
                    }
                    else {
                        const updatedDataSet = {...dataSets, [dataSetKey]: updatedContent};
                        download(urls, updatedDataSet);
                    }

                });
        });
    }
}

const start = () => {
    download(urls);
}
start();
