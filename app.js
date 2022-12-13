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


const process = (allTransfers, allTransactions) => {

    // One transfer per token only
    // (overlap is expected because of how we download from Etherscan)
    const uniqueTokenTransfers = allTransfers.filter((x, i, a) => a.findIndex((y) => y['tokenID'] == x['tokenID']) == i);

    // Construct an object containing each token's complete mint information
    // Use data from both transfers and transactions
    const tokenMints = uniqueTokenTransfers.map(thisTokenTransfer => {

        const thisTokenTransaction = allTransactions.find(x => x['isError'] == 0 && x['hash'] == thisTokenTransfer['hash']);

        if (thisTokenTransaction === undefined) {
            console.log('Warning: The contract used in transaction: \n' + thisTokenTransfer['hash'] + '\nneeds to be added to projects.js\n');
            //writeFile('data/' + projectName + '_problem_transfer.json', JSON.stringify(thisTokenTransfer), showError);
        }

        const thisTokenMint = {
            // Common fields
            'blockNumber'       : thisTokenTransfer['blockNumber'],
            'timeStamp'         : thisTokenTransfer['timeStamp'],
            'hash'              : thisTokenTransfer['hash'],
            'nonce'             : thisTokenTransfer['nonce'],
            'blockHash'         : thisTokenTransfer['blockHash'],
            'transactionIndex'  : thisTokenTransfer['transactionIndex'],
            'gas'               : thisTokenTransfer['gas'],
            'gasPrice'          : thisTokenTransfer['gasPrice'],
            'gasUsed'           : thisTokenTransfer['gasUsed'],
            'cumulativeGasUsed' : thisTokenTransfer['cumulativeGasUsed'],

            // Transfer
            'tokenID'      : thisTokenTransfer['tokenID'],
            'tokenName'    : thisTokenTransfer['tokenName'],
            'tokenSymbol'  : thisTokenTransfer['tokenSymbol'],
            'tokenDecimal' : thisTokenTransfer['tokenDecimal'],

            // Transaction
            'value'            : thisTokenTransaction['value'],
            'isError'          : thisTokenTransaction['isError'],
            'txreceipt_status' : thisTokenTransaction['txreceipt_status'],
            'methodId'         : thisTokenTransaction['methodId'],
            'functionName'     : thisTokenTransaction['functionName'],

            // Collisions Transfer
            // "from": "0x0000000000000000000000000000000000000000",
            // "to": "0xc4f4325490842426816764958a234857df4d150a",
            'contractAddress' : thisTokenTransfer['contractAddress'],
            // "input": "deprecated",

            // Collisions Transaction
            // "from": "0xc4f4325490842426816764958a234857df4d150a",
            // "to": "0x160c404b2b49cbc3240055ceaee026df1e8497a0",
            // "contractAddress": "",
            'input' : thisTokenTransaction['input'],


            // Discarded
            // "confirmations": "1456461"
        };
        return thisTokenMint;

    });













    // Rough pruning: remove ERC721 transfers and approvals
    const mostTransactions = allTransactions.filter(x => !(['setapprovalforall', 'safetransferfrom', 'transferfrom'].includes(x['functionName'].split('(')[0].toLowerCase())));

    // Filter only the transactions that were mints
    const mintTransactionsRaw = mostTransactions.filter(x => Object.keys(project.mintFunctions).includes(x['methodId']));

    // Make sure that each transaction only has one entry
    const mintTransactionsUnique = mintTransactionsRaw.filter((x, i, a) => a.findIndex((y) => y['hash'] == x['hash']) == i);

    // Remove entries that resulted in errors
    const mintTransactionsSuccessful = mintTransactionsUnique.filter(x => x['isError'] == 0);

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

    writeFile('data/' + projectName + '_mints.json', JSON.stringify(tokenMints), showError);
    writeFile('data/' + projectName + '_transfers.json', JSON.stringify(uniqueTokenTransfers), showError);
    writeFile('data/' + projectName + '_raw.json', JSON.stringify(mostTransactions), showError);
    writeFile('data/' + projectName + '_parsed.json', JSON.stringify(mintTransactions), showError);
}

const urls = ['https://api.etherscan.io/api?module=account&action=tokennfttx&address=0x0000000000000000000000000000000000000000&contractaddress=' + project.contractAddresses[0] + '&startblock=']
    .concat(project.contractAddresses.map(x => 'https://api.etherscan.io/api?module=account&action=txlist&address=' + x + '&startblock='))

const download = async (urls, _currentUrlIdx, _transfers, _transactions, _currentContent) => {

    const currentUrlIdx = _currentUrlIdx !== undefined ? _currentUrlIdx : 0;
    const transfers     = _transfers     !== undefined ? _transfers     : [];
    const transactions  = _transactions  !== undefined ? _transactions  : [];

    if (currentUrlIdx >= urls.length) {
        // Proceed to process the datasets
        process(transfers, transactions);
    }

    else {

        const url = urls[currentUrlIdx];

        // either 'txlist' or 'tokennfttx'
        const dataSet = url.split('action=')[1].split('&')[0];

        const currentContent = _currentContent !== undefined ? _currentContent : [];
        const currentBlock = currentContent.length == 0 ? 0 :
                            Math.max(...currentContent.map(x => x['blockNumber']));

        await new Promise(resolve => setTimeout(resolve, 5000));

        get(url + currentBlock, (response) => {
            const chunks = [];
            response
                .on('data', (chunk) => chunks.push(chunk))
                .on('end', () => {

                    const content = JSON.parse(chunks.join(''))['result'];
                    const updatedContent = currentContent.concat(content);

                    console.log(updatedContent.length + ' records retrieved from [' + currentUrlIdx + '] \'' + dataSet + '\'' );

                    if (content.length >= 10000) {
                        download(urls, currentUrlIdx, transfers, transactions, updatedContent);
                    }
                    else {
                        const updatedTransfers = dataSet == 'tokennfttx' ? transfers.concat(updatedContent) : transfers;
                        const updatedTransactions = dataSet == 'txlist' ? transactions.concat(updatedContent) : transactions;

                        download(urls, currentUrlIdx + 1, updatedTransfers, updatedTransactions);
                    }

                });
        });
    }
}

const start = () => {
    download(urls);
}
start();
