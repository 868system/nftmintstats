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
    const month = dateYMD[1];
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

        const timeStamp = new Date(parseInt(x['timeStamp']) * 1000);
        const priceETHUSD = getEthPrice(timeStamp);
        const valueETH = x['value'] / 1000000000000000000.0;
        const valueUSD = valueETH * priceETHUSD;
        const input = x['input'];
        const methodId = x['methodId'];
        const functionName = project.mintFunctions[x['methodId']];
        const numberMinted = project.getNumberMinted(methodId, input);

        const result = {
            'blockNumber'       : x['blockNumber'],
            'timeStamp'         : timeStamp,
            'hash'              : x['hash'],
            'nonce'             : x['nonce'],
            'blockHash'         : x['blockHash'],
            'transactionIndex'  : x['transactionIndex'],
            'from'              : x['from'],
            'to'                : x['to'],
            'priceETHUSD'       : priceETHUSD,
            'valueETH'          : valueETH,
            'valueUSD'          : valueUSD,
            'gas'               : x['gas'],
            'gasPrice'          : x['gasPrice'],
            'isError'           : x['isError'],
            'txreceipt_status'  : x['txreceipt_status'],
            'input'             : input,
            'contractAddress'   : x['contractAddress'],
            'cumulativeGasUsed' : x['cumulativeGasUsed'],
            'gasUsed'           : x['gasUsed'],
            //'confirmations'     : x['confirmations'],
            'methodId'          : methodId,
            'functionName'      : functionName,
            'numberMinted'      : numberMinted
        }
        return result;
    });

    const itemsTotal = mintTransactions.reduce((acc, tx) => parseInt(acc) + parseInt(tx['numberMinted']), 0);
    const items = Object.keys(project.mintFunctions).map( methodId =>
        mintTransactions.reduce((acc, tx) => tx['methodId'] == methodId ? parseInt(acc) + parseInt(tx['numberMinted']) : parseInt(acc), 0) );

    const costsETH = Object.keys(project.mintFunctions).map( methodId =>
        Math.round(mintTransactions.reduce((acc, tx) => tx['methodId'] == methodId ? parseFloat(acc) + parseFloat(tx['valueETH']) : parseFloat(acc), 0.0) * 100.0) / 100.0);
    const costsUSD = Object.keys(project.mintFunctions).map( methodId =>
        Math.round(mintTransactions.reduce((acc, tx) => tx['methodId'] == methodId ? parseFloat(acc) + parseFloat(tx['valueUSD']) : parseFloat(acc), 0.0) * 100.0) / 100.0);

    const costTotalETH  =  Math.round(mintTransactions.reduce((acc, tx) => parseFloat(acc) + parseFloat(tx['valueETH']), 0.0) * 100.0) / 100.0;
    const costTotalUSD  =  Math.round(mintTransactions.reduce((acc, tx) => parseFloat(acc) + parseFloat(tx['valueUSD']), 0.0) * 100.0) / 100.0;


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

const download = (url, currentBlock, currentData) => {

    get(url + currentBlock, (response) => {
        const chunks = [];
        response

            .on('data', (chunk) => {
                chunks.push(chunk);
            })

            .on('end', async () => {
                const content = JSON.parse(chunks.join(''));
                const transactions = content['result'];
                const itemCount = transactions.length;

                const updatedData = currentData.concat(transactions);

                const blocks = transactions.map(x => x['blockNumber']);
                const maxBlock = Math.max(...blocks);

                await new Promise(resolve => setTimeout(resolve, 5000));

                console.log(updatedData.length + ' transactions retrieved');

                if (itemCount >= 10000) {
                    download(url, maxBlock, updatedData);
                }
                else {
                    process(updatedData);
                }

            });

    });

}



// Download Etherscan data
const urlPrefix = 'https://api.etherscan.io/api?module=account&action=txlist&address=' + project.contractAddress + '&startblock=';
download(urlPrefix, 0, []);
