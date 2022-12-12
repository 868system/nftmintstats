"use strict";

import { get } from 'https';
import { argv } from 'process';
import { writeFile, readFileSync } from 'fs';

import { projects } from './projects.js';
import { printCharts } from './visualizers.js'


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


const process = (dataSets) => {

    const allTransactions = dataSets['transactions'];

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

    printCharts(project, mintTransactions);

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
        process(dataSets);
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
